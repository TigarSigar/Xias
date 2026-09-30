const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createChromeMock } = require('./helpers/chrome_mock.js');

const ROOT_DIR = path.resolve(__dirname, '..');
const BACKGROUND_PATH = path.join(ROOT_DIR, 'background', 'background.js');

function setupBackgroundContext(initialStorage = {}, mockFetchHandler) {
  const chrome = createChromeMock(initialStorage);
  const fetchedUrls = [];
  const fetchCalls = [];

  const mockFetch = async (url, options = {}) => {
    fetchCalls.push({ url, options });
    fetchedUrls.push(url);
    if (mockFetchHandler) {
      return mockFetchHandler(url, options);
    }
    return {
      ok: true,
      status: 200,
      text: async () => 'OK',
      json: async () => ({})
    };
  };

  const context = {
    chrome,
    fetch: mockFetch,
    console,
    Date,
    Math,
    setTimeout: (fn, ms) => setTimeout(fn, ms),
    clearTimeout: (id) => clearTimeout(id)
  };

  vm.createContext(context);
  const code = fs.readFileSync(BACKGROUND_PATH, 'utf-8');
  vm.runInContext(code, context);

  return {
    chrome,
    context,
    fetchedUrls,
    fetchCalls
  };
}

test('XIAS Background Service Worker Keep-Alive & Alarm Suite', async (t) => {
  await t.test('Keep-Alive Alarm Setup on Installed & Startup', async () => {
    const { chrome } = setupBackgroundContext();

    chrome._triggerInstalled();

    const alarms = chrome._getAlarms();
    assert.ok(alarms.has('xiasKeepAlivePing'), 'xiasKeepAlivePing alarm must be created on installation');

    const alarm = alarms.get('xiasKeepAlivePing');
    assert.equal(alarm.periodInMinutes, 5, 'Alarm period must be 5 minutes');
  });

  await t.test('Respects keepAliveEnabled === false flag in storage', async () => {
    const { chrome, fetchedUrls } = setupBackgroundContext({ keepAliveEnabled: false });

    // Trigger the alarm
    await chrome.alarms._triggerAlarm('xiasKeepAlivePing');

    // Allow any pending async microtasks to settle
    await new Promise(resolve => setTimeout(resolve, 50));

    assert.equal(fetchedUrls.length, 0, 'Must not perform any pings when keepAliveEnabled is false');
  });

  await t.test('Dual Origin Ping Verification (xiais.kemsu.ru AND eios.kemsu.ru) (F2 / R2)', async () => {
    const { chrome, fetchedUrls, fetchCalls } = setupBackgroundContext({ keepAliveEnabled: true });

    await chrome.alarms._triggerAlarm('xiasKeepAlivePing');
    await new Promise(resolve => setTimeout(resolve, 100));

    assert.ok(fetchCalls.length >= 2, `Expected dual-origin pings (at least 2 requests), got ${fetchCalls.length}`);

    const hasXiais = fetchedUrls.some(u => u.includes('xiais.kemsu.ru'));
    const hasEios = fetchedUrls.some(u => u.includes('eios.kemsu.ru'));

    assert.ok(hasXiais, 'Keep-alive MUST ping Tomcat portal at xiais.kemsu.ru to preserve JSP session');
    assert.ok(hasEios, 'Keep-alive MUST ping SSO portal at eios.kemsu.ru to preserve auth token');

    // Verify request options
    for (const call of fetchCalls) {
      assert.equal(call.options.credentials, 'include', 'Must include credentials for session cookies');
      assert.equal(call.options.cache, 'no-store', 'Must bypass cache');
    }
  });

  await t.test('Fault Tolerance: Network failure on one origin does not throw or abort', async () => {
    let xiaisFailed = false;
    const { chrome, fetchedUrls } = setupBackgroundContext(
      { keepAliveEnabled: true },
      async (url) => {
        if (url.includes('xiais.kemsu.ru')) {
          xiaisFailed = true;
          throw new Error('Connection refused (Tomcat down)');
        }
        return { ok: true, status: 200, text: async () => 'OK', json: async () => ({}) };
      }
    );

    // Trigger alarm should not reject or crash the service worker
    await assert.doesNotReject(async () => {
      chrome.alarms._triggerAlarm('xiasKeepAlivePing');
      await new Promise(resolve => setTimeout(resolve, 100));
    }, 'Keepalive alarm listener must catch fetch errors gracefully');

    assert.equal(xiaisFailed, true, 'Mock error on xiais was triggered');
  });
});
