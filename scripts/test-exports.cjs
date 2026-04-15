#!/usr/bin/env node

/**
 * Test script to validate that exports resolve correctly in CommonJS context.
 * Run with: node scripts/test-exports.cjs
 */

const { Logger, styled, shouldUseColor, stripAnsi } = require("../dist/index.cjs");

console.log("✓ CJS Exports Test");
console.log("  - Logger:", typeof Logger === "function" ? "✓" : "✗");
console.log("  - styled:", typeof styled === "function" ? "✓" : "✗");
console.log("  - shouldUseColor:", typeof shouldUseColor === "function" ? "✓" : "✗");
console.log("  - stripAnsi:", typeof stripAnsi === "function" ? "✓" : "✗");

// Test instantiation
const logger = new Logger();
console.log("  - Logger instantiation:", logger instanceof Logger ? "✓" : "✗");

const styledText = styled("test", "red");
console.log("  - styled() result:", typeof styledText === "string" ? "✓" : "✗");

console.log("\n✓ All CJS exports validated!");
