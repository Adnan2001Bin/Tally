import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const modelsDir = path.join(root, "src/lib/api/models");
const authDir = path.join(modelsDir, "auth");
const healthDir = path.join(modelsDir, "health");

const HEALTH_PATTERN = /^(health|getHealth|healthResponse|def13)$/i;

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function classify(fileName) {
  return HEALTH_PATTERN.test(fileName) ? healthDir : authDir;
}

function writeBarrel(dir, folderName) {
  const files = fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".ts") && file !== "index.ts")
    .sort();

  const exports = files.map((file) => `export * from "./${file.replace(/\.ts$/, "")}";`).join("\n");

  fs.writeFileSync(path.join(dir, "index.ts"), `${exports}\n`);
}

function cleanDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const file of fs.readdirSync(dir)) {
    if (file === "index.ts") continue;
    fs.rmSync(path.join(dir, file), { recursive: true, force: true });
  }
}

function organize() {
  ensureDir(authDir);
  ensureDir(healthDir);
  cleanDir(authDir);
  cleanDir(healthDir);

  const flatFiles = fs
    .readdirSync(modelsDir)
    .filter((file) => file.endsWith(".ts") && file !== "index.ts");

  for (const file of flatFiles) {
    const source = path.join(modelsDir, file);
    const targetDir = classify(file);
    const target = path.join(targetDir, file);

    if (source === target) continue;

    if (fs.existsSync(target)) {
      fs.rmSync(target, { force: true });
    }

    fs.renameSync(source, target);
  }

  writeBarrel(authDir, "auth");
  writeBarrel(healthDir, "health");

  fs.writeFileSync(
    path.join(modelsDir, "index.ts"),
    `export * from "./auth";\nexport * from "./health";\n`,
  );

  console.log("Organized API models into auth/ and health/");
}

organize();
