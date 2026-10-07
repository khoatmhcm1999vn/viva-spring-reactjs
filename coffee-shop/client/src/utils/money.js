/*
 * Driver pg tra cot NUMERIC ve duoi dang STRING, khong phai number - co y, de
 * khong mat chinh xac voi so lon hoac nhieu chu so thap phan.
 *
 * Nen o day chi dinh dang DE HIEN THI. Khong cong, khong nhan tien o phia
 * client: moi phep tinh tien phai lam trong SQL (xem routes/orders.js).
 */
export function formatMoney(amount, currencyCode = "VND") {
    const numeric = Number(amount);

    if (Number.isNaN(numeric)) {
        return String(amount);
    }

    try {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: currencyCode,
            // VND khong dung phan thap phan; Intl tu biet dieu nay theo ma tien.
            maximumFractionDigits: currencyCode === "VND" ? 0 : 2,
        }).format(numeric);
    } catch {
        // Ma tien la khong hop le voi Intl: hien so tho con hon vo man hinh.
        return numeric.toLocaleString("vi-VN") + " " + currencyCode;
    }
}
