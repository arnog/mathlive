module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    coverageReporters: ['lcov'],
    coverageDirectory: './coverage',
    roots: ['<rootDir>/test', '<rootDir>/dist'],
    // reporters: ['jest-silent-reporter'],
    globals: {
        'ts-jest': {
            tsconfig: {
                module: 'system',
            },
        },
    },
    moduleNameMapper: {
        '.*\\.(sass|less|css)$': '<rootDir>/test/__mocks__/styleMock.js',
      },
};
