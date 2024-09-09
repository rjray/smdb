/** @type {import('jest').Config} */
const config = {
  moduleNameMapper: {
    "^(constants|controllers|database|db|models|types|utils)":
      "<rootDir>/src/$1",
  },
  transform: {
    "\\.tsx?$": "babel-jest",
  },
  testEnvironment: "node",
};

export default config;
