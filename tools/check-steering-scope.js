#!/usr/bin/env node
/*
 * Kiem tra phan tach steering giua Vivacon va Coffee Shop.
 *
 *   node tools/check-steering-scope.js
 *
 * Exit 0 neu moi phep kiem dung, 1 neu co pattern sai. Dung lam regression test
 * moi khi sua fileMatchPattern trong .kiro/steering/.
 *
 * ---------------------------------------------------------------------------
 * Vi sao can script nay
 * ---------------------------------------------------------------------------
 * Steering duoc merge chu khong override, nen viec tach hai du an phu thuoc
 * hoan toan vao fileMatchPattern. Pattern sai se that bai IM LANG: steering cua
 * app kia lot vao context, hoac steering cua app nay khong bao gio bat, va
 * khong co thong bao loi nao.
 *
 * Rui ro cu the: coffee-shop CUNG co thu muc src/ (coffee-shop/server/src va
 * coffee-shop/client/src), cung co package.json va docker-compose.yml. Neu
 * matcher khong neo dau duong dan thi "src/**" cua Vivacon se khop ca file cua
 * coffee-shop.
 *
 * ---------------------------------------------------------------------------
 * Gioi han
 * ---------------------------------------------------------------------------
 * Day la PROXY, khong phai bang chung tuyet doi. Tai lieu Kiro khong noi dung
 * glob engine nao, nen script test bang minimatch va picomatch - hai thu vien
 * ma VS Code va phan lon he sinh thai JS dung. Hai engine cung cho ket qua
 * giong nhau thi do tin cay cao, nhung van khong thay the viec mo mot phien moi
 * va xem rule nao thuc su duoc inject.
 *
 * Phu thuoc: minimatch va picomatch lay tu node_modules co san trong repo
 * (chung la transitive dependency cua webpack/vite). Can "npm install" o
 * frontend/ hoac coffee-shop/client/ truoc.
 */

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const STEERING = path.join(ROOT, ".kiro", "steering");

// --------------------------------------------------------------------------
// Tim matcher trong cac node_modules co san. Khong them dependency moi vao
// repo chi de chay mot script kiem tra.
// --------------------------------------------------------------------------
function load(names, candidates) {
    for (const rel of candidates) {
        const full = path.join(ROOT, rel);
        if (fs.existsSync(full)) {
            try {
                return require(full);
            } catch (err) {
                /* thu cho tiep theo */
            }
        }
    }
    console.error("Khong tim thay " + names + ". Chay truoc mot trong hai lenh:");
    console.error("  npm --prefix frontend install --force");
    console.error("  npm --prefix coffee-shop/client install");
    process.exit(2);
}

const minimatchModule = load("minimatch", [
    "frontend/node_modules/minimatch",
    "coffee-shop/client/node_modules/minimatch",
    "coffee-shop/server/node_modules/minimatch",
    "node_modules/minimatch",
]);
// minimatch 3.x export truc tiep ham; 9.x moi export dang { minimatch }.
const mm =
    typeof minimatchModule === "function" ? minimatchModule : minimatchModule.minimatch;

const picomatch = load("picomatch", [
    "frontend/node_modules/picomatch",
    "coffee-shop/client/node_modules/picomatch",
    "coffee-shop/server/node_modules/picomatch",
    "node_modules/picomatch",
]);

