import { Router } from "express";
import { z } from "zod";
import { query, withTransaction } from "../db.js";
import { AppError } from "../middleware/errorHandler.js";

export const ordersRouter = Router();

/*
 * productId dung z.coerce, KHONG phai z.number().
 *
 * Driver pg tra cot BIGINT (int8) ve JavaScript duoi dang STRING, giong nhu
 * NUMERIC - de khong mat chinh xac voi so vuot Number.MAX_SAFE_INTEGER. Nghia
 * la GET /api/products tra "id":"2", nen client lam dung bai ban
 * (productId: product.id) se gui len mot STRING.
 *
 * Da do: voi z.number() thi productId: 1 tra 201 con productId: "1" tra 400.
 * Day la bug that, phat hien khi smoke test chu khong phai khi doc code.
 */
const createOrderSchema = z.object({
    customerName: z.string().trim().min(1).max(150),
    items: z
        .array(
            z.object({
                productId: z.coerce.number().int().positive(),
                quantity: z.coerce.number().int().min(1).max(99),
            }),
        )
        .min(1, "Don hang phai co it nhat mot dong"),
});

/**
 * GET /api/orders/:id
 *
 * Tra don hang kem cac dong chi tiet.
 *
 * Co y dung HAI query thay vi mot join: don hang va dong chi tiet la quan he
 * 1:N, nen join mot lan se lam thong tin don hang bi nhan len theo so dong.
 * Gop lai o tang ung dung thi phai tu de-duplicate, hoac dung DISTINCT - ma
 * DISTINCT de che join sai la dieu sql-query-style.md cam.
 */
ordersRouter.get("/:id", async (req, res) => {
    const id = z.coerce.number().int().positive().parse(req.params.id);

    const orderRows = await query(
        `SELECT
             ord.id,
             ord.order_code,
             ord.customer_name,
             ord.status,
             ord.total_amount,
             ord.currency_code,
             ord.created_at
         FROM coffee.customer_order ord
         WHERE ord.id = $1`,
        [id],
    );

    if (orderRows.length === 0) {
        throw new AppError(404, "Khong tim thay don hang " + id);
    }

    const itemRows = await query(
        `SELECT
             item.id,
             item.quantity,
             item.unit_price,
             item.line_amount,
             prod.sku,
             prod.name AS product_name
         FROM coffee.order_item item,
              coffee.product prod
         WHERE item.product_id = prod.id
           AND item.order_id = $1
         ORDER BY item.id`,
        [id],
    );

    res.json({ ...orderRows[0], items: itemRows });
});

/**
 * POST /api/orders
 *
 * CANH BAO: endpoint nay khong co authentication. Bat ky ai goi duoc cung tao
 * duoc don hang. Xem phan gioi han trong coffee-shop/README.md.
 */
ordersRouter.post("/", async (req, res) => {
    const { customerName, items } = createOrderSchema.parse(req.body);

    const productIds = items.map((item) => item.productId);

    // Mot productId gui trung hai lan se vi pham uq_order_item, va loi se la
    // 23505 kho hieu. Bat som o day de tra loi ro rang.
    if (new Set(productIds).size !== productIds.length) {
        throw new AppError(400, "Mot san pham chi duoc xuat hien mot lan trong don hang");
    }

    const order = await withTransaction(async (client) => {
        /*
         * Doc gia tu DATABASE, khong tin gia do client gui len. Day la diem
         * quan trong nhat cua handler: neu lay unit_price tu request thi nguoi
         * dung tu dat gia cho minh.
         *
         * = ANY($1) thay vi IN (...): so luong phan tu khong co dinh, ma ghep
         * chuoi placeholder dong la duong de lot SQL injection. ANY nhan ca
         * mang qua MOT tham so.
         *
         * Loc is_available ngay trong query de khong ban duoc mon da het.
         */
        const availableProducts = await client.query(
            `SELECT
                 prod.id,
                 prod.price,
                 prod.currency_code
             FROM coffee.product prod
             WHERE prod.id = ANY($1::BIGINT[])
               AND prod.is_available = TRUE`,
            [productIds],
        );

        if (availableProducts.rows.length !== productIds.length) {
            throw new AppError(400, "Co san pham khong ton tai hoac da het hang");
        }

        // Khong cong tien khac currency. Voi boilerplate thi chan thang.
        const currencies = new Set(availableProducts.rows.map((row) => row.currency_code));
        if (currencies.size > 1) {
            throw new AppError(400, "Khong the gop nhieu loai tien trong mot don hang");
        }

        const priceById = new Map(availableProducts.rows.map((row) => [String(row.id), row.price]));

        const orderCode = "ORD-" + Date.now().toString(36).toUpperCase();

        // total_amount tam de 0, chot lai sau khi chen xong cac dong.
        const inserted = await client.query(
            `INSERT INTO coffee.customer_order (order_code, customer_name, currency_code)
             VALUES ($1, $2, $3)
             RETURNING id, order_code, customer_name, status, currency_code, created_at`,
            [orderCode, customerName, [...currencies][0]],
        );

        const orderId = inserted.rows[0].id;

        for (const item of items) {
            await client.query(
                `INSERT INTO coffee.order_item (order_id, product_id, quantity, unit_price)
                 VALUES ($1, $2, $3, $4)`,
                [orderId, item.productId, item.quantity, priceById.get(String(item.productId))],
            );
        }

        /*
         * Tinh tong tu chinh cac dong vua chen.
         *
         * SUM chay trong Postgres chu khong phai trong JavaScript: pg tra
         * NUMERIC ve dang string de khong mat chinh xac, nen parseFloat roi
         * cong o JS la tu bo di su chinh xac do.
         *
         * line_amount la cot GENERATED (quantity * unit_price) nen khong can
         * tinh lai.
         */
        const totals = await client.query(
            `UPDATE coffee.customer_order ord
                SET total_amount = agg.order_total
               FROM (
                        SELECT
                            item.order_id,
                            SUM(item.line_amount) AS order_total
                        FROM coffee.order_item item
                        WHERE item.order_id = $1
                        GROUP BY item.order_id
                    ) agg
              WHERE ord.id = agg.order_id
                AND ord.id = $1
          RETURNING ord.total_amount`,
            [orderId],
        );

        return { ...inserted.rows[0], total_amount: totals.rows[0].total_amount };
    });

    res.status(201).json(order);
});
