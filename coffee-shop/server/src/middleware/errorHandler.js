import { ZodError } from "zod";

/**
 * Loi do chinh ung dung nem ra, co san HTTP status.
 */
export class AppError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

export function notFoundHandler(req, res) {
    res.status(404).json({ error: "Khong tim thay route " + req.method + " " + req.originalUrl });
}

/**
 * Error middleware duy nhat.
 *
 * Express 5 tu bat loi tu handler async, nen route khong can try/catch chi de
 * goi next(err). Moi loi deu doi ve day.
 *
 * Bon tham so la BAT BUOC: Express phan biet error middleware voi middleware
 * thuong bang so luong tham so. Bo "next" di la no thanh middleware thuong va
 * khong bao gio nhan duoc loi.
 */
export function errorHandler(err, req, res, next) {
    if (err instanceof ZodError) {
        return res.status(400).json({
            error: "Du lieu gui len khong hop le",
            details: err.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message,
            })),
        });
    }

    if (err instanceof AppError) {
        return res.status(err.status).json({ error: err.message });
    }

    // Loi khong luong truoc: ghi log day du o server, nhung tra ve client mot
    // thong bao chung. Chi tiet loi Postgres co the ho ten bang, ten cot va ca
    // mot phan cau SQL - khong gui ra ngoai.
    console.error("[error]", err);
    res.status(500).json({ error: "Loi noi bo" });
}
