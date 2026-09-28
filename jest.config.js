const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  // `*.spec.ts` matches Jest's default testMatch, so Playwright specs under
  // /e2e must be excluded or `npm test` tries to run them and fails.
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/', '<rootDir>/e2e/'],
  collectCoverageFrom: [
    'lib/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    'store/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  // Ratcheted gates on the modules that have real unit coverage.
  // Global gate was removed: lib/firestore.ts etc. require Firebase mocks
  // (emulator) and would make test:ci fail permanently.
  coverageThreshold: {
    './lib/sanitize.ts': {
      statements: 95,
      branches: 90,
      functions: 100,
      lines: 100,
    },
    './lib/utils.ts': {
      statements: 80,
      branches: 100,
      functions: 75,
      lines: 80,
    },
    // Rate limiting and the guest order cache are pure, fully testable
    // modules — hold them near-complete so regressions cannot slip through.
    './lib/rate-limit.ts': {
      statements: 100,
      branches: 95,
      functions: 100,
      lines: 100,
    },
    './lib/saved-orders.ts': {
      statements: 100,
      branches: 95,
      functions: 100,
      lines: 100,
    },
    './lib/server-auth.ts': {
      statements: 95,
      branches: 90,
      functions: 100,
      lines: 95,
    },
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
