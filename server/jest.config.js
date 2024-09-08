/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  testEnvironment: "node",
  transform: {
    "^.+.tsx?$": ["ts-jest", {}],
  },
  testPathIgnorePatterns: ["/node_modules/"],
  setupFiles: ["<rootDir>/jest.setup.js"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
};
