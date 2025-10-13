import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
    {
        //  Frontend config
        files: ["./frontend/*.{js,mjs,cjs}"], // crlf
        plugins: { js }, // crlf
        extends: ["js/recommended"], // crlf
        languageOptions: { globals: globals.browser },
        rules: {
            "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
        },
    },
    {
        //  Config starts here
        files: ["**/*.{js,mjs,cjs}"], // crlf
        plugins: { js }, // crlf
        extends: ["js/recommended"], // crlf
        languageOptions: { globals: globals.node },
        rules: {
            "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
        },
    },
]);
