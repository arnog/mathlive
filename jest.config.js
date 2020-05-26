module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    coverageReporters: ['lcov'],
    coverageDirectory: './coverage',
    roots: ['<rootDir>/test', '<rootDir>/dist'],
    globals: {
        'ts-jest': {
            tsConfig: {
                module: 'system',
            },
        },
    },
};
