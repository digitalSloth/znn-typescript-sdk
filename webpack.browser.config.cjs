const path = require("path");
const webpack = require("webpack");
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const commonConfig = {
    entry: "./src/index.ts",
    mode: "production",
    target: "web",
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/
            },
            {
                test: /\.wasm$/,
                loader: "base64-loader",
                type: "javascript/auto"
            }
        ]
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
        alias: {
            "argon2": false
        },
        fallback: {
            "fs": false,
            "path": false,
            "url": false,
            "crypto": require.resolve("crypto-browserify")
        },
        extensionAlias: {
            ".js": [".ts", ".js"]
        },
        fullySpecified: false
    },
    plugins: [
        new NodePolyfillPlugin({
            excludeAliases: ["console"]
        }),
        new webpack.ProvidePlugin({
            Buffer: ["buffer", "Buffer"],
            process: "process/browser"
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: "lib/pow.wasm",
                    to: "pow.wasm",
                    noErrorOnMissing: true
                },
                {
                    from: "lib/pow.js",
                    to: "pow.js",
                    noErrorOnMissing: true
                }
            ]
        })
    ]
};

const umdConfig = {
    ...commonConfig,
    output: {
        filename: "bundle.browser.js",
        path: path.resolve(__dirname, "dist/browser"),
        library: {
            type: "umd",
            name: "ZnnSDK"
        },
        globalObject: "this",
        environment: {
            dynamicImport: false
        }
    },
    optimization: {
        splitChunks: false,
        runtimeChunk: false
    }
};

const esmConfig = {
    ...commonConfig,
    experiments: {
        outputModule: true
    },
    output: {
        filename: "bundle.browser.mjs",
        path: path.resolve(__dirname, "dist/browser"),
        library: {
            type: "module"
        },
        environment: {
            dynamicImport: false,
            module: true
        }
    },
    optimization: {
        splitChunks: false,
        runtimeChunk: false
    }
};

module.exports = [umdConfig, esmConfig];
