import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

for (const target of ["node_modules/.vite", ".astro", "dist"]) {
  fs.rmSync(path.join(root, target), { recursive: true, force: true });
}

console.log("Cleaned Vite/Astro cache");
