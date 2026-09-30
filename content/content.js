// XIAS Content Script Main Entrypoint

(function() {
  console.log('[XIAS] Extension initialized on:', window.location.href);

  // Сохраняем последний URL для keep-alive пинга
  try {
    chrome.runtime.sendMessage({
      action: 'SAVE_EIOS_URL',
      url: window.location.href
    });
  } catch (e) {}

  function run() {
    // 1. Проверяем автологин или восстановление сессии
    if (window.XIASAutologin && window.XIASAutologin.init()) {
      return;
    }

    const pageType = window.XIASParser.getPageType();
    console.log('[XIAS] Detected page type:', pageType);

    // 2. Главная страница студента со списком предметов (xiais.kemsu.ru/proc/stud/index.shtm)
    if (pageType === 'XIAIS_INDEX') {
      const studentInfo = window.XIASParser.parseStudentInfo();
      const courses = window.XIASParser.parseCoursesFromIndex();

      if (courses.length > 0) {
        console.log('[XIAS] Found courses:', courses.length);
        window.XIASUI.renderDashboard(courses, studentInfo);
      }
    }

    // 3. Страница заданий конкретного предмета (tasks_st.htm)
    else if (pageType === 'XIAIS_TASKS') {
      const parsedData = window.XIASParser.parseTasksPage();
      console.log('[XIAS] Parsed tasks for:', parsedData.courseName, parsedData.assignments.length);
      window.XIASUI.enhanceTasksPage(parsedData);
    }

    // 4. Личный кабинет обучающегося в новой ЭИОС
    else if (pageType === 'EIOS_PERSONAL_AREA') {
      window.XIASAutologin.injectQuickJumpButton();
      if (window.XIASAutologin.handlePersonalAreaAutoRedirect) {
        window.XIASAutologin.handlePersonalAreaAutoRedirect();
      }
    }
  }

  // Запуск при готовности DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

  // Отслеживание SPA-навигации в React (eios.kemsu.ru)
  let lastUrl = window.location.href;
  function checkUrlChange() {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      console.log('[XIAS] SPA URL changed:', lastUrl);
      run();
    }
  }

  try {
    const origPushState = history.pushState;
    if (origPushState) {
      history.pushState = function() {
        origPushState.apply(this, arguments);
        setTimeout(checkUrlChange, 50);
      };
    }
    const origReplaceState = history.replaceState;
    if (origReplaceState) {
      history.replaceState = function() {
        origReplaceState.apply(this, arguments);
        setTimeout(checkUrlChange, 50);
      };
    }
    window.addEventListener('popstate', checkUrlChange);
  } catch (e) {}

  // Наблюдатель за изменениями DOM (на случай асинхронной подгрузки)
  let debounceTimeout = null;
  const observer = new MutationObserver(() => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      checkUrlChange();
      const pageType = window.XIASParser ? window.XIASParser.getPageType() : '';
      if (pageType === 'XIAIS_INDEX' && !document.getElementById('xias-app-root')) {
        run();
      } else if (pageType === 'XIAIS_TASKS' && !document.getElementById('xias-tasks-bar')) {
        run();
      } else if (pageType === 'EIOS_PERSONAL_AREA' && !document.getElementById('xias-quick-jump')) {
        run();
      }
    }, 300);
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
