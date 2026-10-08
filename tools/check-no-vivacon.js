#!/usr/bin/env node
/*
 * Kiem chung nhanh nay khong con gi cua Vivacon.
 *
 *   node tools/check-no-vivacon.js
 *
 * Exit 0 neu sach, 1 neu con sot. Chi kiem cac file DANG DUOC GIT TRACK - day la
 * noi dung thuc su cua nhanh. File gitignored tren disk (target/, logs/, config/,
 * .env, .idea/) khong thuoc nhanh nen khong tinh; xem ghi chu o cuoi.
 *
 * Khong phu thuoc package ngoai: chi dung child_process + fs.
 */

"use strict";

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

/*
 * Chinh file nay. Phai loai khoi MOI phep kiem noi dung: no buoc phai chua ten
 * du an can tim VA danh sach cong can tim, nen khong the tu kiem chinh minh.
 * Phep kiem duong dan (muc 1) van ap dung binh thuong.
 */
const SELF = "tools/check-no-vivacon.js";

function tracked() {
    return execSync("git ls-files", { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })
        .split(/\r?\n/)
        .filter(Boolean);
}

const files = tracked();
const failures = [];

function fail(check, detail) {
    failures.push({ check, detail });
}

// -------------------------------------------------------------------------
// 1. Khong con duong dan nao cua Vivacon
// -------------------------------------------------------------------------
const FORBIDDEN_PATHS = [
    { re: /^pom\.xml$/, what: "Maven manifest" },
    { re: /^mvnw(\.cmd)?$/, what: "Maven wrapper" },
    { re: /^\.mvn\//, what: "Maven wrapper config" },
    { re: /^src\//, what: "source Spring Boot" },
    { re: /^frontend\//, what: "frontend React 17 (CRA)" },
    { re: /^container\//, what: "SQL schema + stored procedure cua Vivacon" },
    { re: /^mock_data\//, what: "seed data cua Vivacon" },
    { re: /^postman_collection\//, what: "Postman collection cua Vivacon" },
    { re: /^BA Document\//, what: "tai lieu BA cua Vivacon" },
    { re: /^docs\//, what: "docs cua Vivacon" },
    { re: /^GeoLite2-City\.mmdb$/, what: "MaxMind DB (GeolocationConfiguration)" },
    { re: /^\.kiro\/steering\/(tech|structure|product|deployment|repo-map|git-multi-app-isolation)\.md$/, what: "steering cua Vivacon / cua repo hai app" },
];

for (const f of files) {
    for (const { re, what } of FORBIDDEN_PATHS) {
        if (re.test(f)) fail("duong dan Vivacon", f + "  (" + what + ")");
    }
}

// -------------------------------------------------------------------------
// 2. Khong con config Docker nao o GOC repo
//
// Vivacon co Dockerfile + 3 file docker-compose*.yml o goc. Coffee shop chi
// duoc phep co coffee-shop/docker-compose.yml.
// -------------------------------------------------------------------------
const rootDocker = files.filter((f) =>
    /^(Dockerfile|\.dockerignore|docker-compose.*\.yml|\.env\.example)$/.test(f),
);
for (const f of rootDocker) {
    fail("config Docker o goc repo", f);
}

const composeFiles = files.filter((f) => /docker-compose.*\.ya?ml$/.test(f));
const allowedCompose = ["coffee-shop/docker-compose.yml"];
for (const f of composeFiles) {
    if (!allowedCompose.includes(f)) fail("compose file ngoai pham vi", f);
}
for (const f of allowedCompose) {
    if (!files.includes(f)) fail("thieu compose file can co", f);
}

// -------------------------------------------------------------------------
// 3. Khong con chuoi nao cua Vivacon trong noi dung file
//
// Bo qua lockfile (chi la hash/registry URL) va file nhi phan.
// -------------------------------------------------------------------------
const CONTENT_PATTERNS = [
    { re: /\bvivacon\b/i, what: "ten du an Vivacon" },
    { re: /springframework|spring-boot|SpringBootApplication/, what: "Spring Boot" },
    { re: /REACT_APP_/, what: "bien moi truong cua CRA" },
    { re: /react-scripts/, what: "CRA build tool" },
    { re: /Vivacon-0\.0\.1-SNAPSHOT/, what: "artifact Maven" },
    { re: /\bmvnw\b/, what: "Maven wrapper" },
    { re: /jdbc:postgresql/, what: "JDBC URL (Java)" },
    { re: /trycloudflare|supabase\.com/, what: "ha tang deploy cua Vivacon" },
];

/*
 * Hai file duoc MIEN TRU co y, va chi hai file cu the nay - khong noi long
 * pattern chung:
 *
 *   README.md                  chua canh bao "khong merge nhanh nay vao main",
 *                              va canh bao do bat buoc phai goi ten Vivacon
 *                              moi co nghia.
 *
 *   tools/check-no-vivacon.js  chinh la file nay. No phai chua moi chuoi can
 *                              tim, nen khong tu kiem chinh minh duoc.
 */
const SKIP_CONTENT = /(^|\/)package-lock\.json$|\.mmdb$|\.drawio$|^LICENSE$|^README\.md$/;

for (const f of files) {
    if (f === SELF || SKIP_CONTENT.test(f)) continue;
    const full = path.join(ROOT, f);
    if (!fs.existsSync(full)) continue;

    let text;
    try {
        text = fs.readFileSync(full, "utf8");
    } catch {
        continue;
    }

    const lines = text.split(/\r?\n/);
    for (const { re, what } of CONTENT_PATTERNS) {
        lines.forEach((line, i) => {
            if (re.test(line)) {
                fail("chuoi Vivacon trong noi dung", f + ":" + (i + 1) + "  (" + what + ")  " + line.trim().slice(0, 80));
            }
        });
    }
}

// -------------------------------------------------------------------------
// 4. Khong con cong nao cua Vivacon trong config
//
// Vivacon dung 5433 (db), 8090/8091 (backend), 3000/8081 (frontend),
// 8900/8901 (adminer). Coffee shop chi dung 5434, 4000, 5173.
// -------------------------------------------------------------------------
const VIVACON_PORTS = [3000, 5432, 5433, 8080, 8081, 8090, 8091, 8900, 8901];

/*
 * Chi quet file CAU HINH. Markdown bi loai co y: tai lieu can noi ro "tranh
 * cong 5432, 8080, 3000" moi huu ich, va mot con so trong cau van khong cau
 * hinh gi ca. Lan chay truoc da bao sai 8 cho vi quet ca .md.
 */
const PORT_FILES = files.filter(
    (f) =>
        /\.(ya?ml|json|js|jsx|env|example|sql)$/.test(f) &&
        !/package-lock\.json$/.test(f) &&
        f !== SELF,
);

for (const f of PORT_FILES) {
    const full = path.join(ROOT, f);
    if (!fs.existsSync(full)) continue;
    const lines = fs.readFileSync(full, "utf8").split(/\r?\n/);

    lines.forEach((line, i) => {
        // Bo qua comment: chung chi giai thich, khong cau hinh gi.
        const code = line.replace(/^\s*(#|\/\/|--).*$/, "");
        if (!code.trim()) return;

        /*
         * Port mapping cua compose la "HOST:CONTAINER". Chi phia HOST moi gay
         * tranh cong; phia container la cong noi bo cua image va voi Postgres
         * thi LUON la 5432, hoan toan dung.
         *
         * Khong tach hai phia thi "5434:5432" se bi bao sai - day chinh la
         * false positive ma lan chay dau tien cua script nay mac phai.
         */
        const mapping = code.match(/["']?\$?\{?[^"':]*?(\d{4,5})\}?:(\d{4,5})["']?/);
        const haystack = mapping ? mapping[1] : code;

        for (const port of VIVACON_PORTS) {
            const re = new RegExp("(^|[^\\d])" + port + "([^\\d]|$)");
            if (re.test(haystack)) {
                fail(
                    "cong cua Vivacon",
                    f + ":" + (i + 1) + "  port " + port + "  " + line.trim().slice(0, 70),
                );
            }
        }
    });
}

// -------------------------------------------------------------------------
// 5. Nhung thu BAT BUOC phai con
// -------------------------------------------------------------------------
const REQUIRED = [
    "coffee-shop/package.json",
    "coffee-shop/server/src/index.js",
    "coffee-shop/client/src/App.jsx",
    "coffee-shop/db/schema.sql",
    "coffee-shop/docker-compose.yml",
    ".kiro/steering/coffee-shop-stack.md",
    "README.md",
];
for (const f of REQUIRED) {
    if (!files.includes(f)) fail("thieu file bat buoc", f);
}

// -------------------------------------------------------------------------
// Bao cao
// -------------------------------------------------------------------------
console.log("File dang duoc git track: " + files.length);
console.log("");

if (failures.length === 0) {
    console.log("SACH. Khong con source, config Docker, cong hay chuoi nao cua Vivacon.");
    console.log("");
    console.log("Luu y ve pham vi:");
    console.log("  - Chi kiem file git track. File gitignored tren disk (target/, logs/,");
    console.log("    config/, .env, .idea/) la artifact cuc bo, khong thuoc noi dung nhanh.");
    console.log("  - HISTORY cua nhanh VAN con Vivacon. Kiem bang:");
    console.log("      git log --oneline -- pom.xml src/");
    console.log("    Muon history sach thi can nhanh orphan hoac repository rieng.");
    process.exit(0);
}

const grouped = {};
for (const { check, detail } of failures) {
    (grouped[check] = grouped[check] || []).push(detail);
}
console.log("CON SOT " + failures.length + " cho:");
for (const [check, items] of Object.entries(grouped)) {
    console.log("");
    console.log("  [" + check + "] " + items.length);
    for (const d of items.slice(0, 20)) console.log("      " + d);
    if (items.length > 20) console.log("      ... va " + (items.length - 20) + " cho nua");
}
process.exit(1);
