/**
 * Jest cho INTEGRATION test (DB that). Tach khoi jest.config.js (unit) de
 * `pnpm test` mac dinh khong dung toi DB. Chay bang `pnpm test:int` khi da dat
 * TEST_DATABASE_URL; neu khong dat, suite tu skip.
 * @type {import('jest').Config}
 */
module.exports = {
  rootDir: ".",
  testEnvironment: "node",
  testRegex: "test/.*\\.int-spec\\.ts$",
  moduleFileExtensions: ["js", "json", "ts"],
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.json" }],
  },
  moduleNameMapper: {
    // Nhu jest.config.js: bo .js khoi import tuong doi cua client Prisma sinh ra.
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  // Reset DB + chay nhieu truy van tuan tu; cho du thoi gian.
  testTimeout: 60000,
  maxWorkers: 1,
};
