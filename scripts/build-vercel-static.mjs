import { cp, mkdir, readdir, rm, stat } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const distDir = join(projectRoot, "dist");

const requiredEntries = [
  "index.html",
  "src"
];

const optionalEntries = [
  "public-config.js",
  "favicon.ico",
  "favicon.png",
  "assets"
];

const forbiddenDistEntries = [
  ".env",
  ".env.local",
  "api",
  "artifacts",
  "data"
];

const requiredDistEntries = [
  "index.html",
  "public-config.js",
  "src/main.js",
  "src/components/app.js",
  "src/data/generatedLifeZones.js",
  "src/data/cheonanAsanEmdBoundaries.js"
];

async function pathExists(path) {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function copyRequiredEntry(entry) {
  const source = join(projectRoot, entry);
  const target = join(distDir, entry);

  if (!(await pathExists(source))) {
    throw new Error(`Required static entry is missing: ${entry}`);
  }

  await cp(source, target, { recursive: true });
}

async function copyOptionalEntry(entry) {
  const source = join(projectRoot, entry);
  const target = join(distDir, entry);

  if (await pathExists(source)) {
    await cp(source, target, { recursive: true });
  }
}

async function assertForbiddenEntriesAbsent() {
  const distEntries = new Set(await readdir(distDir));
  const copiedForbiddenEntries = forbiddenDistEntries.filter((entry) => distEntries.has(entry));

  if (copiedForbiddenEntries.length > 0) {
    throw new Error(`Forbidden entries were copied to dist: ${copiedForbiddenEntries.join(", ")}`);
  }
}

async function assertRequiredDistEntriesPresent() {
  const missingEntries = [];

  for (const entry of requiredDistEntries) {
    if (!(await pathExists(join(distDir, entry)))) {
      missingEntries.push(entry);
    }
  }

  if (missingEntries.length > 0) {
    throw new Error(`Required dist entries are missing: ${missingEntries.join(", ")}`);
  }
}

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...await collectFiles(entryPath));
    } else if (entry.isFile()) {
      files.push(entryPath);
    }
  }

  return files;
}

async function assertNoEnvFilesCopied() {
  const copiedEnvFiles = (await collectFiles(distDir))
    .filter((file) => file.split(/[\\/]/).at(-1)?.startsWith(".env"));

  if (copiedEnvFiles.length > 0) {
    throw new Error(`Environment files must not be copied to dist: ${copiedEnvFiles.join(", ")}`);
  }
}

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });

for (const entry of requiredEntries) {
  await copyRequiredEntry(entry);
}

for (const entry of optionalEntries) {
  await copyOptionalEntry(entry);
}

await assertForbiddenEntriesAbsent();
await assertNoEnvFilesCopied();
await assertRequiredDistEntriesPresent();

console.log("Vercel static build completed: dist");
