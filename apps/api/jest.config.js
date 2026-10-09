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
  },
  collectCoverageFrom: ["**/*.ts", "!**/*.spec.ts", "!main.ts"],
  coverageDirectory: "../coverage",
  clearMocks: true,
};
