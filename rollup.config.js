import { terser } from 'rollup-plugin-terser';
// import copy from 'rollup-plugin-copy';
import typescript from 'rollup-plugin-typescript2';
import resolve from 'rollup-plugin-node-resolve';
// import replace from 'rollup-plugin-replace';
import pkg from './package.json';
import chalk from 'chalk';
import { eslint } from 'rollup-plugin-eslint';

process.env.BUILD = process.env.BUILD || 'development';
const PRODUCTION = process.env.BUILD === 'production';
const BUILD_ID =
    Date.now().toString(36).slice(-2) +
    Math.floor(Math.random() * 0x186a0).toString(36);
const BUILD_DIRECTORY = 'dist';

console.log(
    chalk.bold.cyan('Making a ') +
        chalk.red(PRODUCTION ? 'production' : 'development') +
        chalk.bold.cyan(' build')
);

const TYPESCRIPT_OPTIONS = {
    // typescript: require('typescript'),
    // objectHashIgnoreUnknownHack: true,
    clean: PRODUCTION,
    // verbosity: 3,
    include: ['*.ts+(|x)', '**/*.ts+(|x)', '*.js+(|x)', '**/*.js+(|x)'],
    // tsconfigOverride: {
    //     compilerOptions: {
    //         // "declaration": !PRODUCTION,
    //     },
    // },
};

const TERSER_OPTIONS = {
    sourcemap: false,
    compress: {
        drop_console: true,
        drop_debugger: true,
        ecma: 8, // Use "5" to support older browsers
        module: true,
        warnings: true,
        passes: 2,
        global_defs: {
            ENV: JSON.stringify(process.env.BUILD),
            VERSION: JSON.stringify(pkg.version || '0.0'),
            BUILD_ID: JSON.stringify(BUILD_ID),
        },
    },
};

export default [
    // MathLive main module
    {
        input: 'src/mathlive.js',
        plugins: [
            eslint({
                // fix: true,
                // include: 'src/',
            }),
            resolve(),
            typescript(TYPESCRIPT_OPTIONS),
            PRODUCTION && terser(TERSER_OPTIONS),
            // copy({
            //     targets: [
            //         { src: 'css/fonts', dest: 'dist' },
            //         { src: 'src', dest: 'dist' },
            //         {
            //             src: 'build/types.d.ts',
            //             dest: 'dist',
            //             rename: 'mathlive.d.ts',
            //         },
            //     ],
            // }),
        ],
        output: [
            // JavaScript native module
            {
                format: 'es',
                file: `${BUILD_DIRECTORY}/mathlive.mjs`,
                sourcemap: !PRODUCTION,
            },
            // UMD file, suitable for <script>, require(), etc...
            {
                format: 'umd',
                file: `${BUILD_DIRECTORY}/mathlive.js`,
                sourcemap: !PRODUCTION,
                name: 'MathLive',
            },
        ],
        watch: {
            clearScreen: false,
            exclude: ['node_modules/**'],
        },
    },
    // MathLive Vue-js adapter
    {
        input: 'src/vue-mathlive.js',
        plugins: [terser(TERSER_OPTIONS)],
        output: {
            // JavaScript native module
            sourcemap: false,
            file: 'dist/vue-mathlive.mjs',
            format: 'es',
        },
    },
];
