import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const BASE = "/resume-generator/";

export default defineConfig({
  plugins: [react()],
  base: BASE,
});
