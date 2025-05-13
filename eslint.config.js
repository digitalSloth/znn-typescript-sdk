import { defineConfig } from "eslint/config";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([
    // Base configuration for all files
    {
        extends: compat.extends(
            "eslint:recommended",
            "plugin:@typescript-eslint/eslint-recommended",
            "plugin:@typescript-eslint/recommended",
        ),

        plugins: {
            "@typescript-eslint": typescriptEslint,
        },

        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.browser,
            },

            parser: tsParser,
            parserOptions: {
                // Enable type-aware linting by pointing to the ESLint-specific tsconfig only
                project: [
                    path.resolve(__dirname, "tsconfig.eslint.json")
                ],
                tsconfigRootDir: __dirname,
                sourceType: "module",
                ecmaVersion: 2022
            }
        },

        rules: {
            // 'sort-imports': ['error', {
            //     ignoreCase: false,
            //     ignoreDeclarationSort: true, // don"t want to sort import lines, use eslint-plugin-import instead
            //     ignoreMemberSort: false,
            //     memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
            //     allowSeparatedGroups: true,
            // }],

            // Indent with 4 spaces (as warning to allow formatter to handle it)
            "indent": ["warn", 4, {
                "SwitchCase": 1,
                "MemberExpression": 1,
                "ObjectExpression": 1
            }],

            // Prefer double quotes but don't error
            "quotes": ["warn", "double", {
                "allowTemplateLiterals": true,
                "avoidEscape": true
            }],

            // Additional recommended rules
            "no-console": "warn",
            "no-unused-vars": "off", // Use TypeScript version instead
            "@typescript-eslint/explicit-function-return-type": "off",
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-var-requires": "warn",
            "@typescript-eslint/no-unused-vars": ["warn", {
                "argsIgnorePattern": "^_",
                "varsIgnorePattern": "^_"
            }],
            // Allow legacy files to use ts-nocheck pragmas without failing the build
            "@typescript-eslint/ban-ts-comment": ["warn", {
                "ts-nocheck": false
            }],

            // Downgrade a few noisy rules to warnings to allow legacy code to pass CI
            "no-case-declarations": "warn",
            "no-async-promise-executor": "warn",
            "no-empty": "warn",
            "prefer-rest-params": "warn",
            "prefer-spread": "warn",
            "no-useless-escape": "warn",

            // Simplified naming conventions following modern TypeScript best practices
            "@typescript-eslint/naming-convention": [
                "warn",
                // Classes should be PascalCase
                {
                    selector: "class",
                    format: ["PascalCase"]
                },
                // Interfaces should be PascalCase (no I prefix - modern best practice)
                {
                    selector: "interface",
                    format: ["PascalCase"]
                },
                // Type aliases should be PascalCase
                {
                    selector: "typeAlias",
                    format: ["PascalCase"]
                },
                // Enums and enum members should be PascalCase
                {
                    selector: "enum",
                    format: ["PascalCase"]
                },
                {
                    selector: "enumMember",
                    format: ["PascalCase", "UPPER_CASE"]
                }
            ],

            // Custom rules for imports
            "@typescript-eslint/no-require-imports": ["warn", {
                "allow": [
                    "path"
                ]
            }],

            // More relaxed line length
            "max-len": ["warn", {
                "code": 140,
                "tabWidth": 4,
                "ignoreComments": true,
                "ignoreUrls": true,
                "ignoreStrings": true,
                "ignoreTemplateLiterals": true
            }]
        },
    },

    // Special configuration for test files
    {
        files: ["**/test/**/*.ts"],
        rules: {
            // Allow chai's expect expressions in tests
            "@typescript-eslint/no-unused-expressions": "off"
        }
    },

    // Special configuration for CLI files
    {
        files: ["**/cli/**/*.ts"],
        rules: {
            // Allow console.log in CLI applications
            "no-console": "off"
        }
    },

    // Special configuration for test files
    {
        ignores: [
            "**/lib/src/pow/**",  // This will ignore all files in the lib/src/pow directory and its subdirectories
        ]
    }
]);
