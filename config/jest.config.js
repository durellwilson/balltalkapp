module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/config/jest.setup.js'],
  rootDir: '..',
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|react-clone-referenced-element|@react-native-community|expo(nent)?|@expo(nent)?/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|@sentry/.*|@react-native-picker/.*|@react-native-firebase/.*|@react-native-async-storage/.*|@react-native-community/.*)'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
    '\\.(css|less)$': '<rootDir>/__mocks__/styleMock.js',
    'react-native/Libraries/Animated/NativeAnimatedHelper': '<rootDir>/__mocks__/NativeAnimatedHelper.js',
    'react-native/Libraries/Animated/(.*)': '<rootDir>/__mocks__/AnimatedModule.js',
    '^react-native$': '<rootDir>/node_modules/react-native',
    '^react-native/(.*)$': '<rootDir>/node_modules/react-native/$1'
  },
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/vendor/**',
    '!**/babel.config.js',
    '!**/jest.setup.js',
    '!**/metro.config.js'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/vendor/'
  ],
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
    'node'
  ],
  testEnvironment: 'node',
  globals: {
    'ts-jest': {
      babelConfig: true,
      tsconfig: '<rootDir>/config/tsconfig.jest.json'
    }
  },
  moduleDirectories: ['node_modules', '<rootDir>/'],
  testTimeout: 30000
};
