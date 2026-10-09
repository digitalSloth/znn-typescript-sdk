import { execFile } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { expect } from "chai";
import webpack, { type Configuration, type RuleSetRule } from "webpack";
import { ZNN_SDK_VERSION } from "../../src/zenon.js";

const cliRequire = createRequire(import.meta.url);
const runFile = promisify(execFile);
const repoRoot = fileURLToPath(new URL("../../", import.meta.url));

describe("Compiled CLI", () => {
    it("starts for help and version with only direct runtime dependencies", async function () {
        this.timeout(120000);

        const scratchRoot = join(repoRoot, ".pipeline");
        mkdirSync(scratchRoot, { recursive: true });
        const outputDir = mkdtempSync(join(scratchRoot, "cli-smoke-"));
        let runtimeDir: string | undefined;

        try {
            runtimeDir = mkdtempSync(join(tmpdir(), "znn-cli-smoke-"));
            const baseConfig = cliRequire("../../webpack.cli.config.cjs") as Configuration;
            const cliRule = baseConfig.module!.rules![0] as RuleSetRule;
            const cliLoader = cliRule.use as {
                loader: string;
                options: { configFile: string; compilerOptions?: Record<string, unknown> };
            };
            const config: Configuration = {
                ...baseConfig,
                context: repoRoot,
                cache: false,
                output: { ...baseConfig.output, path: outputDir },
                module: {
                    ...baseConfig.module,
                    rules: baseConfig.module!.rules!.map(rule => rule === cliRule ? {
                        ...cliRule,
                        use: {
                            ...cliLoader,
                            options: {
                                ...cliLoader.options,
                                compilerOptions: { ...cliLoader.options.compilerOptions, outDir: outputDir }
                            }
                        }
                    } : rule)
                }
            };

            await new Promise<void>((resolve, reject) => {
                const compiler = webpack(config);
                compiler.run((error, stats) => {
                    compiler.close(closeError => {
                        if (error || closeError) {
                            reject(error || closeError);
                        } else if (!stats || stats.hasErrors()) {
                            reject(new Error(stats?.toString({ all: false, errors: true }) || "CLI compilation failed"));
                        } else {
                            resolve();
                        }
                    });
                });
            });

            // Keep checkout-hoisted transitive packages outside the CLI's resolution ancestry.
            const cliPath = join(runtimeDir, "cli.cjs");
            copyFileSync(join(outputDir, "cli.cjs"), cliPath);
            const manifest = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")) as {
                dependencies: Record<string, string>;
            };
            for (const name of Object.keys(manifest.dependencies)) {
                const dependencyPath = join(runtimeDir, "node_modules", name);
                mkdirSync(dirname(dependencyPath), { recursive: true });
                symlinkSync(
                    realpathSync(join(repoRoot, "node_modules", name)),
                    dependencyPath,
                    process.platform === "win32" ? "junction" : "dir"
                );
            }

            const options = { cwd: runtimeDir, env: {}, timeout: 10000, maxBuffer: 1024 * 1024 };
            const help = await runFile(process.execPath, [cliPath, "--help"], options);
            expect(help.stdout).to.include("Usage:");
            expect(help.stdout).to.include("wallet");
            expect(help.stdout).to.include("tx");
            expect(help.stderr).to.equal("");

            const version = await runFile(process.execPath, [cliPath, "--version"], options);
            expect(version.stdout.trim().split("\n").pop()).to.equal(ZNN_SDK_VERSION);
            expect(version.stderr).to.equal("");
        } finally {
            rmSync(outputDir, { recursive: true, force: true });
            if (runtimeDir) rmSync(runtimeDir, { recursive: true, force: true });
        }
    });
});
