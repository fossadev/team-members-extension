import { resolve } from "path";
import { defineConfig } from "vite";
import template from "rollup-plugin-html-literals";

export default defineConfig({
  base: "",
  build: {
    rollupOptions: {
      input: {
        panel: resolve(__dirname, "panel.html"),
        mobile: resolve(__dirname, "mobile.html"),
      },
      plugins: [template()],
    },
  },
});
