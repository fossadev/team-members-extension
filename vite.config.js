import { resolve } from "path";
import { defineConfig } from "vite";
import template from "rollup-plugin-html-literals";

export default defineConfig({
  base: "",
  build: {
    rollupOptions: {
      input: {
        viewer: resolve(__dirname, "viewer.html"),
      },
      plugins: [template()],
    },
  },
});
