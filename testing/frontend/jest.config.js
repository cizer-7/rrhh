const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: '../../frontend/',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/components/(.*)$': '<rootDir>/../../frontend/src/components/$1',
    '^@/pages/(.*)$': '<rootDir>/../../frontend/src/pages/$1',
    '^@/types/(.*)$': '<rootDir>/../../frontend/src/types/$1',
    '^@/(.*)$': '<rootDir>/../../frontend/src/$1',
    // Resolve React and ReactDOM from the frontend directory to avoid conflicts
    '^react$': '<rootDir>/../../frontend/node_modules/react',
    '^react-dom$': '<rootDir>/../../frontend/node_modules/react-dom',
  },
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    '../../frontend/src/**/*.{js,jsx,ts,tsx}',
    '!../../frontend/src/**/*.d.ts',
    '!../../frontend/src/**/*.stories.{js,jsx,ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  // Add React 18 support
  globals: {
    'ts-jest': {
      tsconfig: '../../frontend/tsconfig.json'
    }
  },
  // Ensure proper module transformation
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
