import { defineConfig } from "vite";
import devtoolsJson from "vite-plugin-devtools-json";

export default defineConfig({
    root: ".",
    plugins: [devtoolsJson()],
    build: {
        outDir: "../public/",
        emptyOutDir: true, // also necessary
        sourcemap: true,
    },
});
