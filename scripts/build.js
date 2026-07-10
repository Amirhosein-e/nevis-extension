#!/usr/bin/env node

/**
 * build.js
 * -----------------------------------------------------
 * Build script for Nevis extension (Chrome & Firefox)
 * Creates two separate outputs from a shared source (src/):
 *   build/chrome  → using manifest.chrome.json
 *   build/firefox → using manifest.firefox.json
 *
 * Usage:
 *   node scripts/build.js            → build both
 *   node scripts/build.js chrome     → Chrome only
 *   node scripts/build.js firefox    → Firefox only
 * -----------------------------------------------------
 */

const fs = require('fs');
const path = require('path');

// Base paths
const ROOT_DIR = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');
const MANIFESTS_DIR = path.join(ROOT_DIR, 'manifests');
const BUILD_DIR = path.join(ROOT_DIR, 'build');

// If you later need browser-specific files
// (e.g. a different content.js for Firefox), create these
// directories and the script will overlay them onto src/.
const OVERLAY_DIRS = {
  chrome: path.join(ROOT_DIR, 'src-chrome'),
  firefox: path.join(ROOT_DIR, 'src-firefox'),
};

const TARGETS = ['chrome', 'firefox'];

// Utility functions

function log(msg) {
  console.log(`[build] ${msg}`);
}

function fail(msg) {
  console.error(`[build] ${msg}`);
  process.exit(1);
}

function rimraf(targetPath) {
  if (fs.existsSync(targetPath)) {
    fs.rmSync(targetPath, { recursive: true, force: true });
  }
}

function copyDir(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return;
  fs.mkdirSync(destDir, { recursive: true });

  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch (err) {
    fail(`Invalid JSON file: ${filePath}\n${err.message}`);
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

// Build a single target (chrome or firefox)

function buildTarget(target) {
  if (!TARGETS.includes(target)) {
    fail(`Unknown target: "${target}". Allowed values: ${TARGETS.join(', ')}`);
  }

  log(`Starting build for "${target}"...`);

  const outDir = path.join(BUILD_DIR, target);
  const manifestPath = path.join(MANIFESTS_DIR, `manifest.${target}.json`);

  if (!fs.existsSync(SRC_DIR)) {
    fail(`src/ directory not found: ${SRC_DIR}`);
  }
  if (!fs.existsSync(manifestPath)) {
    fail(`Manifest file not found: ${manifestPath}`);
  }

  // 1. Clean previous output
  rimraf(outDir);
  fs.mkdirSync(outDir, { recursive: true });

  // 2. Copy shared code
  copyDir(SRC_DIR, outDir);
  log(`  Shared code copied from src/.`);

  // 3. Apply browser-specific overlay (if directory exists)
  const overlayDir = OVERLAY_DIRS[target];
  if (overlayDir && fs.existsSync(overlayDir)) {
    copyDir(overlayDir, outDir);
    log(`  Browser-specific files from ${path.basename(overlayDir)}/ applied to output.`);
  }

  // 4. Copy and validate target-specific manifest
  const manifestData = readJson(manifestPath);

  if (!manifestData.name || !manifestData.version) {
    fail(`manifest.${target}.json must contain at least "name" and "version" fields.`);
  }

  writeJson(path.join(outDir, 'manifest.json'), manifestData);
  log(`  manifest.${target}.json → build/${target}/manifest.json`);

  log(`Build "${target}" completed successfully → ${path.relative(ROOT_DIR, outDir)}`);
}

// Main execution

function main() {
  const arg = process.argv[2];

  log(`Cleaning build/ directory...`);
  if (!arg) {
    rimraf(BUILD_DIR);
  }

  const targetsToBuild = arg ? [arg] : TARGETS;

  for (const target of targetsToBuild) {
    buildTarget(target);
  }

  log('All builds completed successfully.');
}

main();