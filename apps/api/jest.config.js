/** @type {import('jest').Config} */
module.exports = {
  rootDir: "src",
  testEnvironment: "node",
  testRegex: ".*\\.spec\\.ts$",
  moduleFileExtensions: ["js", "json", "ts"],
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "<rootDir>/../tsconfig.json" }],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    // Prisma 7 sinh client dang ESM voi import co duoi .js. Duoi node16 + ts-jest
    // CommonJS, bo .js de resolver tim duoc file .ts tuong ung.
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  collectCoverageFrom: ["**/*.ts", "!**/*.spec.ts", "!main.ts", "!generated/**"],
  coverageDirectory: "../coverage",
  clearMocks: true,
};