// --------------------------------------------------------------------------
// Doc frontmatter. Khong dung thu vien YAML: frontmatter o day chi co
// "inclusion:" va mot list "fileMatchPattern:".
// --------------------------------------------------------------------------
function frontmatter(file) {
    const lines = fs.readFileSync(path.join(STEERING, file), "utf8").split(/\r?\n/);
    if (lines[0].trim() !== "---") return { inclusion: "always", patterns: [] };

    const end = lines.indexOf("---", 1);
    if (end === -1) throw new Error(file + ": frontmatter khong dong");

    let inclusion = "always";
    const patterns = [];
    let inList = false;

    for (const raw of lines.slice(1, end)) {
        if (raw.startsWith("inclusion:")) {
            inclusion = raw.split(":")[1].trim();
            inList = false;
        } else if (raw.startsWith("fileMatchPattern:")) {
            const rest = raw.split(":").slice(1).join(":").trim();
            if (rest) {
                // Dang mot dong: chuoi don hoac mang inline.
                rest
                    .replace(/^\[|\]$/g, "")
                    .split(",")
                    .map((s) => s.trim().replace(/^['"]|['"]$/g, ""))
                    .filter(Boolean)
                    .forEach((p) => patterns.push(p));
            } else {
                inList = true;
            }
        } else if (inList && raw.trim().startsWith("- ")) {
            patterns.push(raw.trim().slice(2).trim().replace(/^['"]|['"]$/g, ""));
        } else if (raw.trim() && !raw.startsWith(" ") && !raw.startsWith("-")) {
            inList = false;
        }
    }
    return { inclusion, patterns };
}

const OWNER = {
    vivacon: ["tech.md", "structure.md", "product.md", "deployment.md"],
    coffee: ["coffee-shop-stack.md"],
};

function patternsFor(app) {
    const out = [];
    for (const file of OWNER[app]) {
        const { inclusion, patterns } = frontmatter(file);
        if (inclusion !== "fileMatch") {
            console.error("  CANH BAO: " + file + " khong con la fileMatch (" + inclusion + ")");
            continue;
        }
        if (patterns.length === 0) {
            console.error("  CANH BAO: " + file + " la fileMatch nhung khong co pattern");
        }
        out.push(...patterns);
    }
    return [...new Set(out)];
}

// --------------------------------------------------------------------------
// Cac duong dan that trong repo, chon de bat truong hop bien. Cap coffee-shop
// o duoi la phan quan trong: chung trung TEN voi cua Vivacon.
// --------------------------------------------------------------------------
const CASES = [
    ["src/main/java/com/vivacon/controller/AuthenticationController.java", "vivacon"],
    ["src/main/resources/application-prod.yml", "vivacon"],
    ["frontend/src/api/axiosConfig.js", "vivacon"],
    ["frontend/package.json", "vivacon"],
    ["frontend/Dockerfile", "vivacon"],
    ["pom.xml", "vivacon"],
    ["mvnw", "vivacon"],
    ["Dockerfile", "vivacon"],
    ["docker-compose.yml", "vivacon"],
    ["docker-compose.override.yml", "vivacon"],
    ["container/prepare/schema/schema.sql", "vivacon"],
    ["docs/ISSUES.md", "vivacon"],
    ["BA Document/docs/ba-document.html", "vivacon"],

    ["coffee-shop/server/src/index.js", "coffee"],
    ["coffee-shop/server/src/routes/orders.js", "coffee"],
    ["coffee-shop/client/src/App.jsx", "coffee"],
    ["coffee-shop/client/src/api/client.js", "coffee"],
    ["coffee-shop/client/package.json", "coffee"],
    ["coffee-shop/docker-compose.yml", "coffee"],
    ["coffee-shop/db/schema.sql", "coffee"],
    ["coffee-shop/README.md", "coffee"],
    ["coffee-shop/package.json", "coffee"],
    ["coffee-shop/.env.example", "coffee"],
];

function anyMatch(engine, patterns, file) {
    return patterns.some((p) =>
        engine === "minimatch"
            ? mm(file, p, { dot: true })
            : picomatch.isMatch(file, p, { dot: true }),
    );
}

function main() {
    const viv = patternsFor("vivacon");
    const cof = patternsFor("coffee");

    console.log("Pattern Vivacon    (" + viv.length + "): " + viv.join("  "));
    console.log("Pattern Coffee Shop (" + cof.length + "): " + cof.join("  "));

    let fail = 0;

    for (const engine of ["minimatch", "picomatch"]) {
        console.log("");
        console.log("--- " + engine + " ---");
        for (const [file, owner] of CASES) {
            const v = anyMatch(engine, viv, file);
            const c = anyMatch(engine, cof, file);
            const mine = owner === "vivacon" ? v : c;
            const other = owner === "vivacon" ? c : v;

            let verdict = "OK";
            if (!mine) verdict = "LOI: khong khop steering cua chinh no";
            else if (other) verdict = "LOI: RO RI sang app kia";
            if (verdict !== "OK") fail++;

            if (verdict !== "OK") {
                console.log("  " + verdict + " -> " + file);
            }
        }
        console.log("  " + CASES.length + " truong hop, " + fail + " loi");
    }

    console.log("");
    if (fail > 0) {
        console.log("THAT BAI: " + fail + " phep kiem sai.");
        return 1;
    }
    console.log("Tat ca " + CASES.length * 2 + " phep kiem dung tren ca hai engine.");
    return 0;
}

process.exit(main());
