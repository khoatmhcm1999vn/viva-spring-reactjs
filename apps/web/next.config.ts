import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tailwind 4 duoc xu ly qua turbopack loader thay vi postcss.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  // cacheComponents va partialPrefetching (mac dinh cua create-next-app 16) da bi tat:
  // chung doi cach fetch du lieu phia server, trong khi du an nay dung TanStack Query
  // o client va goi API NestJS. Bat lai la mot quyet dinh rieng, can test kem theo.

  typescript: {
    // Khong cho build di qua loi type. typecheck cung chay rieng trong gate.
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
