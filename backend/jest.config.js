// jest.config.js
module.exports = {
  // Use the Node environment for Express backend testing
  testEnvironment: "node",

  // Tell Jest where to look for test files
  testMatch: ["**/__tests__/**/*.test.js"],

  // Enable code coverage tracking
  collectCoverage: true,

  // Specify which files to check for coverage
  collectCoverageFrom: ["routes/**/*.js"],

  // Ignore node_modules for coverage (from your package.json)
  coveragePathIgnorePatterns: ["/node_modules/"],

  // Output a nice HTML report you can view in your browser
  coverageReporters: ["text", "html", "lcov"], // Added 'lcov' as SonarQube often likes it

  // Folder where the coverage report will be saved
  coverageDirectory: "coverage",

  // Tell Jest to process results for SonarQube (from your package.json)
  testResultsProcessor: "jest-sonar-reporter",
};
