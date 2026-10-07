import { Router } from "express";
import { z } from "zod";
import { query } from "../db.js";
import { AppError } from "../middleware/errorHandler.js";

export const productsRouter = Router();

/**
 * Query string cho GET /api/products.
 *
 * coerce vi query string luon la string: "?limit=10" cho limit = "10", can
 * chuyen thanh so truoc khi validate khoang.
 */
const listQuerySchema = z.object({
    category: z.string().trim().min(1).max(50).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
});

/**
 * GET /api/products
 * GET /api/products?category=espresso&limit=10&offset=0
 *
 * Inner join kieu cu: bang ngan bang dau phay trong FROM, dieu kien lien ket
 * nam trong WHERE (xem sql-query-style.md).
 *
 * Cac gia tri runtime deu di qua $1..$4, khong noi vao chuoi.
 *
 * ORDER BY co prod.id o cuoi: cat.sort_order va prod.name mot minh khong duy
 * nhat, nen neu thieu khoa phan biet thi phan trang co the tra trung hoac bo
 * sot dong giua cac trang.
 */
productsRouter.get("/", async (req, res) => {
    const { category, limit, offset } = listQuerySchema.parse(req.query);

    const rows = await query(
        `SELECT
             prod.id,
             prod.sku,
             prod.name,
             prod.description,
             prod.price,
             prod.currency_code,
             cat.slug AS category_slug,
             cat.name AS category_name
         FROM coffee.product prod,
              coffee.category cat
         WHERE prod.category_id = cat.id
           AND prod.is_available = TRUE
           AND cat.is_active = TRUE
           AND ($1::VARCHAR IS NULL OR cat.slug = $1)
         ORDER BY cat.sort_order, prod.name, prod.id
         LIMIT $2 OFFSET $3`,
        [category ?? null, limit, offset],
    );

    res.json({ items: rows, limit, offset });
});

/**
 * GET /api/products/:id
 */
productsRouter.get("/:id", async (req, res) => {
    const id = z.coerce.number().int().positive().parse(req.params.id);

    const rows = await query(
        `SELECT
             prod.id,
             prod.sku,
             prod.name,
             prod.description,
             prod.price,
             prod.currency_code,
             prod.is_available,
             cat.slug AS category_slug,
             cat.name AS category_name
         FROM coffee.product prod,
              coffee.category cat
         WHERE prod.category_id = cat.id
           AND prod.id = $1`,
        [id],
    );

    if (rows.length === 0) {
        throw new AppError(404, "Khong tim thay san pham " + id);
    }

    res.json(rows[0]);
});

/**
 * GET /api/products/meta/categories
 *
 * Join 1:N co aggregate. Dem san pham theo danh muc bang mot GROUP BY o phia N
 * thay vi join roi dem o tang ung dung.
 *
 * Duong dan la /meta/categories chu khong phai /categories: Express 5 so khop
 * route theo thu tu khai bao, nen "/categories" se bi "/:id" o tren bat truoc
 * va roi vao nhanh parse id -> loi validate.
 */
productsRouter.get("/meta/categories", async (req, res) => {
    const rows = await query(
        `SELECT
             cat.slug,
             cat.name,
             COUNT(prod.id) AS product_count
         FROM coffee.category cat,
              coffee.product prod
         WHERE cat.id = prod.category_id
           AND cat.is_active = TRUE
           AND prod.is_available = TRUE
         GROUP BY cat.slug, cat.name, cat.sort_order
         ORDER BY cat.sort_order`,
        [],
    );

    res.json({ items: rows });
});
