const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT_DIR, 'manifest.json');

test('Manifest V3 Core Configuration & Security Audit', async (t) => {
  assert.ok(fs.existsSync(MANIFEST_PATH), 'manifest.json must exist at project root');

  const manifestContent = fs.readFileSync(MANIFEST_PATH, 'utf-8');
  const manifest = JSON.parse(manifestContent);

  await t.test('manifest_version must be strictly 3', () => {
    assert.equal(manifest.manifest_version, 3, 'Must target Chrome Extension Manifest V3');
  });

  await t.test('metadata fields are populated', () => {
    assert.ok(manifest.name && typeof manifest.name === 'string', 'Extension name must be defined');
    assert.ok(manifest.version && typeof manifest.version === 'string', 'Extension version must be defined');
    assert.ok(manifest.description && typeof manifest.description === 'string', 'Extension description must be defined');
  });

  await t.test('permissions include storage and alarms', () => {
    assert.ok(Array.isArray(manifest.permissions), 'permissions must be an array');
    assert.ok(manifest.permissions.includes('storage'), 'storage permission required for token & task caching');
    assert.ok(manifest.permissions.includes('alarms'), 'alarms permission required for session keep-alive ping');
  });

  await t.test('host_permissions cover KemSU and TickTick Open API', () => {
    assert.ok(Array.isArray(manifest.host_permissions), 'host_permissions must be an array');
    const hasKemSU = manifest.host_permissions.some(p => p.includes('kemsu.ru'));
    const hasTickTick = manifest.host_permissions.some(p => p.includes('api.ticktick.com'));
    assert.ok(hasKemSU, 'Host permission for *://*.kemsu.ru/* required');
    assert.ok(hasTickTick, 'Host permission for https://api.ticktick.com/* required');
  });

  await t.test('background service worker is registered and file exists', () => {
    assert.ok(manifest.background && manifest.background.service_worker, 'Background service worker must be declared');
    const workerPath = path.join(ROOT_DIR, manifest.background.service_worker);
    assert.ok(fs.existsSync(workerPath), `Background worker file must exist at ${workerPath}`);
  });

  await t.test('popup action is registered and files exist', () => {
    assert.ok(manifest.action && manifest.action.default_popup, 'Action default_popup must be declared');
    const popupPath = path.join(ROOT_DIR, manifest.action.default_popup);
    assert.ok(fs.existsSync(popupPath), `Popup HTML file must exist at ${popupPath}`);
  });

  await t.test('content scripts match KemSU portal and declare files in correct dependency order', () => {
    assert.ok(Array.isArray(manifest.content_scripts) && manifest.content_scripts.length > 0, 'content_scripts required');
    const cs = manifest.content_scripts[0];

    assert.ok(cs.matches.some(m => m.includes('kemsu.ru')), 'content_scripts must match kemsu.ru');
    assert.ok(Array.isArray(cs.js), 'content_scripts.js must be an array');

    // Dependency order requirement:
    // parser.js MUST be loaded BEFORE autologin.js because autologin.js calls window.XIASParser.getPageType()
    const parserIndex = cs.js.indexOf('content/parser.js');
    const autologinIndex = cs.js.indexOf('content/autologin.js');

    assert.ok(parserIndex !== -1, 'content/parser.js must be declared in content_scripts.js');
    assert.ok(autologinIndex !== -1, 'content/autologin.js must be declared in content_scripts.js');
    assert.ok(
      parserIndex < autologinIndex,
      `Dependency violation: content/parser.js (index ${parserIndex}) must be loaded BEFORE content/autologin.js (index ${autologinIndex})`
    );
  });

  await t.test('declared icons exist on disk', () => {
    if (manifest.icons) {
      for (const [size, iconRelPath] of Object.entries(manifest.icons)) {
        const iconPath = path.join(ROOT_DIR, iconRelPath);
        assert.ok(fs.existsSync(iconPath), `Declared icon for size ${size} must exist at ${iconPath}`);
      }
    }
  });

  await t.test('no hardcoded credentials in source code (F1 Security Audit)', () => {
    const autologinPath = path.join(ROOT_DIR, 'content', 'autologin.js');
    assert.ok(fs.existsSync(autologinPath), 'content/autologin.js must exist');
    const code = fs.readFileSync(autologinPath, 'utf-8');

    // Test for known hardcoded credentials from initial prototype
    const hasHardcodedLogin = /['"`]stud81245['"`]/.test(code);
    const hasHardcodedPass = /['"`]Qwert312904['"`]/.test(code);

    assert.equal(hasHardcodedLogin, false, 'Security violation: hardcoded student login found in autologin.js');
    assert.equal(hasHardcodedPass, false, 'Security violation: hardcoded student password found in autologin.js');
  });
});
