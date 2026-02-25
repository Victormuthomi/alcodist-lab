module.exports = {
  roots: ["<rootDir>/src/modules"], // look inside all modules
  testMatch: ["**/tests/unit/**/*.spec.ts"], // only unit tests
  transform: {
    "^.+\\.(t|j)s$": "ts-jest", // compile TS files
  },
  testEnvironment: "node",
  moduleFileExtensions: ["ts", "js", "json"],
  verbose: true,
};
