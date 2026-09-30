// XIAS Auto-login and Session Recovery Module

window.XIASAutologin = {
  init() {
    const pageType = window.XIASParser ? window.XIASParser.getPageType() : 'UNKNOWN';
    const loc = window.location ? window.location.href : '';

    // Очистка счетчиков при успешной навигации на портале
    try {
      if (typeof sessionStorage !== 'undefined') {
        const isHealthyXiais = loc.startsWith('https://xiais.kemsu.ru/') &&
          pageType !== 'XIAIS_SESSION_EXPIRED' &&
          (!window.XIASParser || !window.XIASParser.isSessionExpired || !window.XIASParser.isSessionExpired());
        const isHealthyEios = loc.includes('eios.kemsu.ru') &&
          (loc.includes('/personal-area') || pageType === 'EIOS_PERSONAL_AREA' || !document.querySelector('input[type="password"]'));

        if (isHealthyXiais || isHealthyEios) {
          sessionStorage.removeItem('xias_autologin_attempts');
          sessionStorage.removeItem('xias_login_failed');
          if (isHealthyXiais && !sessionStorage.getItem('xias_recovery_target')) {
            sessionStorage.removeItem('xias_recovery_attempts');
            sessionStorage.removeItem('xias_npe_recovery_count');
          }
        }
      }
    } catch (e) {
      console.warn('[XIAS] Error clearing login counters:', e);
    }

    // 0. Восстановление сохраненного deep-link после SSO-логина с защитой от Open Redirect
    try {
      if (typeof sessionStorage !== 'undefined') {
        const recoveryTarget = sessionStorage.getItem('xias_recovery_target');
        if (recoveryTarget) {
          if (typeof recoveryTarget === 'string' && recoveryTarget.startsWith('https://xiais.kemsu.ru/')) {
            if (
              loc.includes('xiais.kemsu.ru') &&
              !loc.includes('tasks_st') &&
              (!window.XIASParser || !window.XIASParser.isSessionExpired || !window.XIASParser.isSessionExpired())
            ) {
              sessionStorage.removeItem('xias_recovery_target');
              sessionStorage.removeItem('xias_recovery_attempts');
              sessionStorage.removeItem('xias_npe_recovery_count');
              window.location.href = recoveryTarget;
              return true;
            }
          } else {
            console.warn('[XIAS Security] Rejected invalid or cross-origin recovery target:', recoveryTarget);
            sessionStorage.removeItem('xias_recovery_target');
          }
        }
      }
    } catch (e) {
      console.warn('[XIAS] Recovery target check error:', e);
    }

    // 0.1 Если попали на пустую страницу-заглушку help.htm (где только кнопка "Закрыть")
    if (loc.includes('xiais.kemsu.ru/help.htm') || pageType === 'XIAIS_HELP_STUB') {
      console.warn('[XIAS] Detected KemSU stub help.htm page. Seamlessly transitioning to InfoOUPro...');
      this.showBadge('Переход в ИнфоОУПро (XIAS)...', 'info');
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.location) {
          window.location.replace('https://xiais.kemsu.ru/proc/stud?backToNewEios=https://eios.kemsu.ru/main/personal-area');
        }
      }, 150);
      return true;
    }

    // 1. Если на странице xiais произошел разлогин (NullPointerException / Нет доступа)
    const isExpired = pageType === 'XIAIS_SESSION_EXPIRED' ||
      (window.XIASParser && typeof window.XIASParser.isSessionExpired === 'function' && window.XIASParser.isSessionExpired());

    if (isExpired) {
      console.warn('[XIAS] Detected expired session on xiais.kemsu.ru. Initiating seamless recovery...');

      let recoveryAttempts = 0;
      try {
        if (typeof sessionStorage !== 'undefined') {
          recoveryAttempts = parseInt(sessionStorage.getItem('xias_recovery_attempts') || sessionStorage.getItem('xias_npe_recovery_count') || '0', 10);
          if (isNaN(recoveryAttempts)) recoveryAttempts = 0;
        }
      } catch (e) {
        console.warn('[XIAS] Error reading recovery attempts:', e);
      }

      if (recoveryAttempts >= 3) {
        console.warn('[XIAS] Maximum session recovery attempts reached (>= 3). Aborting redirect loop.');
        this.showBadge('Не удалось восстановить сессию автоматически', 'error');
        return true;
      }

      try {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('xias_recovery_attempts', String(recoveryAttempts + 1));
          sessionStorage.setItem('xias_npe_recovery_count', String(recoveryAttempts + 1));
          if (loc && loc.startsWith('https://xiais.kemsu.ru/')) {
            sessionStorage.setItem('xias_recovery_target', loc);
          }
        }
      } catch (e) {
        console.warn('[XIAS] Failed to save recovery target:', e);
      }
      this.showBadge('Сессия устарела. Восстанавливаем доступ через ЭИОС...', 'info');

      // Ждем 1.5 секунды и отправляем на переавторизацию через SSO
      setTimeout(() => {
        if (window.location) {
          window.location.href = 'https://xiais.kemsu.ru/proc/stud?backToNewEios=https://eios.kemsu.ru/main/personal-area';
        }
      }, 1500);
      return true;
    }

    // 2. Если мы на странице логина eios.kemsu.ru
    if (pageType === 'EIOS_LOGIN') {
      setTimeout(async () => {
        const passwordInput = document.querySelector('input[type="password"]');
        if (passwordInput) {
          this.handleEiosLogin(passwordInput);
        } else {
          let retryCount = 0;
          const retryInterval = setInterval(() => {
            retryCount++;
            const pass = document.querySelector('input[type="password"]');
            if (pass) {
              clearInterval(retryInterval);
              this.handleEiosLogin(pass);
            } else if (retryCount >= 20) {
              clearInterval(retryInterval);
            }
          }, 250);
        }
      }, 0);
      return true;
    }

    // Личный кабинет ЭИОС: инжектим кнопку перехода в ИнфоОУПро и выполняем автовход
    if (loc.includes('eios.kemsu.ru') && (loc.includes('/personal-area') || pageType === 'EIOS_PERSONAL_AREA')) {
      this.injectQuickJumpButton();
      this.handlePersonalAreaAutoRedirect();
      return false;
    }

    return false;
  },

  handleEiosLogin(passwordInput) {
    let attempts = 0;
    try {
      if (typeof sessionStorage !== 'undefined') {
        attempts = parseInt(sessionStorage.getItem('xias_autologin_attempts') || '0', 10);
        if (isNaN(attempts)) attempts = 0;

        if (attempts >= 2) {
          console.warn('[XIAS Autologin] Max autologin attempts reached (>= 2). Aborting.');
          sessionStorage.setItem('xias_login_failed', '1');
          this.showBadge('Превышено количество попыток входа', 'error');
          return;
        }

        if (sessionStorage.getItem('xias_login_failed')) {
          console.warn('[XIAS Autologin] Previous login attempt failed in this session.');
          return;
        }
      }
    } catch (e) {
      console.warn('[XIAS Autologin] Error checking autologin attempts:', e);
    }

    // Проверяем ошибку на странице
    const bodyText = document.body ? document.body.innerText.toLowerCase() : '';
    if (
      bodyText.includes('неверный логин') ||
      bodyText.includes('неправильный пароль') ||
      bodyText.includes('ошибка авторизации')
    ) {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('xias_login_failed', '1');
      }
      this.showBadge('XIAS: Неверный логин или пароль в настройках', 'error');
      return;
    }

    chrome.storage.local.get(['autoLoginEnabled', 'eiosLogin', 'eiosPassword'], (data) => {
      const login = (data.eiosLogin || '').trim();
      const password = data.eiosPassword || '';
      const isEnabled = data.autoLoginEnabled !== false;

      // Не выполнять автологин, если он отключен или учетные данные не заполнены
      if (!isEnabled || !login || !password) {
        return;
      }

      // Ищем поле логина (input type="text" перед паролем)
      const allInputs = Array.from(document.querySelectorAll('input'));
      const passIdx = allInputs.indexOf(passwordInput);
      let loginInput = null;
      for (let i = passIdx - 1; i >= 0; i--) {
        const t = (allInputs[i].type || '').toLowerCase();
        if (t === 'text' || t === '' || t === 'email') {
          loginInput = allInputs[i];
          break;
        }
      }

      if (!loginInput) {
        loginInput = document.querySelector('input[name*="login" i], input[id*="login" i], input[placeholder*="логин" i]');
      }

      if (!loginInput) return;

      // Инкрементируем счетчик попыток перед отправкой
      try {
        if (typeof sessionStorage !== 'undefined') {
          const currentAttempts = parseInt(sessionStorage.getItem('xias_autologin_attempts') || '0', 10) || 0;
          sessionStorage.setItem('xias_autologin_attempts', String(currentAttempts + 1));
        }
      } catch (e) {}

      this.showBadge('XIAS: Выполняется бесшовный вход...', 'info');

      // Заполняем поля с эмуляцией пользовательского ввода для React
      this.setNativeValue(loginInput, login);
      this.setNativeValue(passwordInput, password);

      setTimeout(() => {
        // Ищем кнопку "Войти"
        const buttons = Array.from(document.querySelectorAll('button, input[type="submit"]'));
        const submitBtn = buttons.find(b => {
          const txt = (b.innerText || b.value || '').trim().toLowerCase();
          return txt === 'войти' || txt.includes('вход');
        });

        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('xias_just_logged_in', '1');
          sessionStorage.removeItem('xias_eios_redirected_at');
        }

        if (submitBtn) {
          submitBtn.click();
        } else if (passwordInput.form) {
          passwordInput.form.submit();
        }
      }, 500);
    });
  },

  // Установка значения input для React (переопределение HTMLInputElement.prototype.value)
  setNativeValue(element, value) {
    if (!element) return;
    const prevValue = element.value;
    const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set;
    const prototype = Object.getPrototypeOf(element);
    const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

    if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
      prototypeValueSetter.call(element, value);
    } else if (valueSetter) {
      valueSetter.call(element, value);
    } else {
      element.value = value;
    }

    if (element._valueTracker) {
      element._valueTracker.setValue(prevValue);
    }

    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new Event('blur', { bubbles: true }));
  },

  // Кнопка быстрого перехода в ИнфоОУПро на странице личного кабинета ЭИОС
  injectQuickJumpButton() {
    if (!document.body || document.getElementById('xias-quick-jump')) return;

    const btn = document.createElement('a');
    btn.id = 'xias-quick-jump';
    btn.href = 'https://xiais.kemsu.ru/proc/stud?backToNewEios=https://eios.kemsu.ru/main/personal-area';
    btn.className = 'xias-quick-jump-btn';
    btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:6px;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      <span>Перейти в ИнфоОУПро (XIAS)</span>
      <span style="font-size:12px; opacity:0.8; margin-left:4px;">Список курсов и домашка</span>
    `;
    document.body.appendChild(btn);
  },

  // Автоматический переход в ИнфоОУПро из личного кабинета ЭИОС
  handlePersonalAreaAutoRedirect() {
    try {
      if (typeof sessionStorage !== 'undefined') {
        const justLoggedIn = sessionStorage.getItem('xias_just_logged_in');
        if (justLoggedIn) {
          sessionStorage.removeItem('xias_just_logged_in');
          sessionStorage.removeItem('xias_eios_redirected_at');
        } else {
          const lastRedirect = parseInt(sessionStorage.getItem('xias_eios_redirected_at') || '0', 10);
          if (Date.now() - lastRedirect < 12000) {
            console.log('[XIAS] Recently redirected from personal-area, skipping loop');
            return;
          }
        }
      }
    } catch (e) {
      console.warn('[XIAS] SessionStorage error:', e);
    }

    if (!chrome || !chrome.storage || !chrome.storage.local) return;

    chrome.storage.local.get(['autoLoginEnabled'], (res) => {
      if (res && res.autoLoginEnabled === false) return;

      try {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('xias_eios_redirected_at', String(Date.now()));
        }
      } catch (e) {}

      this.showBadge('XIAS: Вход в ИнфоОУПро...', 'info');

      // Ищем ссылку ИнфоОУПро в DOM или выполняем переход по таймеру
      const runCheck = (attempt) => {
        const targetEl = this.findInfoOUProLink();
        if (targetEl) {
          this.executeInfoOUProRedirect(targetEl);
        } else if (attempt < 10) {
          setTimeout(() => runCheck(attempt + 1), 200);
        } else {
          this.executeInfoOUProRedirect(null);
        }
      };

      setTimeout(() => runCheck(1), 200);
    });
  },

  findInfoOUProLink() {
    if (typeof document === 'undefined' || !document) return null;

    // 1. Поиск по тексту пункта меню "ИнфоОУПро" (наивысший приоритет)
    const candidates = Array.from(document.querySelectorAll('a, li, button, p, span, div'));
    for (const el of candidates) {
      const text = (el.textContent || '').trim();
      if (text.includes('ИнфоОУПро') || text.includes('Информационное обеспечение учебного процесса')) {
        const clickable = el.closest('a') || el.closest('button') || el;
        const href = ((clickable.getAttribute && (clickable.getAttribute('href') || clickable.href)) || '').toLowerCase();
        if (!href.includes('help.htm') && !href.includes('study_reit')) {
          return clickable;
        }
      }
    }

    // 2. Поиск прямой ссылки на proc/stud (ИнфоОУПро)
    const exactStudLink = document.querySelector('a[href*="proc/stud"], a[href*="xiais.kemsu.ru/proc"]');
    if (exactStudLink) return exactStudLink;

    // 3. Другие ссылки на xiais.kemsu.ru, строго исключая help.htm, study_reit, logout
    const allXiaisLinks = Array.from(document.querySelectorAll('a[href*="xiais.kemsu.ru"]'));
    const safeLink = allXiaisLinks.find(a => {
      const href = ((a.getAttribute && a.getAttribute('href')) || a.href || '').toLowerCase();
      return !href.includes('help.htm') && !href.includes('study_reit') && !href.includes('logout') && !href.includes('exit');
    });
    if (safeLink) return safeLink;

    return null;
  },

  executeInfoOUProRedirect(el) {
    const defaultUrl = 'https://xiais.kemsu.ru/proc/stud?backToNewEios=https://eios.kemsu.ru/main/personal-area';

    const href = (el && el.tagName === 'A' && el.href) ? el.href.toLowerCase() : '';
    const isSafeHref = href && !href.includes('help.htm') && !href.includes('study_reit');

    if (el && el.tagName === 'A' && isSafeHref) {
      el.target = '_self';
      if (typeof window !== 'undefined' && window.location) {
        window.location.href = el.href;
      }
    } else if (el && typeof el.click === 'function' && el.tagName !== 'DIV' && isSafeHref) {
      el.click();
    } else {
      if (typeof window !== 'undefined' && window.location) {
        window.location.href = defaultUrl;
      }
    }
  },

  showBadge(message, type = 'info') {
    if (!document.body) return;
    const existing = document.getElementById('xias-autologin-badge');
    if (existing) existing.remove();

    const badge = document.createElement('div');
    badge.id = 'xias-autologin-badge';
    badge.className = `xias-badge ${type}`;

    const iconSvg = type === 'error'
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`
      : `<span class="xias-spinner"></span>`;

    badge.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px;">
        ${iconSvg}
        <span>${message}</span>
      </div>
    `;
    document.body.appendChild(badge);

    if (type === 'error') {
      setTimeout(() => badge.remove(), 6000);
    }
  }
};
