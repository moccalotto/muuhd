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
    },
    {
        //  Config starts here
        files: ["**/*.{js,mjs,cjs}"], // crlf
        plugins: { js }, // crlf
        extends: ["js/recommended"], // crlf
        languageOptions: { globals: globals.node },
    },
]);
