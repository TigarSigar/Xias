const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createDOMEnvironment } = require('./helpers/dom.js');
const { createChromeMock } = require('./helpers/chrome_mock.js');

const ROOT_DIR = path.resolve(__dirname, '..');
const AUTOLOGIN_PATH = path.join(ROOT_DIR, 'content', 'autologin.js');
const PARSER_PATH = path.join(ROOT_DIR, 'content', 'parser.js');
const FIXTURES_DIR = path.join(__dirname, 'fixtures');

function setupAutologinContext(html = '', url = 'https://eios.kemsu.ru/main', storageInit = {}) {
  const { window, document } = createDOMEnvironment(html, url);
  const chrome = createChromeMock(storageInit);

  const context = {
    window,
    document,
    location: window.location,
    sessionStorage: window.sessionStorage,
    localStorage: window.localStorage,
    chrome,
    Event: window.Event,
    CustomEvent: window.CustomEvent,
    HTMLInputElement: window.HTMLInputElement,
    Object,
    Array,
    setTimeout: (fn, ms) => setTimeout(fn, ms),
    clearTimeout: (id) => clearTimeout(id),
    console
  };

  vm.createContext(context);

  // Load parser first (dependency ordering)
  const parserCode = fs.readFileSync(PARSER_PATH, 'utf-8');
  vm.runInContext(parserCode, context);

  // Load autologin
  const autologinCode = fs.readFileSync(AUTOLOGIN_PATH, 'utf-8');
  vm.runInContext(autologinCode, context);

  return {
    autologin: window.XIASAutologin,
    parser: window.XIASParser,
    window,
    document,
    chrome,
    sessionStorage: window.sessionStorage
  };
}

