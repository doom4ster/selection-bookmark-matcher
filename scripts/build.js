#!/usr/bin/env node
/**
 * Build script to generate MV2 or MV3 distribution folders.
 * Usage:
 *   node scripts/build.js mv3
 *   node scripts/build.js mv2
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const distRoot = path.join(root, 'dist');
const mode = (process.argv[2] || 'mv3').toLowerCase();
if (!['mv2', 'mv3'].includes(mode)) {
  console.error('Mode must be mv2 or mv3');
  process.exit(1);
}

const sourceManifestPath = path.join(root, 'manifest.mv3.json');
if (!fs.existsSync(sourceManifestPath)) {
  console.error('manifest.mv3.json not found.');
  process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync(sourceManifestPath, 'utf8'));

function toMV2(m) {
  const clone = JSON.parse(JSON.stringify(m));
  clone.manifest_version = 2;
  // background
  clone.background = {
    scripts: ['background.js'],
    persistent: true
  };
  // action -> browser_action
  if (clone.action) {
    clone.browser_action = clone.action;
    delete clone.action;
  }
  // web_accessible_resources: flatten to array
  if (Array.isArray(clone.web_accessible_resources)) {
    const agg = new Set();
    for (const item of clone.web_accessible_resources) {
      if (item && item.resources) {
        item.resources.forEach(r => agg.add(r));
      } else if (typeof item === 'string') {
        agg.add(item);
      }
    }
    clone.web_accessible_resources = Array.from(agg);
  }
  // permissions cleanup
  if (Array.isArray(clone.permissions)) {
    clone.permissions = clone.permissions.filter(p => p !== 'scripting');
  }
  // host_permissions not in MV2
  delete clone.host_permissions;
  // service worker specific keys removed automatically by overwrite
  return clone;
}

const outDir = path.join(distRoot, mode);
fs.mkdirSync(outDir, { recursive: true });

let finalManifest = manifest;
if (mode === 'mv2') {
  finalManifest = toMV2(manifest);
}

// Write manifest
fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(finalManifest, null, 2));

// Copy other assets
const assets = [
  'background.js',
  'contentScript.js',
  'panel.css'
];
for (const file of assets) {
  const src = path.join(root, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(outDir, file));
  }
}
// Copy icons directory
const iconsSrc = path.join(root, 'icons');
if (fs.existsSync(iconsSrc)) {
  const iconsOut = path.join(outDir, 'icons');
  fs.mkdirSync(iconsOut, { recursive: true });
  for (const f of fs.readdirSync(iconsSrc)) {
    fs.copyFileSync(path.join(iconsSrc, f), path.join(iconsOut, f));
  }
}

console.log(`[build] Generated ${mode} at ${path.relative(root, outDir)}`);
