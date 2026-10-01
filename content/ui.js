// XIAS Modern UI Renderer and Dashboard Controller

function svgIcon(name, size = 16, strokeWidth = 2) {
  switch (name) {
    case 'book':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/></svg>`;
    case 'clock':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
    case 'search':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`;
    case 'check':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
    case 'award':
    case 'trophy':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>`;
    case 'user':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
    case 'calendar':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>`;
    case 'eye':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`;
    case 'arrow-right':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`;
    case 'layout':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>`;
    case 'x':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    case 'upload':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`;
    case 'file':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
    case 'archive':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg>`;
    case 'external-link':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;
    case 'paperclip':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>`;
    case 'message':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
    case 'send':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;
    case 'refresh':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>`;
    default:
      return '';
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

window.XIASUI = {
  svgIcon,
  activeTab: 'TODO', // 'TODO' (Надо сделать) по умолчанию, 'ALL', 'REVIEW', 'DONE'
  searchQuery: '',
  allCourses: [],

  isValidTask(task) {
    if (!task || !task.title) return false;
    const title = String(task.title).trim();
    if (title.length < 2 || title.length > 150) return false;
    const lower = title.toLowerCase();
    const garbage = [
      'факультет',
      'институт',
      'специальность',
      'бакалавриат',
      'контрольная дата',
      'максимальный балл',
      'назначенные задания',
      'требуется ли',
      'выбрать',
      '- блок -',
      'дисциплина:',
      'название требуется'
    ];
    if (garbage.some(w => lower.includes(w))) return false;
    if ((title.match(/\n/g) || []).length > 1) return false;

    // Фильтрация сводных строк категорий (например: «Лабораторные работы 1», «Практические работы 2»)
    const isPluralGroup = /^(лабораторные|практические|контрольные|семестровые|самостоятельные|расчетно-графические)\s+(работы|занятия|задания)/i.test(title);
    if (isPluralGroup && !task.actionUrl && (!task.stateRaw || task.status === 'TODO')) {
      return false;
    }

    return true;
  },

  async renderDashboard(courses, studentInfo) {
    this.allCourses = courses;

    // 1. Скрываем старые громоздкие таблицы
    const legacyCenter = document.querySelector('center');
    if (legacyCenter) {
      legacyCenter.style.display = 'none';
    }

    // 2. Получаем кэшированные задания по всем курсам
    const cachedTasksMap = await this.getCachedAssignments();
    const syncedTasksMap = await window.XIASTickTick.getSyncedMap();

    // Санитизация кэшированных заданий (авто-очистка от мусорных данных)
    let cacheUpdated = false;
    for (const key of Object.keys(cachedTasksMap)) {
      const original = cachedTasksMap[key] || [];
      const clean = original.filter(t => this.isValidTask(t));
      if (clean.length !== original.length) {
        cachedTasksMap[key] = clean;
        cacheUpdated = true;
      }
    }
    if (cacheUpdated) {
      chrome.storage.local.set({ xiasCachedAssignments: cachedTasksMap });
    }

    // Связываем курсы с их заданиями из кэша
    courses.forEach(c => {
      c.assignments = (cachedTasksMap[c.name] || []).filter(t => this.isValidTask(t));
    });

    // 3. Создаем или находим контейнер дашборда
    let root = document.getElementById('xias-app-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'xias-app-root';
      document.body.prepend(root);
    }

    // Расчет сводной статистики
    let totalTasksCount = 0;
    let todoCount = 0;
    let reviewCount = 0;
    let doneCount = 0;
    let totalScoreSum = 0;

    courses.forEach(c => {
      totalScoreSum += c.score || 0;
      (c.assignments || []).forEach(t => {
        totalTasksCount++;
        if (t.status === 'TODO') todoCount++;
        else if (t.status === 'REVIEW') reviewCount++;
        else if (t.status === 'DONE') doneCount++;
      });
    });

    // Сохраняем список курсов для использования на страницах заданий
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({
        xiasCachedCourses: courses.map(c => ({
          id: c.id,
          name: c.name,
          tasksUrl: c.tasksUrl,
          teacher: c.teacher
        }))
      });
    }

    // Если нет несданных заданий или задания ещё не подгрузились, открываем «Все предметы»
    if (todoCount === 0) {
      this.activeTab = 'ALL';
    } else {
      this.activeTab = 'TODO';
    }

    // Рендер HTML дашборда
    root.innerHTML = `
      <!-- Шапка -->
      <header class="xias-header">
        <div class="xias-logo-wrap">
          <div class="xias-logo-icon">X</div>
          <div class="xias-title-box">
            <h1>XIAS <span class="xias-pill-badge">ЭИОС+ КемГУ</span></h1>
            <p>${escapeHtml(studentInfo.faculty || 'Институт цифры')} • ${escapeHtml(studentInfo.specialty || 'Бакалавриат')}</p>
          </div>
        </div>
        <div class="xias-user-info">
          <div class="xias-user-name">${escapeHtml(studentInfo.name || 'Студент')}</div>
          <div class="xias-user-meta">Учебный год ${escapeHtml(studentInfo.year || '2026-2027')}</div>
        </div>
      </header>

      <!-- Карточки статистики -->
      <div class="xias-stats-grid">
        <div class="xias-stat-card">
          <div class="xias-stat-icon" style="background:#e0e7ff; color:#4338ca;">${svgIcon('book', 20)}</div>
          <div>
            <div class="xias-stat-val" id="xias-stat-courses-val">${courses.length}</div>
            <div class="xias-stat-lbl">Дисциплин в семестре</div>
          </div>
        </div>
        <div class="xias-stat-card">
          <div class="xias-stat-icon" style="background:#fee2e2; color:#b91c1c;">${svgIcon('clock', 20)}</div>
          <div>
            <div class="xias-stat-val" id="xias-stat-todo-val" style="color:#b91c1c;">${todoCount}</div>
            <div class="xias-stat-lbl">Нужно сдать</div>
          </div>
        </div>
        <div class="xias-stat-card">
          <div class="xias-stat-icon" style="background:#fef3c7; color:#b45309;">${svgIcon('search', 20)}</div>
          <div>
            <div class="xias-stat-val" id="xias-stat-review-val" style="color:#b45309;">${reviewCount}</div>
            <div class="xias-stat-lbl">На проверке у препода</div>
          </div>
        </div>
        <div class="xias-stat-card">
          <div class="xias-stat-icon" style="background:#d1fae5; color:#047857;">${svgIcon('check', 20)}</div>
          <div>
            <div class="xias-stat-val" id="xias-stat-done-val" style="color:#047857;">${doneCount}</div>
            <div class="xias-stat-lbl">Оценено / Сдано</div>
          </div>
        </div>
        <div class="xias-stat-card">
          <div class="xias-stat-icon" style="background:#f1f5f9; color:#334155;">${svgIcon('award', 20)}</div>
          <div>
            <div class="xias-stat-val" id="xias-stat-score-val">${totalScoreSum}</div>
            <div class="xias-stat-lbl">Всего баллов БРС</div>
          </div>
        </div>
      </div>

      <!-- Панель фильтров и действий -->
      <div class="xias-controls">
        <div class="xias-tabs">
          <button class="xias-tab-btn ${this.activeTab === 'TODO' ? 'active' : ''}" data-tab="TODO"><span class="xias-tab-dot dot-todo"></span>Надо сделать (<span id="xias-tab-todo-count">${todoCount}</span>)</button>
          <button class="xias-tab-btn ${this.activeTab === 'ALL' ? 'active' : ''}" data-tab="ALL">Все предметы</button>
          <button class="xias-tab-btn ${this.activeTab === 'REVIEW' ? 'active' : ''}" data-tab="REVIEW"><span class="xias-tab-dot dot-review"></span>На проверке (<span id="xias-tab-review-count">${reviewCount}</span>)</button>
          <button class="xias-tab-btn ${this.activeTab === 'DONE' ? 'active' : ''}" data-tab="DONE"><span class="xias-tab-dot dot-done"></span>Оценено (<span id="xias-tab-done-count">${doneCount}</span>)</button>
        </div>

        <div class="xias-actions-group">
          <input type="text" id="xias-search-input" class="xias-search-input" placeholder="Поиск по предмету или лабе..." value="${escapeHtml(this.searchQuery)}">
          
          <button id="xias-refresh-courses-btn" class="xias-btn xias-btn-outline" title="Обновить задания по всем предметам из ЭИОС">
            <span class="xias-inline-icon" id="xias-sync-icon">${svgIcon('refresh', 14)}</span> <span id="xias-sync-btn-text">Обновить задания</span>
          </button>

          <span id="xias-sync-status-indicator" class="xias-sync-status" style="display:none;"></span>

          <button id="xias-sync-all-ticktick" class="xias-btn xias-btn-ticktick">
            <span class="xias-inline-icon">${svgIcon('check', 14)}</span> Синхронизировать с TickTick
          </button>

          <button id="xias-refresh-ticktick" class="xias-btn xias-btn-outline" title="Проверить актуальность задач в TickTick">
            <span class="xias-inline-icon">${svgIcon('refresh', 14)}</span> Проверить TickTick
          </button>

          <button id="xias-toggle-legacy" class="xias-btn xias-btn-outline" title="Вернуть классический интерфейс ЭИОС">
            <span class="xias-inline-icon">${svgIcon('eye', 14)}</span> Старый вид
          </button>
        </div>
      </div>

      <!-- Сетка курсов -->
      <div id="xias-courses-container" class="xias-courses-grid">
        <!-- Генерируется ниже -->
      </div>
    `;

    this.renderCourseCards(courses, syncedTasksMap);
    this.bindEvents(courses, legacyCenter);

    // Автоматическая фоновая синхронизация заданий всех дисциплин текущего семестра
    this.syncAllCourseAssignments(courses).catch(err => {
      console.warn('[XIAS] Auto-sync courses error:', err);
    });

    // Фоновая сверка актуальности задач с TickTick (удаляет отметки с задач, удалённых в TickTick, и обновляет выполненные)
    if (window.XIASTickTick && typeof window.XIASTickTick.reconcileSyncedTasks === 'function') {
      window.XIASTickTick.reconcileSyncedTasks().then(async updatedMap => {
        if (updatedMap) {
          if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            const { xiasCachedAssignments } = await chrome.storage.local.get(['xiasCachedAssignments']);
            if (xiasCachedAssignments) {
              courses.forEach(c => {
                if (xiasCachedAssignments[c.name]) {
                  c.assignments = xiasCachedAssignments[c.name].filter(t => this.isValidTask(t));
                }
              });
              this.updateStatsCounters(courses);
            }
          }
          this.renderCourseCards(courses, updatedMap);
        }
      }).catch(err => {
        console.warn('[XIAS TickTick] Auto-reconcile error:', err);
      });
    }

    // Зеркалирование данных в локальный MCP сервер
    this.syncToLocalMcpServer();
  },

  updateStatsCounters(courses) {
    let todoCount = 0;
    let reviewCount = 0;
    let doneCount = 0;
    let totalScoreSum = 0;

    (courses || []).forEach(c => {
      totalScoreSum += c.score || 0;
      (c.assignments || []).forEach(t => {
        if (!this.isValidTask(t)) return;
        if (t.status === 'TODO') todoCount++;
        else if (t.status === 'REVIEW') reviewCount++;
        else if (t.status === 'DONE') doneCount++;
      });
    });

    const todoEl = document.getElementById('xias-stat-todo-val');
    if (todoEl) todoEl.textContent = String(todoCount);
    const reviewEl = document.getElementById('xias-stat-review-val');
    if (reviewEl) reviewEl.textContent = String(reviewCount);
    const doneEl = document.getElementById('xias-stat-done-val');
    if (doneEl) doneEl.textContent = String(doneCount);
    const scoreEl = document.getElementById('xias-stat-score-val');
    if (scoreEl) scoreEl.textContent = String(totalScoreSum);

    const tabTodo = document.getElementById('xias-tab-todo-count');
    if (tabTodo) tabTodo.textContent = String(todoCount);
    const tabReview = document.getElementById('xias-tab-review-count');
    if (tabReview) tabReview.textContent = String(reviewCount);
    const tabDone = document.getElementById('xias-tab-done-count');
    if (tabDone) tabDone.textContent = String(doneCount);
  },

  async syncAllCourseAssignments(courses, onProgress) {
    if (!courses || courses.length === 0) return;

    const statusEl = document.getElementById('xias-sync-status-indicator');
    const syncBtn = document.getElementById('xias-refresh-courses-btn');
    const syncIcon = document.getElementById('xias-sync-icon');

    if (statusEl) {
      statusEl.style.display = 'inline-block';
      statusEl.textContent = `Синхронизация предметов... (0/${courses.length})`;
    }
    if (syncIcon) {
      syncIcon.classList.add('xias-spinning');
    }
    if (syncBtn) {
      syncBtn.disabled = true;
    }

    let cachedTasksMap = {};
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const storageData = await new Promise(r => chrome.storage.local.get('xiasCachedAssignments', r));
      cachedTasksMap = (storageData && storageData.xiasCachedAssignments) || {};
    }

    let completedCount = 0;
    const parser = window.XIASParser;

    for (let i = 0; i < courses.length; i++) {
      const course = courses[i];
      if (!course.tasksUrl) {
        completedCount++;
        continue;
      }

      try {
        const fullUrl = (typeof window !== 'undefined' && window.location)
          ? new URL(course.tasksUrl, window.location.href).href
          : course.tasksUrl;

        const res = await fetch(fullUrl, { credentials: 'include' });
        if (res.ok) {
          let html = '';
          try {
            const buf = await res.arrayBuffer();
            if (typeof TextDecoder !== 'undefined') {
              const decoder = new TextDecoder('windows-1251');
              html = decoder.decode(buf);
            } else {
              html = await res.text();
            }
          } catch (e) {
            html = await res.text();
          }

          if (typeof DOMParser !== 'undefined' && parser && typeof parser.parseTasksFromDocument === 'function') {
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const parsed = parser.parseTasksFromDocument(doc, course.name, course.teacher);
            if (parsed && Array.isArray(parsed.assignments)) {
              const validAssignments = parsed.assignments.filter(t => this.isValidTask(t));
              if (validAssignments.length > 0 || !cachedTasksMap[course.name] || cachedTasksMap[course.name].length === 0) {
                cachedTasksMap[course.name] = validAssignments;
                course.assignments = validAssignments;
              }
            }
          }
        }
      } catch (err) {
        console.warn(`[XIAS] Failed to sync assignments for "${course.name}":`, err);
      }

      completedCount++;
      if (statusEl) {
        statusEl.textContent = `Синхронизация предметов... (${completedCount}/${courses.length})`;
      }
      if (typeof onProgress === 'function') {
        onProgress(completedCount, courses.length);
      }
    }

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await new Promise(r => chrome.storage.local.set({ xiasCachedAssignments: cachedTasksMap }, r));
    }

    this.updateStatsCounters(courses);

    const syncedMap = (window.XIASTickTick && typeof window.XIASTickTick.getSyncedMap === 'function')
      ? await window.XIASTickTick.getSyncedMap()
      : {};
    this.renderCourseCards(courses, syncedMap);

    if (statusEl) {
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      statusEl.textContent = `Обновлено в ${nowStr}`;
      setTimeout(() => {
        if (statusEl) statusEl.style.display = 'none';
      }, 5000);
    }
    if (syncIcon) {
      syncIcon.classList.remove('xias-spinning');
    }
    if (syncBtn) {
      syncBtn.disabled = false;
    }
  },

  renderCourseCards(courses, syncedTasksMap) {
    const container = document.getElementById('xias-courses-container');
    if (!container) return;

    const query = this.searchQuery.toLowerCase().trim();

    // Фильтрация
    const filteredCourses = courses.filter(course => {
      const matchName = course.name.toLowerCase().includes(query) || (course.teacher && course.teacher.toLowerCase().includes(query));
      
      // Если фильтр по статусу задания
      if (this.activeTab !== 'ALL') {
        const hasMatchingTask = (course.assignments || []).some(t => t.status === this.activeTab && (query === '' || t.title.toLowerCase().includes(query) || (t.teacher && t.teacher.toLowerCase().includes(query))));
        return hasMatchingTask;
      }

      return matchName || (course.assignments || []).some(t => t.title.toLowerCase().includes(query));
    });

    if (filteredCourses.length === 0) {
      if (this.activeTab === 'TODO' && !query) {
        container.innerHTML = `
          <div style="grid-column: 1 / -1; text-align:center; padding: 40px; background:#fff; border-radius:12px; border:1px solid #e2e8f0;">
            <div style="margin-bottom:8px; color:#10b981; display:flex; justify-content:center;">${svgIcon('check', 32)}</div>
            <h3 style="margin:0 0 6px;">Все задания сданы или ещё не синхронизированы</h3>
            <p style="color:#64748b; margin:0 0 16px;">Вкладка «Надо сделать» пуста. Откройте нужный предмет в старом виде для сбора заданий или переключитесь на «Все предметы».</p>
            <button class="xias-btn xias-btn-primary" id="xias-empty-switch-all" style="margin:0 auto;">Показать все предметы</button>
          </div>
        `;
        const switchBtn = container.querySelector('#xias-empty-switch-all');
        if (switchBtn) {
          switchBtn.addEventListener('click', () => {
            const allBtn = document.querySelector('.xias-tab-btn[data-tab="ALL"]');
            if (allBtn) allBtn.click();
          });
        }
        return;
      }

      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align:center; padding: 40px; background:#fff; border-radius:12px; border:1px solid #e2e8f0;">
          <div style="margin-bottom:8px; color:#94a3b8; display:flex; justify-content:center;">${svgIcon('search', 32)}</div>
          <h3 style="margin:0 0 6px;">Ничего не найдено</h3>
          <p style="color:#64748b; margin:0;">Попробуйте изменить запрос или переключить вкладку.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filteredCourses.map(course => {
      const validAssignments = (course.assignments || []).filter(t => this.isValidTask(t));
      const tasks = validAssignments.filter(t => {
        if (this.activeTab !== 'ALL' && t.status !== this.activeTab) return false;
        if (query && !t.title.toLowerCase().includes(query) && !course.name.toLowerCase().includes(query) && !(t.teacher && t.teacher.toLowerCase().includes(query))) return false;
        return true;
      });

      return `
        <div class="xias-course-card" data-course-id="${escapeHtml(course.id)}">
          <div class="xias-card-header">
            <div>
              <h3 class="xias-course-title">${escapeHtml(course.name)}</h3>
              <div class="xias-course-teacher">
                <span class="xias-inline-icon">${svgIcon('user', 14)}</span> ${escapeHtml(course.teacher || 'Преподаватель не указан')}
              </div>
            </div>
            <div class="xias-card-badges">
              <span class="xias-pill-badge">${escapeHtml(course.reportingType || 'Зачет')}</span>
              <span class="xias-score-badge ${course.score > 0 ? 'has-score' : ''}">
                ${course.score || 0} баллов
              </span>
            </div>
          </div>

          <div class="xias-assignments-list">
            ${tasks.length === 0 ? `
              <div class="xias-no-tasks-state">
                <div class="xias-no-tasks-desc">${validAssignments.length > 0 ? 'В этой категории нет заданий' : 'Задания еще не синхронизированы. Нажмите «Открыть задания», чтобы загрузить список.'}</div>
              </div>
            ` : tasks.map(task => {
              const isSynced = !!syncedTasksMap[task.uniqueId];
              const taskTeacher = task.teacher || course.teacher || 'Преподаватель не указан';
              return `
                <div class="xias-task-row" data-task-id="${escapeHtml(task.uniqueId)}">
                  <div class="xias-task-info">
                    <div class="xias-task-header-row">
                      <span class="xias-task-teacher" title="Преподаватель">
                        <span class="xias-inline-icon">${svgIcon('user', 11)}</span> ${escapeHtml(taskTeacher)}
                      </span>
                      <span class="xias-task-title">${escapeHtml(task.title)}</span>
                    </div>
                    <div class="xias-task-meta">
                      <span class="xias-status-pill xias-status-${task.status}">${escapeHtml(task.statusLabel)}</span>
                      ${task.deadlineRaw ? `
                        <span class="xias-task-deadline">
                          <span class="xias-inline-icon">${svgIcon('calendar', 12)}</span> Крайний срок: <b>${escapeHtml(task.deadlineRaw)}</b>
                        </span>
                      ` : ''}
                      ${task.resultScore ? `<span>• Балл: <b>${escapeHtml(task.resultScore)} / ${escapeHtml(task.maxScore || 100)}</b></span>` : ''}
                      ${task.attachments && task.attachments.length > 0 ? `
                        <span class="xias-task-attach-pill" title="Прикреплены материалы">
                          <span class="xias-inline-icon">${svgIcon('paperclip', 11)}</span> ${task.attachments.length}
                        </span>
                      ` : ''}
                    </div>
                  </div>

                  <div class="xias-task-actions">
                    <button class="xias-btn xias-btn-sm xias-btn-outline xias-task-modal-open-btn"
                            data-course-id="${escapeHtml(course.id)}"
                            data-task-id="${escapeHtml(task.uniqueId)}">
                      Подробнее / Сдать
                    </button>
                    <button class="xias-btn xias-btn-sm ${isSynced ? 'xias-btn-outline xias-btn-synced' : 'xias-btn-ticktick'} xias-single-sync-btn"
                            data-task-id="${escapeHtml(task.uniqueId)}" 
                            data-course="${encodeURIComponent(course.name)}"
                            data-teacher="${encodeURIComponent(taskTeacher)}"
                            data-title="${encodeURIComponent(task.title)}"
                            data-deadline="${escapeHtml(task.deadlineISO || '')}"
                            data-deadline-raw="${encodeURIComponent(task.deadlineRaw || '')}"
                            data-status-label="${encodeURIComponent(task.statusLabel || '')}"
                            data-result-score="${encodeURIComponent(task.resultScore || '')}"
                            data-max-score="${encodeURIComponent(task.maxScore || '')}"
                            data-comment="${encodeURIComponent(task.comment || '')}"
                            data-synced="${isSynced ? 'true' : 'false'}"
                            title="${isSynced ? 'В TickTick (нажмите для повторной отправки)' : 'Добавить в TickTick'}">
                      ${isSynced ? `<span class="xias-inline-icon">${svgIcon('check', 12)}</span> В TickTick` : '+ TickTick'}
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <div class="xias-card-footer">
            <span style="font-size:12px; color:#64748b;">${course.hours ? course.hours + ' ч' : ''} ${course.period ? '• ' + course.period : ''}</span>
            <button class="xias-btn xias-btn-primary xias-btn-sm xias-open-course-btn" data-course-id="${escapeHtml(course.id)}">
              Открыть задания <span class="xias-inline-icon" style="margin-left:4px; margin-right:0;">${svgIcon('arrow-right', 12)}</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  // Бабл с подробной информацией о задании и загрузкой решения
  openTaskModal(task, course) {
    this.closeTaskModal();

    const teacher = task.teacher || course.teacher || 'Преподаватель не указан';
    const overlay = document.createElement('div');
    overlay.id = 'xias-modal-overlay';
    overlay.className = 'xias-modal-overlay';

    overlay.innerHTML = `
      <div id="xias-task-modal" class="xias-task-modal" role="dialog" aria-modal="true">
        <div class="xias-modal-header">
          <div>
            <div class="xias-modal-eyebrow">
              <span class="xias-inline-icon">${svgIcon('book', 14)}</span> ${escapeHtml(course.name)}
              • <span class="xias-inline-icon">${svgIcon('user', 14)}</span> ${escapeHtml(teacher)}
            </div>
            <h2 class="xias-modal-title">${escapeHtml(task.title)}</h2>
          </div>
          <button id="xias-modal-close" class="xias-modal-close-btn" aria-label="Закрыть">${svgIcon('x', 18)}</button>
        </div>

        <div class="xias-modal-body">
          <div class="xias-modal-stats-grid">
            <div class="xias-modal-stat-box">
              <div class="xias-modal-stat-label">Состояние</div>
              <div class="xias-modal-stat-val">
                <span class="xias-status-pill xias-status-${task.status}">${escapeHtml(task.statusLabel)}</span>
              </div>
            </div>
            <div class="xias-modal-stat-box">
              <div class="xias-modal-stat-label">Крайний срок сдачи</div>
              <div class="xias-modal-stat-val">
                <span class="xias-inline-icon">${svgIcon('calendar', 14)}</span>
                ${task.deadlineRaw ? escapeHtml(task.deadlineRaw) : 'Не установлен'}
              </div>
            </div>
            <div class="xias-modal-stat-box">
              <div class="xias-modal-stat-label">Баллы БРС</div>
              <div class="xias-modal-stat-val">
                ${task.resultScore ? `${escapeHtml(task.resultScore)} / ${escapeHtml(task.maxScore || 100)}` : 'Еще не выставлены'}
              </div>
            </div>
            <div class="xias-modal-stat-box">
              <div class="xias-modal-stat-label">Преподаватель</div>
              <div class="xias-modal-stat-val">
                ${escapeHtml(teacher)}
              </div>
            </div>
          </div>

          ${task.comment ? `
            <div class="xias-modal-section">
              <div class="xias-modal-section-title">
                <span class="xias-inline-icon">${svgIcon('message', 14)}</span> Замечание / Комментарий преподавателя
              </div>
              <div class="xias-teacher-comment-box">${escapeHtml(task.comment)}</div>
            </div>
          ` : ''}

          ${task.attachments && task.attachments.length > 0 ? `
            <div class="xias-modal-section">
              <div class="xias-modal-section-title">
                <span class="xias-inline-icon">${svgIcon('paperclip', 14)}</span> Материалы и задание к работе (${task.attachments.length})
              </div>
              <div class="xias-attachments-grid">
                ${task.attachments.map(att => `
                  <a href="${escapeHtml(att.url)}" target="_blank" rel="noopener noreferrer" class="xias-attachment-link">
                    <span class="xias-inline-icon">${svgIcon('file', 14)}</span>
                    <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:260px;">${escapeHtml(att.name)}</span>
                    <span class="xias-inline-icon" style="margin-left:auto; margin-right:0;">${svgIcon('external-link', 12)}</span>
                  </a>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Интерфейс отправки решения с авто-ZIP сжатием -->
          <div class="xias-modal-section xias-submission-box">
            <div class="xias-modal-section-title">
              <span class="xias-inline-icon">${svgIcon('upload', 14)}</span> Отправка решения
            </div>

            <div class="xias-auto-zip-notice">
              <span class="xias-inline-icon" style="flex-shrink:0;">${svgIcon('archive', 16)}</span>
              <span>Файлы <b>.docx</b>, <b>.txt</b> и <b>.zip</b> отправляются без изменений. Все остальные форматы (.py, .pdf, .cpp, .xlsx и др.) автоматически упаковываются в <b>.zip</b> архив.</span>
            </div>

            <div class="xias-dropzone" id="xias-modal-dropzone">
              <input type="file" id="xias-modal-file-input" multiple style="display:none;" />
              <div class="xias-dropzone-icon">${svgIcon('upload', 28)}</div>
              <div class="xias-dropzone-title">Перетащите файлы сюда или <button type="button" class="xias-link-btn" id="xias-modal-browse-btn">выберите на компьютере</button></div>
              <div class="xias-dropzone-desc">Поддерживаются любые файлы проектов, архивы и документы</div>
            </div>

            <div id="xias-modal-file-preview" class="xias-file-preview-list"></div>

            <div class="xias-modal-comment-wrap">
              <label for="xias-modal-solution-title" class="xias-modal-label">Название (обязательно):</label>
              <input type="text" id="xias-modal-solution-title" class="xias-modal-input" value="${escapeHtml(task.title || 'Решение')}" placeholder="Например: Лабораторная работа 1" required />
            </div>

            <div class="xias-modal-comment-wrap" style="margin-top: 10px;">
              <label for="xias-modal-answer-comment" class="xias-modal-label">Комментарий к решению (необязательно):</label>
              <textarea id="xias-modal-answer-comment" class="xias-modal-textarea" rows="2" placeholder="Напишите пояснение или комментарий к вашей работе..."></textarea>
            </div>

            <div class="xias-modal-actions">
              <button id="xias-modal-submit-btn" class="xias-btn xias-btn-primary" disabled>
                <span class="xias-inline-icon">${svgIcon('send', 14)}</span> Отправить решение
              </button>
              ${task.actionUrl ? `
                <a href="${escapeHtml(task.actionUrl)}" target="_blank" rel="noopener noreferrer" class="xias-btn xias-btn-outline">
                  <span class="xias-inline-icon">${svgIcon('external-link', 14)}</span> Страница сдачи в ЭИОС
                </a>
              ` : ''}
              <span id="xias-modal-status-msg" class="xias-modal-status-msg"></span>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Логика добавления и авто-сжатия файлов
    let currentRawFiles = [];
    let processedResult = [];

    const dropzone = overlay.querySelector('#xias-modal-dropzone');
    const fileInput = overlay.querySelector('#xias-modal-file-input');
    const browseBtn = overlay.querySelector('#xias-modal-browse-btn');
    const previewList = overlay.querySelector('#xias-modal-file-preview');
    const submitBtn = overlay.querySelector('#xias-modal-submit-btn');
    const statusMsg = overlay.querySelector('#xias-modal-status-msg');

    const updateFiles = async (fileList) => {
      try {
        const added = Array.from(fileList);
        if (added.length === 0) return;
        currentRawFiles = currentRawFiles.concat(added);

        if (window.XIASZipHelper) {
          const res = await window.XIASZipHelper.processFilesForSubmission(currentRawFiles, task.title);
          processedResult = [{
            name: res.fileToUpload.name,
            size: res.fileToUpload.size,
            isZipped: res.isZipped,
            originalCount: res.originalFiles ? res.originalFiles.length : currentRawFiles.length,
            blob: res.fileToUpload,
            file: res.fileToUpload
          }];
        } else {
          processedResult = currentRawFiles.map(f => ({
            name: f.name,
            size: f.size,
            isZipped: false,
            originalCount: 1,
            blob: f,
            file: f
          }));
        }

        renderFilesList();
      } catch (err) {
        console.error('[XIAS] Error processing files:', err);
        statusMsg.className = 'xias-modal-status-msg error';
        statusMsg.innerText = 'Ошибка при обработке файлов: ' + err.message;
      }
    };

    const renderFilesList = () => {
      if (processedResult.length === 0) {
        previewList.innerHTML = '';
        submitBtn.disabled = true;
        return;
      }

      submitBtn.disabled = false;
      previewList.innerHTML = processedResult.map((item, idx) => `
        <div class="xias-file-chip ${item.isZipped ? 'is-zipped' : ''}">
          <span class="xias-inline-icon">${svgIcon(item.isZipped ? 'archive' : 'file', 14)}</span>
          <div class="xias-file-chip-info">
            <span class="xias-file-chip-name">${escapeHtml(item.name)}</span>
            <span class="xias-file-chip-size">${formatBytes(item.size)}</span>
          </div>
          <span class="xias-pill-badge ${item.isZipped ? 'xias-badge-zip' : 'xias-badge-raw'}">
            ${item.isZipped ? `Авто-ZIP (${item.originalCount || currentRawFiles.length} файл.)` : 'Без сжатия'}
          </span>
          ${item.isZipped ? `
            <button type="button" class="xias-download-chip-btn" data-chip-idx="${idx}" title="Скачать созданный ZIP архив">
              <span class="xias-inline-icon">${svgIcon('arrow-right', 12)}</span> Сохранить ZIP
            </button>
          ` : ''}
          <button type="button" class="xias-remove-chip-btn" data-chip-idx="${idx}" title="Удалить">
            <span class="xias-inline-icon">${svgIcon('x', 12)}</span>
          </button>
        </div>
      `).join('');

      // Привязка скачивания готового zip
      previewList.querySelectorAll('.xias-download-chip-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(btn.dataset.chipIdx, 10);
          const item = processedResult[idx];
          if (item && item.blob) {
            const url = URL.createObjectURL(item.blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = item.name;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
              URL.revokeObjectURL(url);
              a.remove();
            }, 1000);
          }
        });
      });

      // Привязка удаления файлов
      previewList.querySelectorAll('.xias-remove-chip-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          currentRawFiles = [];
          processedResult = [];
          renderFilesList();
        });
      });
    };

    dropzone.addEventListener('click', (e) => {
      if (e.target !== browseBtn) {
        fileInput.click();
      }
    });

    browseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      fileInput.click();
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files.length > 0) {
        updateFiles(fileInput.files);
        fileInput.value = '';
      }
    });

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        updateFiles(e.dataTransfer.files);
      }
    });

    // Обработчик отправки решения
    submitBtn.addEventListener('click', async () => {
      const titleInput = overlay.querySelector('#xias-modal-solution-title');
      const solutionTitle = titleInput ? titleInput.value.trim() : task.title;

      if (!solutionTitle) {
        statusMsg.className = 'xias-modal-status-msg error';
        statusMsg.innerText = 'Пожалуйста, укажите название работы (обязательное поле).';
        if (titleInput && typeof titleInput.focus === 'function') titleInput.focus();
        return;
      }

      if (processedResult.length === 0) {
        statusMsg.className = 'xias-modal-status-msg error';
        statusMsg.innerText = 'Пожалуйста, выберите файл для загрузки.';
        return;
      }

      submitBtn.disabled = true;
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = `<span class="xias-spinner"></span> Отправка...`;
      statusMsg.className = 'xias-modal-status-msg';
      statusMsg.innerText = '';

      const commentEl = overlay.querySelector('#xias-modal-answer-comment');
      const comment = commentEl ? commentEl.value : '';

      try {
        let targetActionUrl = task.actionUrl || '';
        if (targetActionUrl && !targetActionUrl.startsWith('http')) {
          try {
            targetActionUrl = new URL(targetActionUrl, 'https://xiais.kemsu.ru/proc/stud/course_st/').href;
          } catch (e) {}
        }
        if (targetActionUrl && targetActionUrl.includes('/proc/stud/send_task.htm')) {
          targetActionUrl = targetActionUrl.replace('/proc/stud/send_task.htm', '/proc/stud/course_st/send_task.htm');
        }

        let courseTasksUrl = (course && course.tasksUrl) || '';
        if (!courseTasksUrl && course && course.rawRow) {
          const anyLink = course.rawRow.querySelector('a[href*="tasks"], a[href*="course"], a');
          if (anyLink) {
            courseTasksUrl = anyLink.getAttribute('href') || anyLink.href || '';
          }
          if (!courseTasksUrl) {
            const form = course.rawRow.querySelector('form');
            if (form) {
              const act = form.getAttribute('action') || '';
              const params = Array.from(form.querySelectorAll('input'))
                .filter(i => i.name && i.value)
                .map(i => `${encodeURIComponent(i.name)}=${encodeURIComponent(i.value)}`)
                .join('&');
              if (act) courseTasksUrl = act + (params ? (act.includes('?') ? '&' : '?') + params : '');
            }
          }
          if (!courseTasksUrl) {
            const onclickEls = course.rawRow.querySelectorAll('[onclick]');
            for (const el of onclickEls) {
              const oc = el.getAttribute('onclick') || '';
              const m = oc.match(/(?:location\.href|location|open)\s*=\s*['"]([^'"]+)['"]/i)
                || oc.match(/(?:window\.open|location\.assign|location\.replace)\s*\(\s*['"]([^'"]+)['"]/i)
                || oc.match(/['"](course_st\/[^'"]+)['"]/i);
              if (m) {
                courseTasksUrl = m[1];
                break;
              }
            }
          }
        }
        if (courseTasksUrl && !courseTasksUrl.startsWith('javascript:')) {
          try {
            courseTasksUrl = new URL(courseTasksUrl, 'https://xiais.kemsu.ru/proc/stud/').href;
            if (course) course.tasksUrl = courseTasksUrl;
          } catch (e) {}
        }

        // If targetActionUrl is still missing, fetch the course tasks page to find the real actionUrl!
        if (!targetActionUrl && courseTasksUrl) {
          try {
            const ctrlCourse = (typeof AbortController !== 'undefined') ? new AbortController() : null;
            const tCourse = ctrlCourse ? setTimeout(() => ctrlCourse.abort(), 10000) : null;
            const courseRes = await fetch(courseTasksUrl, {
              credentials: 'include',
              signal: ctrlCourse ? ctrlCourse.signal : undefined
            });
            if (tCourse) clearTimeout(tCourse);
            if (courseRes.ok) {
              const buf = await courseRes.arrayBuffer();
              const cHtml = (typeof TextDecoder !== 'undefined') ? new TextDecoder('windows-1251').decode(buf) : await courseRes.text();
              const cDoc = new DOMParser().parseFromString(cHtml, 'text/html');
              if (window.XIASParser) {
                const parsedCourse = window.XIASParser.parseTasksFromDocument(cDoc, course.name, course.teacher);
                if (parsedCourse && Array.isArray(parsedCourse.assignments)) {
                  course.assignments = parsedCourse.assignments;
                  this.saveCourseAssignments(course.name, parsedCourse.assignments);
                  const matchingTask = (parsedCourse.assignments || []).find(t => t.title === task.title || t.uniqueId === task.uniqueId);
                  if (matchingTask && matchingTask.actionUrl) {
                    targetActionUrl = matchingTask.actionUrl;
                    task.actionUrl = matchingTask.actionUrl;
                  }
                }
              }
            }
          } catch (e) {
            console.warn('[XIAS Upload] Course tasks probe notice:', e);
          }
        }

        if (!targetActionUrl) {
          throw new Error('Не удалось определить ссылку для сдачи работы. Возможно, для этого задания еще не открыта сдача в ЭИОС.');
        }

        // 1. Fetch the submission form page
        let formDoc = null;
        let formRes = null;
        try {
          const ctrlForm = (typeof AbortController !== 'undefined') ? new AbortController() : null;
          const tForm = ctrlForm ? setTimeout(() => ctrlForm.abort(), 10000) : null;
          formRes = await fetch(targetActionUrl, {
            credentials: 'include',
            signal: ctrlForm ? ctrlForm.signal : undefined
          });
          if (tForm) clearTimeout(tForm);
          if (formRes.ok) {
            let formHtml = '';
            try {
              const buf = await formRes.arrayBuffer();
              if (typeof TextDecoder !== 'undefined') {
                formHtml = new TextDecoder('windows-1251').decode(buf);
              } else {
                formHtml = await formRes.text();
              }
            } catch (e) {
              formHtml = await formRes.text();
            }
            if (typeof DOMParser !== 'undefined') {
              formDoc = new DOMParser().parseFromString(formHtml, 'text/html');
            }
          }
        } catch (fetchErr) {
          console.warn('[XIAS Upload] Notice fetching form page:', fetchErr);
        }

        // 2. Locate the upload form
        let fileInp = formDoc ? formDoc.querySelector('input[type="file"]') : null;
        let uploadForm = formDoc ? (
          (fileInp && fileInp.closest('form'))
          || formDoc.querySelector('form[enctype*="multipart" i]')
          || Array.from(formDoc.querySelectorAll('form')).find(f => f.querySelector('textarea') || (f.action && f.action.includes('task')))
          || formDoc.querySelector('form')
        ) : null;

        let uploadActionUrl = targetActionUrl;
        if (uploadForm && uploadForm.getAttribute('action')) {
          uploadActionUrl = new URL(uploadForm.getAttribute('action'), targetActionUrl).href;
        }
        uploadActionUrl = uploadActionUrl.replace(/^http:/i, 'https:');

        // 3. Assemble FormData with all form fields
        const formData = new FormData();
        const fileItem = processedResult[0];
        const uploadBlob = fileItem.blob || fileItem.file;
        const uploadFileName = fileItem.name;

        if (uploadForm) {
          // Hidden inputs
          uploadForm.querySelectorAll('input[type="hidden"]').forEach(inp => {
            if (inp.name) formData.append(inp.name, inp.value || '');
          });

          // Text inputs (title, topic, etc.)
          let hasTitle = false;
          uploadForm.querySelectorAll('input[type="text"]').forEach(inp => {
            if (inp.name) {
              const n = inp.name.toLowerCase();
              if (n.includes('name') || n.includes('title') || n.includes('tema') || n.includes('theme') || n.includes('work') || n.includes('zag')) {
                formData.append(inp.name, solutionTitle);
                hasTitle = true;
              } else if (!formData.has(inp.name)) {
                formData.append(inp.name, inp.value || '');
              }
            }
          });
          if (!hasTitle) {
            formData.append('name', solutionTitle);
          }

          // Textarea
          let hasComment = false;
          uploadForm.querySelectorAll('textarea').forEach(ta => {
            if (ta.name) {
              formData.append(ta.name, comment || ta.value || '');
              hasComment = true;
            }
          });
          if (!hasComment && comment) {
            formData.append('comment', comment);
          }

          // Submit buttons
          const submitInputs = uploadForm.querySelectorAll('input[type="submit"], button[type="submit"]');
          let hasSubmit = false;
          submitInputs.forEach(si => {
            if (si.name) {
              formData.append(si.name, si.value || 'Загрузить');
              hasSubmit = true;
            }
          });
          if (!hasSubmit) {
            formData.append('sub', 'Загрузить');
          }
        } else {
          // Fallback fields if no form found
          formData.append('name', solutionTitle);
          if (comment) formData.append('comment', comment);
          formData.append('sub', 'Загрузить');
        }

        // File input
        if (fileInp && fileInp.name) {
          formData.append(fileInp.name, uploadBlob, uploadFileName);
        } else {
          formData.append('userfile', uploadBlob, uploadFileName);
        }

        // 4. Send the POST request with 25s timeout and redirect: 'manual' (prevents Tomcat 302 HTTPS->HTTP hang)
        const ctrlPost = (typeof AbortController !== 'undefined') ? new AbortController() : null;
        const tPost = ctrlPost ? setTimeout(() => ctrlPost.abort(), 25000) : null;

        let response = null;
        try {
          response = await fetch(uploadActionUrl, {
            method: 'POST',
            body: formData,
            credentials: 'include',
            redirect: 'manual',
            signal: ctrlPost ? ctrlPost.signal : undefined
          });
        } catch (postErr) {
          if (ctrlPost && ctrlPost.signal && ctrlPost.signal.aborted) {
            throw new Error('Превышено время ожидания ответа от ЭИОС (25с). Проверьте статус в старом виде.');
          }
          console.warn('[XIAS Upload] Manual redirect POST attempt failed, trying standard fetch:', postErr);
          try {
            response = await fetch(uploadActionUrl, {
              method: 'POST',
              body: formData,
              credentials: 'include',
              signal: ctrlPost ? ctrlPost.signal : undefined
            });
          } catch (fallbackErr) {
            if (ctrlPost && ctrlPost.signal && ctrlPost.signal.aborted) {
              throw new Error('Превышено время ожидания ответа от ЭИОС (25с). Проверьте статус в старом виде.');
            }
            throw fallbackErr;
          }
        } finally {
          if (tPost) clearTimeout(tPost);
        }

        // 5. Successful submission check
        // Tomcat sends 302 Found (or 200 OK) when a solution and file are accepted
        const isSuccess = response && (
          response.ok
          || response.type === 'opaqueredirect'
          || response.status === 302
          || response.status === 200
          || response.status === 0
        );

        if (isSuccess) {
          // Success: update task status and UI
          task.status = 'REVIEW';
          task.statusLabel = 'На проверке';
          if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            const { xiasCachedAssignments } = await chrome.storage.local.get('xiasCachedAssignments');
            if (xiasCachedAssignments && course && course.name && xiasCachedAssignments[course.name]) {
              const cachedTask = xiasCachedAssignments[course.name].find(t => t.uniqueId === task.uniqueId);
              if (cachedTask) {
                cachedTask.status = 'REVIEW';
                cachedTask.statusLabel = 'На проверке';
                await chrome.storage.local.set({ xiasCachedAssignments });
              }
            }
          }

          statusMsg.className = 'xias-modal-status-msg success';
          statusMsg.innerHTML = `<span class="xias-inline-icon">${svgIcon('check', 14)}</span> Решение и файлы успешно отправлены в ЭИОС!`;
          submitBtn.innerHTML = `<span class="xias-inline-icon">${svgIcon('check', 14)}</span> Отправлено`;
          submitBtn.disabled = true;

          // Update stats counters if on dashboard
          if (this.allCourses) {
            this.updateStatsCounters(this.allCourses);
          }
          return;
        }

        // If response is NOT ok, throw error with status
        throw new Error(`Сервер ЭИОС вернул статус ${response.status} (${response.statusText || 'Ошибка'})`);
      } catch (err) {
        console.error('[XIAS Upload Error]', err);
        statusMsg.className = 'xias-modal-status-msg error';
        const fallbackUrl = (task && task.actionUrl) || courseTasksUrl || 'https://xiais.kemsu.ru/proc/stud/index.shtm';
        statusMsg.innerHTML = `Ошибка при отправке: ${escapeHtml(err.message)}.<br><a href="${escapeHtml(fallbackUrl)}" target="_blank" style="color:#b91c1c; text-decoration:underline; font-weight:600; display:inline-block; margin-top:6px;">Открыть форму в ЭИОС вручную &rarr;</a>`;
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });

    // Закрытие модального окна
    overlay.querySelector('#xias-modal-close').addEventListener('click', () => this.closeTaskModal());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.closeTaskModal();
    });

    const escHandler = (e) => {
      if (e.key === 'Escape') {
        this.closeTaskModal();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  },

  closeTaskModal() {
    const overlay = document.getElementById('xias-modal-overlay');
    if (overlay) overlay.remove();
  },

  bindEvents(courses, legacyCenter) {
    // Вкладки фильтрации
    document.querySelectorAll('.xias-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.xias-tab-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.activeTab = e.target.dataset.tab;
        window.XIASTickTick.getSyncedMap().then(syncedMap => {
          this.renderCourseCards(courses, syncedMap);
        });
      });
    });

    // Живой поиск
    const searchInput = document.getElementById('xias-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        window.XIASTickTick.getSyncedMap().then(syncedMap => {
          this.renderCourseCards(courses, syncedMap);
        });
      });
    }

    // Ручное обновление заданий всех дисциплин из ЭИОС
    const refreshCoursesBtn = document.getElementById('xias-refresh-courses-btn');
    if (refreshCoursesBtn) {
      refreshCoursesBtn.addEventListener('click', () => {
        this.syncAllCourseAssignments(courses);
      });
    }

    // Переключение на старый интерфейс
    const toggleBtn = document.getElementById('xias-toggle-legacy');
    if (toggleBtn && legacyCenter) {
      toggleBtn.addEventListener('click', () => {
        const root = document.getElementById('xias-app-root');
        if (root.style.display === 'none') {
          root.style.display = 'block';
          legacyCenter.style.display = 'none';
          toggleBtn.innerHTML = `<span class="xias-inline-icon">${svgIcon('eye', 14)}</span> Старый вид`;
        } else {
          root.style.display = 'none';
          legacyCenter.style.display = 'block';
          // Добавляем плавающую кнопку возврата
          this.injectFloatingReturnBtn();
        }
      });
    }

    // Кнопка "Открыть задания" для курса
    document.addEventListener('click', (e) => {
      const openBtn = e.target.closest('.xias-open-course-btn');
      if (openBtn) {
        const courseId = openBtn.dataset.courseId;
        const course = courses.find(c => c.id === courseId);
        if (course && course.actionElement) {
          course.actionElement.click();
        } else {
          if (course && course.rawRow) {
            const link = course.rawRow.querySelector('a, img, input');
            if (link) link.click();
          }
        }
      }
    });

    // Кнопка открытия бабла с подробной информацией о задании
    document.addEventListener('click', (e) => {
      const modalBtn = e.target.closest('.xias-task-modal-open-btn');
      if (modalBtn) {
        const courseId = modalBtn.dataset.courseId;
        const taskId = modalBtn.dataset.taskId;
        const course = courses.find(c => c.id === courseId);
        if (course) {
          const task = (course.assignments || []).find(t => t.uniqueId === taskId);
          if (task) {
            this.openTaskModal(task, course);
          }
        }
      }
    });

    // Одиночная синхронизация/удаление лабы с TickTick в формате: [Фамилия препода] Предмет: Название работы
    document.addEventListener('click', async (e) => {
      const btn = e.target.closest('.xias-single-sync-btn');
      if (btn && !btn.disabled) {
        const uniqueId = btn.dataset.taskId;
        const isAlreadySynced = btn.dataset.synced === 'true';

        // Если задача уже синхронизирована — отжимаем кнопку и удаляем задачу из TickTick
        if (isAlreadySynced) {
          const originalHtml = btn.innerHTML;
          btn.disabled = true;
          btn.innerText = 'Удаление...';

          try {
            await window.XIASTickTick.deleteTask(uniqueId);
            btn.dataset.synced = 'false';
            btn.title = 'Добавить задачу в TickTick с дедлайном';
            btn.innerHTML = `<span class="xias-inline-icon">${svgIcon('check', 12)}</span> + TickTick`;
            btn.classList.remove('xias-btn-synced', 'xias-btn-outline');
            btn.classList.add('xias-btn-ticktick');
            btn.disabled = false;
          } catch (err) {
            alert('Ошибка удаления из TickTick: ' + err.message);
            btn.disabled = false;
            btn.innerHTML = originalHtml;
          }
          return;
        }

        const originalHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerText = 'Отправка...';

        const courseName = decodeURIComponent(btn.dataset.course);
        const teacher = decodeURIComponent(btn.dataset.teacher || '');
        const title = decodeURIComponent(btn.dataset.title);
        const deadline = btn.dataset.deadline;
        const deadlineRaw = decodeURIComponent(btn.dataset.deadlineRaw || '');
        const statusLabel = decodeURIComponent(btn.dataset.statusLabel || '');
        const resultScore = decodeURIComponent(btn.dataset.resultScore || '');
        const maxScore = decodeURIComponent(btn.dataset.maxScore || '');
        const comment = decodeURIComponent(btn.dataset.comment || '');

        const teacherPrefix = teacher && teacher !== 'Преподаватель не указан' ? `[${teacher}] ` : '';

        try {
          await window.XIASTickTick.syncTask({
            uniqueId,
            title: `${teacherPrefix}${courseName}: ${title}`,
            content: `Преподаватель: ${teacher || 'Не указан'}\nПредмет: ${courseName}\nРабота: ${title}\nКрайний срок: ${deadlineRaw || 'Не указан'}\nСтатус: ${statusLabel || 'Нужно сделать'}\nБалл: ${resultScore ? resultScore + ' / ' + (maxScore || 100) : 'Еще не выставлен'}\nКомментарий: ${comment || 'Нет'}\nСсылка: ${window.location.href}`,
            dueDate: deadline || null,
            tags: ['КемГУ', 'Лаба']
          });

          btn.dataset.synced = 'true';
          btn.title = 'В TickTick (нажмите, чтобы удалить из TickTick)';
          btn.innerHTML = `<span class="xias-inline-icon">${svgIcon('check', 12)}</span> В TickTick`;
          btn.classList.remove('xias-btn-ticktick');
          btn.classList.add('xias-btn-outline', 'xias-btn-synced');
          btn.disabled = false;
        } catch (err) {
          alert('Ошибка TickTick: ' + err.message);
          btn.disabled = false;
          btn.innerHTML = originalHtml;
        }
      }
    });

    // Ручная проверка актуальности задач в TickTick
    const refreshBtn = document.getElementById('xias-refresh-ticktick');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        const originalHtml = refreshBtn.innerHTML;
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = `<span class="xias-spinner"></span> Проверка...`;

        try {
          const updatedSynced = await window.XIASTickTick.reconcileSyncedTasks();
          if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            const { xiasCachedAssignments } = await chrome.storage.local.get(['xiasCachedAssignments']);
            if (xiasCachedAssignments) {
              courses.forEach(c => {
                if (xiasCachedAssignments[c.name]) {
                  c.assignments = xiasCachedAssignments[c.name].filter(t => this.isValidTask(t));
                }
              });
              this.updateStatsCounters(courses);
            }
          }
          this.renderCourseCards(courses, updatedSynced);
          refreshBtn.innerHTML = `<span class="xias-inline-icon">${svgIcon('check', 14)}</span> Проверено`;
          setTimeout(() => {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = originalHtml;
          }, 2000);
        } catch (err) {
          alert('Ошибка проверки TickTick: ' + err.message);
          refreshBtn.disabled = false;
          refreshBtn.innerHTML = originalHtml;
        }
      });
    }

    // Массовая синхронизация с TickTick
    const syncAllBtn = document.getElementById('xias-sync-all-ticktick');
    if (syncAllBtn) {
      syncAllBtn.addEventListener('click', async () => {
        const syncedMap = await window.XIASTickTick.getSyncedMap();
        const tasksToSync = [];

        courses.forEach(c => {
          (c.assignments || []).forEach(t => {
            // Синхронизируем только те, что еще не сделаны или на проверке, и которых еще нет в TickTick
            if (!syncedMap[t.uniqueId] && t.status !== 'DONE') {
              const teacher = t.teacher || c.teacher || '';
              const teacherPrefix = teacher && teacher !== 'Преподаватель не указан' ? `[${teacher}] ` : '';
              tasksToSync.push({
                uniqueId: t.uniqueId,
                title: `${teacherPrefix}${c.name}: ${t.title}`,
                content: `Преподаватель: ${teacher || 'Не указан'}\nПредмет: ${c.name}\nРабота: ${t.title}\nКрайний срок: ${t.deadlineRaw || 'Не указан'}\nСтатус: ${t.statusLabel}\nБалл: ${t.resultScore ? t.resultScore + ' / ' + (t.maxScore || 100) : 'Еще не выставлен'}\nКомментарий: ${t.comment || 'Нет'}`,
                dueDate: t.deadlineISO || null,
                tags: ['КемГУ', 'Лаба']
              });
            }
          });
        });

        if (tasksToSync.length === 0) {
          alert('Все актуальные задания уже добавлены в TickTick!');
          return;
        }

        syncAllBtn.disabled = true;
        syncAllBtn.innerText = `Синхронизация (${tasksToSync.length})...`;

        try {
          const results = await window.XIASTickTick.syncBatch(tasksToSync);
          const successCount = results.filter(r => r.success).length;
          alert(`Успешно добавлено в TickTick: ${successCount} из ${tasksToSync.length} задач!`);
          syncAllBtn.innerHTML = `<span class="xias-inline-icon">${svgIcon('check', 14)}</span> Синхронизировано`;
          // Перерисовываем карточки
          const updatedSynced = await window.XIASTickTick.getSyncedMap();
          this.renderCourseCards(courses, updatedSynced);
        } catch (err) {
          alert('Ошибка при синхронизации: ' + err.message);
          syncAllBtn.disabled = false;
          syncAllBtn.innerHTML = `<span class="xias-inline-icon">${svgIcon('check', 14)}</span> Синхронизировать с TickTick`;
        }
      });
    }
  },

  // Улучшение страницы заданий xiais.kemsu.ru/proc/stud/course_st/tasks_st.htm
  async enhanceTasksPage(parsedData) {
    if (document.getElementById('xias-tasks-bar')) return;

    // Если courseName не определился из DOM, пробуем восстановить из сохраненного списка курсов
    if (!parsedData.courseName && typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      try {
        const { xiasCachedCourses } = await chrome.storage.local.get(['xiasCachedCourses']);
        if (Array.isArray(xiasCachedCourses)) {
          const curHref = (typeof window !== 'undefined' && window.location) ? window.location.href : '';
          const matched = xiasCachedCourses.find(c => c.tasksUrl && (curHref.includes(c.tasksUrl) || (c.tasksUrl.includes('?') && curHref.includes(c.tasksUrl.split('?')[1]))));
          if (matched) {
            parsedData.courseName = matched.name;
            if (!parsedData.teacher) parsedData.teacher = matched.teacher;
          }
        }
      } catch (e) {}
    }

    const effectiveCourseName = parsedData.courseName || 'Текущая дисциплина';

    // Сохраняем спарсенные задания в кэш курса
    if (parsedData.assignments && parsedData.assignments.length > 0) {
      this.saveCourseAssignments(effectiveCourseName, parsedData.assignments);
    }

    // Создаем стильную плавающую верхнюю панель
    const bar = document.createElement('div');
    bar.id = 'xias-tasks-bar';
    bar.style.cssText = `
      position: sticky;
      top: 0;
      z-index: 10000;
      background: #1e293b;
      color: #fff;
      padding: 12px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    bar.innerHTML = `
      <div style="display:flex; align-items:center; gap:12px;">
        <a href="https://xiais.kemsu.ru/proc/stud/index.shtm" style="background:#4f46e5; color:#fff; text-decoration:none; padding:6px 12px; border-radius:6px; font-size:13px; font-weight:600;">
          ← В XIAS Дашборд
        </a>
        <span style="font-weight:700; font-size:15px;">${escapeHtml(effectiveCourseName)}</span>
        <span style="font-size:12px; background:#10b981; color:#fff; padding:2px 8px; border-radius:12px; font-weight:600;">
          Синхронизировано: ${parsedData.assignments.length}
        </span>
      </div>

      <div style="display:flex; align-items:center; gap:10px;">
        <button id="xias-course-sync-ticktick" style="background:#605DEC; color:#fff; border:none; padding:6px 14px; border-radius:6px; font-size:13px; font-weight:600; cursor:pointer;">
          + Отправить все лабы в TickTick
        </button>
      </div>
    `;

    document.body.prepend(bar);

    // Добавляем кнопки "+ В TickTick" прямо в строки старой таблицы
    window.XIASTickTick.getSyncedMap().then(syncedMap => {
      parsedData.assignments.forEach(task => {
        if (task.rawRow && !task.rawRow.querySelector('.xias-inline-ticktick-btn')) {
          const cells = task.rawRow.cells || task.rawRow.querySelectorAll('td, th');
          const actionCell = cells && cells.length > 0 ? cells[cells.length - 1] : null;
          if (actionCell) {
            const isSynced = !!syncedMap[task.uniqueId];
            const btn = document.createElement('button');
            btn.className = `xias-inline-ticktick-btn ${isSynced ? 'synced' : ''}`;
            btn.innerHTML = isSynced ? `<span class="xias-inline-icon">${svgIcon('check', 11)}</span> TickTick` : '+ TickTick';
            btn.title = isSynced ? 'Нажмите, чтобы удалить из TickTick' : 'Добавить задачу в TickTick с дедлайном';
            btn.onclick = async (e) => {
              e.preventDefault();
              e.stopPropagation();

              // Если уже в TickTick — отжимаем кнопку и удаляем задачу из TickTick
              if (btn.classList.contains('synced')) {
                btn.disabled = true;
                btn.innerText = '...';
                try {
                  await window.XIASTickTick.deleteTask(task.uniqueId);
                  btn.classList.remove('synced');
                  btn.innerHTML = '+ TickTick';
                  btn.title = 'Добавить задачу в TickTick с дедлайном';
                  btn.disabled = false;
                } catch (err) {
                  alert('Ошибка удаления из TickTick: ' + err.message);
                  btn.disabled = false;
                  btn.innerHTML = `<span class="xias-inline-icon">${svgIcon('check', 11)}</span> TickTick`;
                  btn.title = 'Нажмите, чтобы удалить из TickTick';
                }
                return;
              }

              // Если еще не в TickTick — добавляем
              btn.disabled = true;
              btn.innerText = '...';
              const teacherPrefix = task.teacher ? `[${task.teacher}] ` : '';
              try {
                await window.XIASTickTick.syncTask({
                  uniqueId: task.uniqueId,
                  title: `${teacherPrefix}${parsedData.courseName}: ${task.title}`,
                  content: `Преподаватель: ${task.teacher || 'Не указан'}\nПредмет: ${parsedData.courseName}\nРабота: ${task.title}\nКрайний срок: ${task.deadlineRaw || 'Не указан'}\nСтатус: ${task.statusLabel}\nКомментарий: ${task.comment || 'Нет'}`,
                  dueDate: task.deadlineISO || null,
                  tags: ['КемГУ', 'Лаба']
                });
                btn.innerHTML = `<span class="xias-inline-icon">${svgIcon('check', 11)}</span> TickTick`;
                btn.classList.add('synced');
                btn.title = 'Нажмите, чтобы удалить из TickTick';
                btn.disabled = false;
              } catch (err) {
                alert('Ошибка TickTick: ' + err.message);
                btn.innerText = '+ TickTick';
                btn.disabled = false;
              }
            };
            actionCell.appendChild(btn);
          }
        }
      });
    });

    // Фоновая сверка с TickTick для актуализации состояния кнопок
    if (window.XIASTickTick && typeof window.XIASTickTick.reconcileSyncedTasks === 'function') {
      window.XIASTickTick.reconcileSyncedTasks().then(updatedMap => {
        if (!updatedMap) return;
        parsedData.assignments.forEach(task => {
          if (task.rawRow) {
            const btn = task.rawRow.querySelector('.xias-inline-ticktick-btn');
            if (btn) {
              const isSynced = !!updatedMap[task.uniqueId];
              if (isSynced) {
                btn.classList.add('synced');
                btn.innerHTML = `<span class="xias-inline-icon">${svgIcon('check', 11)}</span> TickTick`;
                btn.title = 'Нажмите, чтобы удалить из TickTick';
              } else {
                btn.classList.remove('synced');
                btn.innerHTML = '+ TickTick';
                btn.title = 'Добавить задачу в TickTick с дедлайном';
              }
            }
          }
        });
      }).catch(err => {
        console.warn('[XIAS] Tasks page reconcile error:', err);
      });
    }

    // Обработчик верхней кнопки синхронизации предмета
    const syncCourseBtn = document.getElementById('xias-course-sync-ticktick');
    if (syncCourseBtn) {
      syncCourseBtn.onclick = async () => {
        syncCourseBtn.disabled = true;
        syncCourseBtn.innerText = 'Синхронизация...';

        const syncedMap = await window.XIASTickTick.getSyncedMap();
        const toSync = parsedData.assignments
          .filter(t => !syncedMap[t.uniqueId] && t.status !== 'DONE')
          .map(t => {
            const teacherPrefix = t.teacher ? `[${t.teacher}] ` : '';
            return {
              uniqueId: t.uniqueId,
              title: `${teacherPrefix}${parsedData.courseName}: ${t.title}`,
              content: `Преподаватель: ${t.teacher || 'Не указан'}\nПредмет: ${parsedData.courseName}\nРабота: ${t.title}\nКрайний срок: ${t.deadlineRaw || 'Не указан'}\nСтатус: ${t.statusLabel}\nКомментарий: ${t.comment || 'Нет'}`,
              dueDate: t.deadlineISO || null,
              tags: ['КемГУ', 'Лаба']
            };
          });

        if (toSync.length === 0) {
          alert('Все не сданные задания этого предмета уже в TickTick!');
          syncCourseBtn.innerHTML = `<span class="xias-inline-icon">${svgIcon('check', 14)}</span> Все в TickTick`;
          return;
        }

        try {
          await window.XIASTickTick.syncBatch(toSync);
          alert(`Добавлено ${toSync.length} заданий в TickTick!`);
          syncCourseBtn.innerHTML = `<span class="xias-inline-icon">${svgIcon('check', 14)}</span> Синхронизировано`;
          location.reload();
        } catch (err) {
          alert('Ошибка: ' + err.message);
          syncCourseBtn.disabled = false;
          syncCourseBtn.innerText = '+ Отправить все лабы в TickTick';
        }
      };
    }
  },

  // Сохранение заданий курса в локальное хранилище
  async saveCourseAssignments(courseName, assignments) {
    const map = await this.getCachedAssignments();
    map[courseName] = assignments.filter(a => this.isValidTask(a)).map(a => ({
      uniqueId: a.uniqueId,
      title: a.title,
      teacher: a.teacher || '',
      category: a.category || '',
      comment: a.comment || '',
      deadlineRaw: a.deadlineRaw || '',
      deadlineISO: a.deadlineISO || '',
      maxScore: a.maxScore || '',
      resultScore: a.resultScore || '',
      status: a.status || 'TODO',
      statusLabel: a.statusLabel || 'Нужно сделать',
      actionUrl: a.actionUrl || '',
      attachments: a.attachments || []
    }));
    chrome.storage.local.set({ xiasCachedAssignments: map });
    this.syncToLocalMcpServer();
  },

  async getCachedAssignments() {
    return new Promise(resolve => {
      chrome.storage.local.get(['xiasCachedAssignments'], res => {
        resolve(res.xiasCachedAssignments || {});
      });
    });
  },

  // Автоматическая фоновая отправка данных в локальный MCP-сервер КемГУ
  async syncToLocalMcpServer() {
    try {
      if (typeof window !== 'undefined' && window.__XIAS_TEST__) return;
      if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) return;
      const data = await new Promise(res => {
        chrome.storage.local.get(['xiasCachedAssignments', 'xiasCachedCourses', 'xiasStudentInfo'], res);
      });
      const studentInfo = (data && data.xiasStudentInfo) || (window.XIASParser && window.XIASParser.parseStudentInfo ? window.XIASParser.parseStudentInfo(document) : null);
      const courses = (data && data.xiasCachedCourses) || (this.allCourses ? this.allCourses.map(c => ({ name: c.name, teacher: c.teacher, tasksUrl: c.tasksUrl })) : []);
      const assignments = (data && data.xiasCachedAssignments) || {};
      const cookies = (typeof document !== 'undefined' && document.cookie) ? document.cookie : '';

      if (typeof fetch === 'function') {
        fetch('http://127.0.0.1:38421/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentInfo,
            courses,
            assignments,
            cookies,
            timestamp: Date.now()
          })
        }).then(r => r.json()).then(res => {
          console.log('[XIAS MCP Sync] Data mirrored to local MCP server:', res);
        }).catch(() => {
          // MCP server is optional/offline, perfectly normal
        });
      }
    } catch (e) {
      // Ignore
    }
  },

  injectFloatingReturnBtn() {
    if (document.getElementById('xias-floating-return')) return;
    const btn = document.createElement('button');
    btn.id = 'xias-floating-return';
    btn.innerHTML = `<span class="xias-inline-icon" style="margin-right:8px;">${svgIcon('layout', 16)}</span> Вернуть XIAS Modern UI`;
    btn.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #4f46e5;
      color: #fff;
      border: none;
      padding: 12px 20px;
      border-radius: 50px;
      font-weight: 700;
      box-shadow: 0 4px 15px rgba(79, 70, 229, 0.4);
      cursor: pointer;
      z-index: 999999;
      display: inline-flex;
      align-items: center;
    `;
    btn.onclick = () => {
      const root = document.getElementById('xias-app-root');
      const legacyCenter = document.querySelector('center');
      if (root) root.style.display = 'block';
      if (legacyCenter) legacyCenter.style.display = 'none';
      btn.remove();
    };
    document.body.appendChild(btn);
  }
};
