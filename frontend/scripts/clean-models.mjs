import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const modelsDir = path.join(root, "src/lib/api/models");
const authDir = path.join(modelsDir, "auth");
const healthDir = path.join(modelsDir, "health");

function cleanDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const file of fs.readdirSync(dir)) {
    fs.rmSync(path.join(dir, file), { recursive: true, force: true });
  }
}

function cleanModels() {
  cleanDir(authDir);
  cleanDir(healthDir);

  for (const file of fs.readdirSync(modelsDir)) {
    if (!file.endsWith(".ts") || file === "index.ts") continue;
    fs.rmSync(path.join(modelsDir, file), { force: true });
  }

  fs.mkdirSync(authDir, { recursive: true });
  fs.mkdirSync(healthDir, { recursive: true });
  fs.writeFileSync(path.join(authDir, "index.ts"), "");
  fs.writeFileSync(path.join(healthDir, "index.ts"), "");
  fs.writeFileSync(
    path.join(modelsDir, "index.ts"),
    `export * from "./auth";\nexport * from "./health";\n`,
  );

  console.log("Cleaned API model files.");
}

cleanModels();
