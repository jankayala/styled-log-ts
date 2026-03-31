import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, "..", "dist");

mkdirSync(distDir, { recursive: true });

const typeSourceCandidates = [
  resolve(distDir, "index.d.mts"),
  resolve(distDir, "index.d.cts"),
];
const typeSource = typeSourceCandidates.find((filePath) => existsSync(filePath));

if (!typeSource) {
  throw new Error("No generated type declaration file was found in dist/.");
}

writeFileSync(resolve(distDir, "index.d.ts"), readFileSync(typeSource, "utf8"));

const requireBridge = `'use strict';

const mod = require('./index.cjs');
const logger = mod.default ?? mod.logger ?? mod;
const exported = Object.assign(Object.create(logger), mod, {
  default: logger,
  logger,
});

module.exports = exported;
`;

writeFileSync(resolve(distDir, "index.require.cjs"), requireBridge);
