import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const rootDir = process.cwd();
const distAssetsDir = path.join(rootDir, "dist", "assets");

const pickNewest = (files) =>
  files
    .map((file) => ({
      file,
      stats: fs.statSync(path.join(distAssetsDir, file)),
    }))
    .sort((a, b) => b.stats.mtimeMs - a.stats.mtimeMs || b.stats.size - a.stats.size)[0]?.file ?? null;

const copyIfFound = (sourceName, targetName) => {
  const sourcePath = path.join(distAssetsDir, sourceName);
  const targetPath = path.join(distAssetsDir, targetName);

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Nao foi possivel localizar ${sourceName} em ${distAssetsDir}.`);
  }

  fs.copyFileSync(sourcePath, targetPath);
};

if (!fs.existsSync(distAssetsDir)) {
  throw new Error(`Diretorio de assets nao encontrado: ${distAssetsDir}`);
}

const jsCandidates = fs
  .readdirSync(distAssetsDir)
  .filter((file) => /^index.*\.js$/.test(file) && !file.endsWith(".map"));

const cssCandidates = fs
  .readdirSync(distAssetsDir)
  .filter((file) => /^index.*\.css$/.test(file));

const latestJs = pickNewest(jsCandidates);
const latestCss = pickNewest(cssCandidates);

if (!latestJs) {
  throw new Error("Nenhum bundle JavaScript indexado foi encontrado para criar o alias app-latest.js.");
}

copyIfFound(latestJs, "app-latest.js");

if (latestCss) {
  copyIfFound(latestCss, "app-latest.css");
}

console.log(`Alias criado: app-latest.js <- ${latestJs}${latestCss ? ` | app-latest.css <- ${latestCss}` : ""}`);