test('XIASAutologin Unit & Session Recovery Test Suite', async (t) => {
  const loginHtml = fs.readFileSync(path.join(FIXTURES_DIR, 'eios_login.html'), 'utf-8');
  const npeHtml = fs.readFileSync(path.join(FIXTURES_DIR, 'xiais_npe.html'), 'utf-8');

  await t.test('React Controlled Input Setter (setNativeValue)', () => {
    const { autologin, document } = setupAutologinContext(loginHtml);
    const input = document.getElementById('login-field');
    assert.ok(input, 'login-field must exist in fixture');

    let inputFired = false;
    let changeFired = false;
    let blurFired = false;

    input.addEventListener('input', (e) => {
      assert.equal(e.bubbles, true, 'input event must bubble');
      inputFired = true;
    });

    input.addEventListener('change', (e) => {
      assert.equal(e.bubbles, true, 'change event must bubble');
      changeFired = true;
    });

    input.addEventListener('blur', (e) => {
      assert.equal(e.bubbles, true, 'blur event must bubble');
      blurFired = true;
    });

    autologin.setNativeValue(input, 'test_student_login');

    assert.equal(input.value, 'test_student_login', 'Input value must be updated');
    assert.equal(inputFired, true, 'synthetic input event must be dispatched');
    assert.equal(changeFired, true, 'synthetic change event must be dispatched');
    assert.equal(blurFired, true, 'synthetic blur event must be dispatched');
  });

  await t.test('Successful EIOS Form Submission with Stored Credentials', async () => {
    const credentials = {
      autoLoginEnabled: true,
      eiosLogin: 'stud_valid_user',
      eiosPassword: 'secret_password_123'
    };

    const { autologin, document } = setupAutologinContext(
      loginHtml,
      'https://eios.kemsu.ru/main',
      credentials
    );

    const loginInput = document.getElementById('login-field');
    const passwordInput = document.getElementById('password-field');

    let formSubmitted = false;
    const form = document.querySelector('form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      formSubmitted = true;
    });

    autologin.handleEiosLogin(passwordInput);

    // Wait for the submission setTimeout
    await new Promise(resolve => setTimeout(resolve, 600));

    assert.equal(loginInput.value, 'stud_valid_user', 'Login field must receive stored login');
    assert.equal(passwordInput.value, 'secret_password_123', 'Password field must receive stored password');
    assert.equal(formSubmitted, true, 'Form must be submitted after credentials injection');
  });

  await t.test('Respects autoLoginEnabled === false setting', async () => {
    const credentials = {
      autoLoginEnabled: false,
      eiosLogin: 'stud_disabled',
      eiosPassword: 'secret_password'
    };

    const { autologin, document } = setupAutologinContext(
      loginHtml,
      'https://eios.kemsu.ru/main',
      credentials
    );

    const loginInput = document.getElementById('login-field');
    const passwordInput = document.getElementById('password-field');

    autologin.handleEiosLogin(passwordInput);
    await new Promise(resolve => setTimeout(resolve, 600));

    assert.equal(loginInput.value, '', 'Login field must remain untouched when autoLogin is disabled');
    assert.equal(passwordInput.value, '', 'Password field must remain untouched when autoLogin is disabled');
  });

  await t.test('Infinite Loop Prevention on Login Failure', async () => {
    const credentials = {
      autoLoginEnabled: true,
      eiosLogin: 'wrong_login',
      eiosPassword: 'wrong_password'
    };

    const { autologin, document, sessionStorage } = setupAutologinContext(
      loginHtml,
      'https://eios.kemsu.ru/main',
      credentials
    );

    // Set failed flag
    sessionStorage.setItem('xias_login_failed', '1');

    const passwordInput = document.getElementById('password-field');
    const loginInput = document.getElementById('login-field');

    autologin.handleEiosLogin(passwordInput);
    await new Promise(resolve => setTimeout(resolve, 600));

    assert.equal(loginInput.value, '', 'Must not attempt autologin if previous attempt failed');
  });

  await t.test('Error Detection on Page sets xias_login_failed', () => {
    const errorHtml = loginHtml.replace(
      '</form>',
      '<div class="alert alert-danger">Неверный логин или пароль</div></form>'
    );

    const { autologin, document, sessionStorage } = setupAutologinContext(
      errorHtml,
      'https://eios.kemsu.ru/main',
      { autoLoginEnabled: true }
    );

    const passwordInput = document.getElementById('password-field');
    autologin.handleEiosLogin(passwordInput);

    assert.equal(
      sessionStorage.getItem('xias_login_failed'),
      '1',
      'Should record failure in sessionStorage to prevent refresh loops'
    );
  });

  await t.test('Security: Do NOT autofill fallback credentials when storage is empty', async () => {
    // Empty storage: user has never configured login/password
    const { autologin, document } = setupAutologinContext(
      loginHtml,
      'https://eios.kemsu.ru/main',
      { autoLoginEnabled: true }
    );

    const loginInput = document.getElementById('login-field');
    const passwordInput = document.getElementById('password-field');

    autologin.handleEiosLogin(passwordInput);
    await new Promise(resolve => setTimeout(resolve, 600));

    assert.notEqual(loginInput.value, 'stud81245', 'Must not autofill prototype student login');
    assert.notEqual(passwordInput.value, 'Qwert312904', 'Must not autofill prototype student password');
  });

  await t.test('Session Recovery & Deep-Link Preservation (F4 / R2)', () => {
    const currentBrokenUrl = 'https://xiais.kemsu.ru/proc/stud/course_st/tasks_st.htm?id=101';
    const { autologin, window, sessionStorage } = setupAutologinContext(
      npeHtml,
      currentBrokenUrl
    );

    const handled = autologin.init();
    assert.equal(handled, true, 'init() must return true for expired session');

    // Deep-link target URL storage requirement:
    // When session expires on a specific tasks page, the URL must be saved in sessionStorage
    // under 'xias_recovery_target' so the user is returned to the exact task page, not just generic index!
    const savedTarget = sessionStorage.getItem('xias_recovery_target');
    assert.equal(
      savedTarget,
      currentBrokenUrl,
      'Must save current deep-link URL into sessionStorage.xias_recovery_target before redirecting'
    );
  });

  await t.test('Synchronous init() contract: returns boolean primitive (true for login/expired, false for normal pages)', () => {
    // Normal index page -> false
    const indexEnv = setupAutologinContext(
      '<table><tr><td>Дисциплина</td></tr></table>',
      'https://xiais.kemsu.ru/proc/stud/index.shtm'
    );
    const indexRes = indexEnv.autologin.init();
    assert.equal(typeof indexRes, 'boolean', 'init() must return a boolean primitive, NOT a Promise');
    assert.equal(indexRes, false, 'Healthy dashboard returns false to allow UI rendering');

    // Normal tasks page -> false
    const tasksEnv = setupAutologinContext(
      '<table><tr><td>Задание</td></tr></table>',
      'https://xiais.kemsu.ru/proc/stud/course_st/tasks_st.htm?id=101'
    );
    const tasksRes = tasksEnv.autologin.init();
    assert.equal(typeof tasksRes, 'boolean', 'init() must return boolean on tasks page');
    assert.equal(tasksRes, false, 'Normal tasks page returns false so content.js enhances page');

    // Normal personal area page -> false
    const personalEnv = setupAutologinContext(
      '<div>Личный кабинет</div>',
      'https://eios.kemsu.ru/main/personal-area'
    );
    const personalRes = personalEnv.autologin.init();
    assert.equal(typeof personalRes, 'boolean', 'init() must return boolean on personal area');
    assert.equal(personalRes, false, 'Personal area returns false so page does not abort');

    // Expired session page -> true
    const expiredEnv = setupAutologinContext(
      npeHtml,
      'https://xiais.kemsu.ru/proc/stud/course_st/tasks_st.htm?id=101'
    );
    const expiredRes = expiredEnv.autologin.init();
    assert.equal(typeof expiredRes, 'boolean', 'init() must return boolean on expired session');
    assert.equal(expiredRes, true, 'Expired session returns true to halt regular UI rendering');

    // EIOS Login page -> true
    const loginEnv = setupAutologinContext(
      loginHtml,
      'https://eios.kemsu.ru/main'
    );
    const loginRes = loginEnv.autologin.init();
    assert.equal(typeof loginRes, 'boolean', 'init() must return boolean on login page');
    assert.equal(loginRes, true, 'Login page returns true because autologin handles it');
  });

  await t.test('Autologin Loop Prevention: Capped at 2 attempts with Russian error badge', async () => {
    const credentials = {
      autoLoginEnabled: true,
      eiosLogin: 'stud_loop_user',
      eiosPassword: 'wrong_password'
    };

    // Attempt 1: attempts count 0 -> increments to 1, submits
    const env1 = setupAutologinContext(loginHtml, 'https://eios.kemsu.ru/main', credentials);
    let submitCount1 = 0;
    env1.document.querySelector('form').addEventListener('submit', (e) => { e.preventDefault(); submitCount1++; });
    env1.autologin.handleEiosLogin(env1.document.getElementById('password-field'));
    await new Promise(r => setTimeout(r, 600));
    assert.equal(submitCount1, 1, 'First attempt must submit');
    assert.equal(env1.sessionStorage.getItem('xias_autologin_attempts'), '1', 'Must increment attempts counter to 1');

    // Attempt 2: attempts count 1 -> increments to 2, submits
    const env2 = setupAutologinContext(loginHtml, 'https://eios.kemsu.ru/main', credentials);
    env2.sessionStorage.setItem('xias_autologin_attempts', '1');
    let submitCount2 = 0;
    env2.document.querySelector('form').addEventListener('submit', (e) => { e.preventDefault(); submitCount2++; });
    env2.autologin.handleEiosLogin(env2.document.getElementById('password-field'));
    await new Promise(r => setTimeout(r, 600));
    assert.equal(submitCount2, 1, 'Second attempt must submit');
    assert.equal(env2.sessionStorage.getItem('xias_autologin_attempts'), '2', 'Must increment attempts counter to 2');

    // Attempt 3: attempts count 2 (>= 2) -> aborts, does NOT submit, displays error badge
    const env3 = setupAutologinContext(loginHtml, 'https://eios.kemsu.ru/main', credentials);
    env3.sessionStorage.setItem('xias_autologin_attempts', '2');
    let submitCount3 = 0;
    env3.document.querySelector('form').addEventListener('submit', (e) => { e.preventDefault(); submitCount3++; });
    env3.autologin.handleEiosLogin(env3.document.getElementById('password-field'));
    await new Promise(r => setTimeout(r, 600));
    assert.equal(submitCount3, 0, 'Third attempt must NOT submit when attempts >= 2');
    const badge = env3.document.getElementById('xias-autologin-badge');
    assert.ok(badge, 'Badge element must be present in DOM');
    assert.ok(badge.innerText.includes('Превышено количество попыток входа'), 'Must display required Russian message');
  });

  await t.test('Successful Navigation Clears Autologin Attempts and Failure Flags', () => {
    // Landing on EIOS personal area
    const envEios = setupAutologinContext(
      '<html><body><div id="personal-area">Welcome</div></body></html>',
      'https://eios.kemsu.ru/main/personal-area'
    );
    envEios.sessionStorage.setItem('xias_autologin_attempts', '2');
    envEios.sessionStorage.setItem('xias_login_failed', '1');

    envEios.autologin.init();

    assert.equal(envEios.sessionStorage.getItem('xias_autologin_attempts'), null, 'Must clear xias_autologin_attempts on EIOS personal-area');
    assert.equal(envEios.sessionStorage.getItem('xias_login_failed'), null, 'Must clear xias_login_failed on EIOS personal-area');

    // Landing on healthy XIAIS index
    const envXiais = setupAutologinContext(
      '<html><body><table><tr><td>Дисциплина</td></tr></table></body></html>',
      'https://xiais.kemsu.ru/proc/stud/index.shtm'
    );
    envXiais.sessionStorage.setItem('xias_autologin_attempts', '2');
    envXiais.sessionStorage.setItem('xias_login_failed', '1');
    envXiais.sessionStorage.setItem('xias_recovery_attempts', '2');

    envXiais.autologin.init();

    assert.equal(envXiais.sessionStorage.getItem('xias_autologin_attempts'), null, 'Must clear xias_autologin_attempts on healthy XIAIS');
    assert.equal(envXiais.sessionStorage.getItem('xias_login_failed'), null, 'Must clear xias_login_failed on healthy XIAIS');
    assert.equal(envXiais.sessionStorage.getItem('xias_recovery_attempts'), null, 'Must clear xias_recovery_attempts on healthy XIAIS');
  });

  await t.test('NPE Recovery Bounds: Capped at 3 attempts with Russian error badge', async () => {
    const expiredUrl = 'https://xiais.kemsu.ru/proc/stud/index.shtm';

    // Attempts 0, 1, 2: increments counter from 0 up to 3
    for (let count = 0; count < 3; count++) {
      const env = setupAutologinContext(npeHtml, expiredUrl);
      if (count > 0) env.sessionStorage.setItem('xias_recovery_attempts', String(count));

      let redirected = false;
      Object.defineProperty(env.window.location, 'href', {
        get() { return expiredUrl; },
        set(v) { redirected = true; },
        configurable: true
      });

      const res = env.autologin.init();
      assert.equal(res, true, 'init() must return true when handling expired session');
      assert.equal(env.sessionStorage.getItem('xias_recovery_attempts'), String(count + 1), `Must increment to ${count + 1}`);
    }

    // Attempt 4: count is 3 (>= 3) -> abort redirect loop
    const envExhausted = setupAutologinContext(npeHtml, expiredUrl);
    envExhausted.sessionStorage.setItem('xias_recovery_attempts', '3');

    let redirectedExhausted = false;
    Object.defineProperty(envExhausted.window.location, 'href', {
      get() { return expiredUrl; },
      set(v) { redirectedExhausted = true; },
      configurable: true
    });

    const handled = envExhausted.autologin.init();
    assert.equal(handled, true, 'init() returns true to stop content script on broken page');
    await new Promise(r => setTimeout(r, 1600));

    assert.equal(redirectedExhausted, false, 'Must NOT redirect when recovery count >= 3');
    const badge = envExhausted.document.getElementById('xias-autologin-badge');
    assert.ok(badge, 'Badge must be displayed');
    assert.ok(badge.innerText.includes('Не удалось восстановить сессию автоматически'), 'Must display required Russian error badge');
  });

  await t.test('Open Redirect Prevention: Rejects non-xiais targets and protocol downgrades', () => {
    const maliciousTargets = [
      'https://evil.com/phish',
      'http://xiais.kemsu.ru/proc/stud/index.shtm',
      'https://xiais.kemsu.ru.attacker.com/steal',
      'https://xiais.kemsu.ru@attacker.com/',
      'javascript:alert(1)',
      '//evil.com/phish'
    ];

    for (const target of maliciousTargets) {
      const env = setupAutologinContext(
        '<html><body>Dashboard</body></html>',
        'https://xiais.kemsu.ru/proc/stud/index.shtm'
      );
      env.sessionStorage.setItem('xias_recovery_target', target);

      let redirectedHref = null;
      Object.defineProperty(env.window.location, 'href', {
        get() { return 'https://xiais.kemsu.ru/proc/stud/index.shtm'; },
        set(val) { redirectedHref = val; },
        configurable: true
      });

      const res = env.autologin.init();
      assert.equal(redirectedHref, null, `Must NEVER redirect to untrusted target: ${target}`);
      assert.equal(env.sessionStorage.getItem('xias_recovery_target'), null, `Must purge untrusted recovery target: ${target}`);
    }

    // Valid target must redirect and return true
    const validTarget = 'https://xiais.kemsu.ru/proc/stud/course_st/tasks_st.htm?id=101&filter=all';
    const validEnv = setupAutologinContext(
      '<html><body>Dashboard</body></html>',
      'https://xiais.kemsu.ru/proc/stud/index.shtm'
    );
    validEnv.sessionStorage.setItem('xias_recovery_target', validTarget);

    let validRedirected = null;
    Object.defineProperty(validEnv.window.location, 'href', {
      get() { return 'https://xiais.kemsu.ru/proc/stud/index.shtm'; },
      set(val) { validRedirected = val; },
      configurable: true
    });

    const validRes = validEnv.autologin.init();
    assert.equal(validRes, true, 'Valid recovery target must return true');
    assert.equal(validRedirected, validTarget, 'Must redirect to valid target');
    assert.equal(validEnv.sessionStorage.getItem('xias_recovery_target'), null, 'Must clear target after redirect');
  });

  await t.test('findInfoOUProLink ignores help.htm and finds correct InfoOUPro entrypoint', () => {
    // HTML with both a misleading help.htm link and the real InfoOUPro menu item
    const htmlWithHelp = `
      <html>
        <body>
          <div class="sidebar">
            <a href="https://xiais.kemsu.ru/help.htm?href=https://xiais.kemsu.ru/dekanat/uspev/reit/student/study_reit.htm">Рейтинг БРС</a>
            <a href="https://xiais.kemsu.ru/proc/stud?backToNewEios=https://eios.kemsu.ru/main/personal-area">ИнфоОУПро</a>
          </div>
        </body>
      </html>
    `;
    const env = setupAutologinContext(htmlWithHelp, 'https://eios.kemsu.ru/main/personal-area');
    const link = env.autologin.findInfoOUProLink();
    assert.ok(link, 'Must find a link');
    assert.ok(!link.href.includes('help.htm'), 'Must NEVER pick a help.htm link');
    assert.ok(link.href.includes('proc/stud'), 'Must select the proc/stud link');
  });

  await t.test('help.htm stub page detection and seamless redirection to InfoOUPro', async () => {
    const stubUrl = 'https://xiais.kemsu.ru/help.htm?href=https://xiais.kemsu.ru/dekanat/uspev/reit/student/study_reit.htm';
    const stubHtml = '<html><body><center><input type="button" value="Закрыть" onclick="window.close()"></center></body></html>';
    
    const env = setupAutologinContext(stubHtml, stubUrl);

    // Verify parser detects it as stub
    assert.equal(env.parser.getPageType(), 'XIAIS_HELP_STUB', 'Must detect help.htm as XIAIS_HELP_STUB');

    let replacedLocation = null;
    env.window.location.replace = (url) => {
      replacedLocation = url;
    };

    const handled = env.autologin.init();
    assert.equal(handled, true, 'init() must return true for help.htm stub');

    // Wait for timeout
    await new Promise(r => setTimeout(r, 200));
    assert.ok(replacedLocation, 'Must call location.replace');
    assert.ok(replacedLocation.includes('xiais.kemsu.ru/proc/stud'), 'Must redirect to InfoOUPro entrypoint');
  });
});
