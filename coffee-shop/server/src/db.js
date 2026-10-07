import pg from "pg";

/**
 * MOT Pool duy nhat cho ca process.
 *
 * Khong tao Client moi moi request: moi ket noi Postgres ton mot lan handshake
 * (TLS + auth), va neu moi request mo mot pool rieng thi so ket noi se tang
 * khong gioi han cho den khi dung max_connections cua server.
 *
 * Pool doc cau hinh tu cac bien PG* chuan cua libpq (PGHOST, PGPORT,
 * PGDATABASE, PGUSER, PGPASSWORD) nen khong can truyen gi o day. Tach thanh
 * bien roi thay vi mot connection URI co mot ly do thuc te: password chua
 * @ : / ? hoac # thi khong phai url-encode.
 */
export const pool = new pg.Pool({
    // Du cho mot app nho. Dat tuong minh de khong phu thuoc mac dinh cua driver.
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
});

/**
 * Chay mot query co tham so.
 *
 * LUON truyen gia tri qua mang params, khong bao gio noi vao chuoi SQL. pg gui
 * chung duoi dang parameter cua prepared statement, nen gia tri khong bao gio
 * duoc parse thanh SQL - ke ca khi no chua dau nhay hay dau cham phay.
 *
 * @param {string} sql    cau SQL dung placeholder $1, $2, ...
 * @param {unknown[]} params gia tri tuong ung
 */
export async function query(sql, params = []) {
    const result = await pool.query(sql, params);
    return result.rows;
}

/**
 * Chay nhieu cau trong MOT transaction tren cung mot connection.
 *
 * Can thiet khi ghi don hang: customer_order va order_item phai cung thanh cong
 * hoac cung that bai. pool.query() moi lan co the lay mot connection khac nhau,
 * nen BEGIN o lan nay va COMMIT o lan khac se khong cung mot transaction.
 */
export async function withTransaction(callback) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const result = await callback(client);
        await client.query("COMMIT");
        return result;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        // Phai tra connection ve pool trong moi truong hop, ke ca khi loi.
        // Thieu dong nay la pool can dan roi treo o request thu 11.
        client.release();
    }
}
