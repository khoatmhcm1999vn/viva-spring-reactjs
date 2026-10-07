import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";

import { pool } from "./db.js";
import { productsRouter } from "./routes/products.js";
import { ordersRouter } from "./routes/orders.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(helmet());
app.use(express.json({ limit: "100kb" }));

/*
 * CORS chi mo cho dung origin duoc cau hinh.
 *
 * Khong dung origin: "*" - repo nay da tung co bai hoc do o Vivacon, noi
 * addAllowedOriginPattern("*") di kem allowCredentials(true) khien bat ky trang
 * web nao cung goi duoc API tu trinh duyet cua khach.
 *
 * Luc dev thuc ra khong can CORS: Vite proxy /api sang cung origin
 * (xem client/vite.config.js). Cau hinh nay danh cho khi client duoc build va
 * phuc vu tu mot domain khac.
 */
const corsOrigin = process.env.CORS_ORIGIN?.trim();
if (corsOrigin) {
    app.use(cors({ origin: corsOrigin.split(",").map((value) => value.trim()) }));
} else {
    console.warn("[warn] CORS_ORIGIN rong: moi request cross-origin se bi tu choi.");
}

app.get("/api/health", async (req, res) => {
    // Goi that vao database, khong chi tra 200. Mot healthcheck khong cham
    // database se bao "UP" ngay ca khi datasource da chet.
    const result = await pool.query("SELECT 1 AS ok");
    res.json({ status: "UP", db: result.rows[0].ok === 1 });
});

app.use("/api/products", productsRouter);
app.use("/api/orders", ordersRouter);

// Thu tu BAT BUOC: notFound truoc errorHandler, va ca hai sau moi router.
app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(port, () => {
    console.log("[server] dang nghe tai http://localhost:" + port);
    console.log("[server] CANH BAO: API khong co authentication, dung expose ra Internet.");
});

/*
 * Dong pool khi nhan SIGTERM/SIGINT.
 *
 * Khong co doan nay thi ket noi dang mo bi cat dot ngot, va Postgres phai tu
 * doi timeout moi thu hoi.
 */
for (const signal of ["SIGTERM", "SIGINT"]) {
    process.on(signal, () => {
        console.log("[server] nhan " + signal + ", dang dong...");
        server.close(async () => {
            await pool.end();
            process.exit(0);
        });
    });
}
