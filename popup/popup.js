// XIAS Settings Popup Logic

document.addEventListener('DOMContentLoaded', () => {
  const tokenInput = document.getElementById('ticktick-token');
  const projectInput = document.getElementById('ticktick-project');
  const autologinCheck = document.getElementById('autologin-enabled');
  const loginInput = document.getElementById('eios-login');
  const passwordInput = document.getElementById('eios-password');
  const keepaliveCheck = document.getElementById('keepalive-enabled');
  const testBtn = document.getElementById('btn-test-ticktick');
  const testStatus = document.getElementById('ticktick-status-msg');
  const openEiosBtn = document.getElementById('btn-open-eios');
  const clearCacheBtn = document.getElementById('btn-clear-cache');
  const saveStatus = document.getElementById('save-status');

  // Загружаем сохраненные настройки
  chrome.storage.local.get([
    'tickTickToken',
    'tickTickProjectName',
    'autoLoginEnabled',
    'eiosLogin',
    'eiosPassword',
    'keepAliveEnabled'
  ], (res) => {
    tokenInput.value = res.tickTickToken || '';
    projectInput.value = res.tickTickProjectName || 'КемГУ / Учёба';
    autologinCheck.checked = res.autoLoginEnabled !== false;
    loginInput.value = res.eiosLogin || '';
    passwordInput.value = res.eiosPassword || '';
    keepaliveCheck.checked = res.keepAliveEnabled !== false;

    // Если токен уже введен, проверим его статус
    if (res.tickTickToken) {
      testStatus.textContent = 'Токен сохранен';
      testStatus.className = 'status-msg success';
    }
  });

  // Автосохранение
  function saveSettings() {
    const cleanToken = tokenInput.value.trim().replace(/^["'`]|["'`]$/g, '').trim();
    chrome.storage.local.set({
      tickTickToken: cleanToken,
      tickTickProjectName: projectInput.value.trim() || 'КемГУ / Учёба',
      autoLoginEnabled: autologinCheck.checked,
      eiosLogin: loginInput.value.trim(),
      eiosPassword: passwordInput.value.trim(),
      keepAliveEnabled: keepaliveCheck.checked
    }, () => {
      saveStatus.textContent = 'Сохранено';
      saveStatus.style.color = '#059669';
      setTimeout(() => {
        saveStatus.textContent = 'Настройки сохраняются автоматически';
        saveStatus.style.color = '#94a3b8';
      }, 1500);
    });
  }

  [tokenInput, projectInput, loginInput, passwordInput].forEach(el => {
    el.addEventListener('input', saveSettings);
  });

  [autologinCheck, keepaliveCheck].forEach(el => {
    el.addEventListener('change', saveSettings);
  });

  // Проверка токена TickTick
  testBtn.addEventListener('click', () => {
    const cleanToken = tokenInput.value.trim().replace(/^["'`]|["'`]$/g, '').trim();
    if (!cleanToken) {
      testStatus.textContent = 'Введите токен!';
      testStatus.className = 'status-msg error';
      return;
    }

    testStatus.textContent = 'Проверка...';
    testStatus.className = 'status-msg';

    // Проверяем через Background Service Worker (избегает ограничений CORS в popup)
    chrome.runtime.sendMessage({
      action: 'TEST_TICKTICK',
      token: cleanToken
    }, (bgRes) => {
      if (chrome.runtime.lastError) {
        testStatus.textContent = 'Ошибка сервиса: ' + chrome.runtime.lastError.message;
        testStatus.className = 'status-msg error';
        return;
      }

      if (bgRes && bgRes.success) {
        testStatus.textContent = 'Успешно подключено!';
        testStatus.className = 'status-msg success';
        tokenInput.value = cleanToken;
        saveSettings();
      } else {
        testStatus.textContent = bgRes?.error || 'Неверный токен';
        testStatus.className = 'status-msg error';
      }
    });
  });

  // Открыть ЭИОС / ИнфоОУПро
  openEiosBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://xiais.kemsu.ru/proc/stud/index.shtm' });
  });

  // Сброс кэша
  clearCacheBtn.addEventListener('click', () => {
    chrome.storage.local.remove(['xiasCachedAssignments', 'xiasSyncedTasks'], () => {
      alert('Кэш заданий и история синхронизации очищены!');
    });
  });
});
