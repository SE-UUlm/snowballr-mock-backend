import prettier from "eslint-config-prettier";
import js from "@eslint/js";
import globals from "globals";
import ts from "typescript-eslint";

export default ts.config(
    js.configs.recommended,
    ...ts.configs.recommended,
    prettier,
    {
        files: ["src/**/*.{ts}"],
    },
    {
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
    },
    {
        ignores: ["dist/", "src/grpc-gen/", "api/"],
    },
);
