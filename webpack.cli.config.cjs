const path = require("path");
const nodeExternals = require("webpack-node-externals");
const { BannerPlugin } = require("webpack");

module.exports = {
    entry: "./cli/index.ts",
    mode: "production",
    target: "node",
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: {
                    loader: "ts-loader",
                    options: {
                        configFile: "tsconfig.cli.json"
                    }
                },
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
        extensionAlias: {
            ".js": [".ts", ".js"]
        },
        fullySpecified: false
    },
    output: {
        filename: "cli.cjs",
        path: path.resolve(__dirname, "dist/cli"),
        library: {
            type: "commonjs2"
        }
    },
    plugins: [
        new BannerPlugin({
            banner: "#!/usr/bin/env node",
            raw: true
        })
    ],
    externals: [nodeExternals()]
};
