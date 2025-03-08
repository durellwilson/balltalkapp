module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|uuid|firebase|@firebase)'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFiles: [
    './jest.setup.js',
    './__tests__/setup.js'
  ],
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/coverage/**',
    '!**/node_modules/**',
    '!**/babel.config.js',
    '!**/jest.setup.js',
    '!**/__tests__/setup.js',
    '!**/dist/**'
  ],
  moduleNameMapper: {
    '\\.svg': '<rootDir>/__mocks__/svgMock.js',
    '^firebase/(.*)': '<rootDir>/__mocks__/firebase.ts',
    '^@react-native-firebase/(.*)': '<rootDir>/__mocks__/firebase.ts',
    '^expo-av$': '<rootDir>/__mocks__/expo-av.ts',
    '^./AudioProcessingEngine$': '<rootDir>/__mocks__/AudioProcessingEngine.ts'
  },
  testEnvironment: 'jsdom',
  verbose: true,
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ]
};
