import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const modelsDir = path.join(root, "src/lib/api/models");
const generatedDir = path.join(root, "src/lib/api/generated");
const openapiUrl = process.env.OPENAPI_URL ?? "http://localhost:4000/documentation/json";

function toFileName(typeName) {
  return `${typeName.charAt(0).toLowerCase()}${typeName.slice(1)}`;
}

function walkModelFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkModelFiles(fullPath));
    } else if (entry.name.endsWith(".ts") && entry.name !== "index.ts") {
      files.push(fullPath);
    }
  }
  return files;
}

function walkGeneratedFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkGeneratedFiles(fullPath));
    } else if (entry.name.endsWith(".ts")) {
      files.push(fullPath);
    }
  }
  return files;
}

function replaceTypeNames(content, replacements) {
  let next = content;
  for (const [from, to] of replacements) {
    const pattern = new RegExp(`\\b${from}\\b`, "g");
    next = next.replace(pattern, to);
  }
  return next;
}

function replaceImportPaths(content, replacements) {
  let next = content;
  for (const [from, to] of replacements) {
    next = next.split(from).join(to);
  }
  return next;
}

function sortKey(typeName) {
  const match = /^Def(\d+)(.*)$/.exec(typeName);
  if (!match) return [0, 0];
  return [Number(match[1]), match[2].length];
}

function sortReplacements(entries) {
  return [...entries].sort((a, b) => {
    const [aIndex, aSuffix] = sortKey(a[0]);
    const [bIndex, bSuffix] = sortKey(b[0]);
    if (aIndex !== bIndex) return bIndex - aIndex;
    return bSuffix - aSuffix;
  });
}

async function fetchOpenApi() {
  const response = await fetch(openapiUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch OpenAPI spec from ${openapiUrl}`);
  }
  return response.json();
}

function buildRenameMap(schemas) {
  const byIndex = new Map();

  for (const [key, schema] of Object.entries(schemas)) {
    const match = /^def-(\d+)$/.exec(key);
    if (!match || !schema.title) continue;
    byIndex.set(Number(match[1]), schema.title);
  }

  const typeRenames = new Map();
  const fileRenames = new Map();

  for (const [index, title] of byIndex.entries()) {
    typeRenames.set(`Def${index}`, title);
    fileRenames.set(`def${index}.ts`, `${toFileName(title)}.ts`);
  }

  for (const filePath of walkModelFiles(modelsDir)) {
    const base = path.basename(filePath);
    const match = /^def(\d+)([A-Z][a-zA-Z0-9]*)\.ts$/.exec(base);
    if (!match) continue;

    const index = Number(match[1]);
    const suffix = match[2];
    const parentTitle = byIndex.get(index);
    if (!parentTitle) continue;

    const newType = `${parentTitle}${suffix}`;
    const oldType = `Def${index}${suffix}`;
    typeRenames.set(oldType, newType);
    fileRenames.set(base, `${toFileName(newType)}.ts`);
  }

  return { typeRenames, fileRenames };
}

function rewriteBarrels() {
  for (const folder of ["auth", "health"]) {
    const dir = path.join(modelsDir, folder);
    if (!fs.existsSync(dir)) continue;

    const files = fs
      .readdirSync(dir)
      .filter((file) => file.endsWith(".ts") && file !== "index.ts")
      .sort();

    const exports = files
      .map((file) => `export * from "./${file.replace(/\.ts$/, "")}";`)
      .join("\n");

    fs.writeFileSync(path.join(dir, "index.ts"), `${exports}\n`);
  }

  fs.writeFileSync(
    path.join(modelsDir, "index.ts"),
    `export * from "./auth";\nexport * from "./health";\n`,
  );
}

async function renameSchemas() {
  const openapi = await fetchOpenApi();
  const schemas = openapi.components?.schemas ?? {};
  const { typeRenames, fileRenames } = buildRenameMap(schemas);

  if (typeRenames.size === 0) {
    console.log("No def-N schemas to rename.");
    return;
  }

  const typeReplacements = sortReplacements([...typeRenames.entries()]);
  const importReplacements = sortReplacements(
    [...fileRenames.entries()].map(([from, to]) => [
      `./${from.replace(/\.ts$/, "")}`,
      `./${to.replace(/\.ts$/, "")}`,
    ]),
  );

  const filesToRewrite = [...walkModelFiles(modelsDir), ...walkGeneratedFiles(generatedDir)];

  for (const filePath of filesToRewrite) {
    const content = fs.readFileSync(filePath, "utf8");
    let next = replaceTypeNames(content, typeReplacements);
    next = replaceImportPaths(next, importReplacements);
    if (next !== content) {
      fs.writeFileSync(filePath, next);
    }
  }

  for (const filePath of walkModelFiles(modelsDir)) {
    const base = path.basename(filePath);
    const targetBase = fileRenames.get(base);
    if (!targetBase || targetBase === base) continue;

    const targetPath = path.join(path.dirname(filePath), targetBase);
    if (fs.existsSync(targetPath)) {
      fs.rmSync(targetPath, { force: true });
    }
    fs.renameSync(filePath, targetPath);
  }

  rewriteBarrels();

  const healthResponse = path.join(modelsDir, "auth", "healthResponse.ts");
  const healthDir = path.join(modelsDir, "health");
  if (fs.existsSync(healthResponse)) {
    fs.mkdirSync(healthDir, { recursive: true });
    const target = path.join(healthDir, "healthResponse.ts");
    if (fs.existsSync(target)) fs.rmSync(target, { force: true });
    fs.renameSync(healthResponse, target);
  }

  rewriteBarrels();
  console.log(`Renamed ${typeRenames.size} schema types to readable names.`);
}

renameSchemas().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
