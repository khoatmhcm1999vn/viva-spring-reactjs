/*
 * Moi HTTP call cua app di qua file nay. Component khong goi fetch truc tiep.
 *
 * VITE_API_URL bi NUNG vao bundle luc build va khong doc duoc luc chay. Doi URL
 * API thi phai build lai. Va vi no nam trong file tinh cong khai, dung bao gio
 * dat secret vao bien VITE_*.
 *
 * Mac dinh la "/api" tuong doi: luc dev Vite proxy sang localhost:4000, luc
 * deploy thi reverse proxy quyet dinh backend o dau.
 */
const BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

async function request(path, options = {}) {
    const response = await fetch(BASE_URL + path, {
        headers: { "Content-Type": "application/json" },
        ...options,
    });

    /*
     * Doc body MOT lan roi moi quyet dinh. response.json() chi goi duoc mot
     * lan, nen khong the thu json() roi fallback sang text().
     *
     * Can den text() vi khi cau hinh sai, reverse proxy hay SPA fallback co the
     * tra ve index.html kem status 200 - luc do json() nem "Unexpected token <"
     * va loi do khong chi ra nguyen nhan that.
     */
    const raw = await response.text();
    let body = null;
    if (raw) {
        try {
            body = JSON.parse(raw);
        } catch {
            throw new Error(
                "Server tra ve noi dung khong phai JSON (HTTP " +
                    response.status +
                    "). Kiem tra VITE_API_URL va proxy.",
            );
        }
    }

    if (!response.ok) {
        throw new Error(body?.error ?? "Request that bai (HTTP " + response.status + ")");
    }

    return body;
}

export function fetchProducts({ category, limit = 20, offset = 0 } = {}) {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (category) {
        params.set("category", category);
    }
    return request("/products?" + params.toString());
}

export function fetchCategories() {
    return request("/products/meta/categories");
}

export function fetchOrder(id) {
    return request("/orders/" + id);
}

export function createOrder({ customerName, items }) {
    return request("/orders", {
        method: "POST",
        body: JSON.stringify({ customerName, items }),
    });
}
