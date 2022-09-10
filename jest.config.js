module.exports = {
  preset: 'ts-jest/presets/js-with-ts',
  testEnvironment: 'jsdom',
  coverageReporters: ['lcov'],
  coverageDirectory: './coverage',
  roots: ['<rootDir>/test'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)',
  ],
  // reporters: ['jest-silent-reporter'],
  moduleNameMapper: {
    '.*\\.(sass|less|css)$': '<rootDir>/test/__mocks__/styleMock.js',
  },
  moduleFileExtensions: ['js', 'json', 'ts', 'esm.js'],
  transform: {
    '^.+\\.js$': [
      'ts-jest',
      {
        useESM: true,
        isolatedModules: true,
        tsconfig: {
          allowJs: true,
          module: 'system',
        },
      },
    ],
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        isolatedModules: true,
        tsconfig: {
          allowJs: true,
          module: 'system',
        },
      },
    ],
  },
  // See https://stackoverflow.com/questions/58370492/ts-jest-fails-to-run-a-tsx-test-file-because-of-import-from-a-modules-js-file
  transformIgnorePatterns: ['<rootDir>/node_modules/(?!(@cortex-js)/)'],
};
