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
    chrome.storage.local.set({
      tickTickToken: tokenInput.value.trim(),
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
  testBtn.addEventListener('click', async () => {
    const token = tokenInput.value.trim();
    if (!token) {
      testStatus.textContent = 'Введите токен!';
      testStatus.className = 'status-msg error';
      return;
    }

    testStatus.textContent = 'Проверка...';
    testStatus.className = 'status-msg';

    try {
      const res = await fetch('https://api.ticktick.com/open/v1/project', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        testStatus.textContent = 'Успешно подключено!';
        testStatus.className = 'status-msg success';
        saveSettings();
      } else {
        const text = await res.text();
        testStatus.textContent = `Ошибка (${res.status}): неверный токен`;
        testStatus.className = 'status-msg error';
      }
    } catch (err) {
      // Fallback через background service worker
      chrome.runtime.sendMessage({
        action: 'TEST_TICKTICK',
        token
      }, (bgRes) => {
        if (chrome.runtime.lastError) {
          testStatus.textContent = 'Ошибка сети: ' + err.message;
          testStatus.className = 'status-msg error';
          return;
        }

        if (bgRes && bgRes.success) {
          testStatus.textContent = 'Успешно подключено!';
          testStatus.className = 'status-msg success';
          saveSettings();
        } else {
          testStatus.textContent = bgRes?.error || 'Неверный токен';
          testStatus.className = 'status-msg error';
        }
      });
    }
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
