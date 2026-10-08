import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    server: {
        // 5173 la mac dinh cua Vite. Giu nguyen de khong tranh cong voi cac
        // dev server khac thuong dung 3000.
        port: 5173,
        proxy: {
            /*
             * Proxy /api sang Express.
             *
             * Nho vay luc dev trinh duyet thay moi thu tren cung mot origin,
             * tuc KHONG co request cross-origin va khong can CORS. Doi lai,
             * CORS chi duoc kiem thu khi build that - dung ket luan "CORS da
             * dung" chi vi dev server chay duoc.
             */
            "/api": {
                target: "http://localhost:4000",
                changeOrigin: true,
            },
        },
    },
});
