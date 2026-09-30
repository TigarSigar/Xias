// XIAS Background Service Worker (Manifest V3)
// Enhanced Keep-Alive & Active Tab Tracking Strategy

const ALARM_NAME = 'xiaisKeepAlivePing';
const LEGACY_ALARM_NAME = 'xiasKeepAlivePing';
const KEEP_ALIVE_PERIOD_MINUTES = 5;
const TICKTICK_API_BASE = 'https://api.ticktick.com/open/v1';

// Primary endpoints for dual origin keep-alive
const KEEPALIVE_TARGETS = {
  xiais: 'https://xiais.kemsu.ru/proc/stud/index.shtm',
  eios: 'https://eios.kemsu.ru/'
};

/**
 * Validates whether a given URL belongs to KemSU domains or local test origins
 * @param {string} url
 * @returns {boolean}
 */
function isKemSuUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    return (
      host === 'kemsu.ru' ||
      host.endsWith('.kemsu.ru') ||
      host === 'localhost' ||
      host === '127.0.0.1'
    );
  } catch {
    return false;
  }
}

/**
 * Persists the active KemSU tab URL and origin in chrome.storage.local
 * @param {string} rawUrl
 */
async function recordActiveKemSuUrl(rawUrl) {
  if (!isKemSuUrl(rawUrl)) return;
  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.toLowerCase();
    const nowIso = new Date().toISOString();

    const updates = {
      lastActiveKemSuUrl: rawUrl,
      lastActiveKemSuHost: host,
      lastActiveKemSuTime: Date.now(),
      lastActiveKemSuTimeIso: nowIso
    };

    // Subdomain-specific storage for targeted keepalive
    if (host.includes('eios.kemsu.ru')) {
      updates.lastEiosUrl = rawUrl;
    } else if (host.includes('xiais.kemsu.ru')) {
      updates.lastXiaisUrl = rawUrl;
    }

    await chrome.storage.local.set(updates);
    console.log(`[${nowIso}] [XIAS Tab Tracker] Updated active KemSU tab: ${rawUrl}`);
  } catch (err) {
    console.warn(`[${new Date().toISOString()}] [XIAS Tab Tracker] Failed to record tab URL:`, err?.message || err);
  }
}

/**
 * Initializes or refreshes the alarms-based keepalive timer
 */
function setupAlarm() {
  try {
    if (!chrome.alarms) return;

    for (const name of [ALARM_NAME, LEGACY_ALARM_NAME]) {
      chrome.alarms.get(name, (alarm) => {
        if (!alarm) {
          chrome.alarms.create(name, { periodInMinutes: KEEP_ALIVE_PERIOD_MINUTES });
          console.log(`[${new Date().toISOString()}] [XIAS Background] Created keepalive alarm '${name}' (every ${KEEP_ALIVE_PERIOD_MINUTES} min)`);
        }
      });
    }
  } catch (err) {
    console.warn(`[${new Date().toISOString()}] [XIAS Background] setupAlarm error:`, err?.message || err);
  }
}

/**
 * Sends a single keep-alive GET request to a specified origin with credentials
 * @param {string} url - Target URL to ping
 * @param {string} label - Origin label for logging
 * @returns {Promise<{ok: boolean, status: number|null, url: string, error?: string}>}
 */
async function pingOrigin(url, label) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [XIAS Keep-Alive] Pinging ${label}: ${url}`);

  try {
    let signal;
    if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
      signal = AbortSignal.timeout(10000); // 10s request timeout
    }

    const res = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      cache: 'no-store',
      signal
    });

    const completionTime = new Date().toISOString();
    console.log(`[${completionTime}] [XIAS Keep-Alive] ${label} response status: ${res.status}`);
    return { ok: res.ok, status: res.status, url };
  } catch (err) {
    const completionTime = new Date().toISOString();
    const errorMsg = err?.message || String(err);
    console.warn(`[${completionTime}] [XIAS Keep-Alive] ${label} ping failed: ${errorMsg}`);
    return { ok: false, status: null, url, error: errorMsg };
  }
}

/**
 * Executes the dual origin keep-alive ping cycle:
 * 1. Apache Tomcat legacy portal (xiais.kemsu.ru) -> maintains Tomcat session & JSESSIONID
 * 2. React SSO portal (eios.kemsu.ru) -> maintains React SSO session
 */
async function runKeepAlivePing() {
  const now = new Date().toISOString();

  // Offline tolerance: bypass network attempt if navigator indicates offline
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    console.log(`[${now}] [XIAS Keep-Alive] Network is offline, skipping ping cycle`);
    return { skipped: true, reason: 'offline', timestamp: now };
  }

  let settings;
  try {
    settings = await chrome.storage.local.get([
      'keepAliveEnabled',
      'lastActiveKemSuUrl',
      'lastEiosUrl',
      'lastXiaisUrl'
    ]);
  } catch (err) {
    console.warn(`[${now}] [XIAS Keep-Alive] Could not read settings:`, err?.message || err);
    settings = {};
  }

  if (settings.keepAliveEnabled === false) {
    console.log(`[${now}] [XIAS Keep-Alive] Keep-alive is disabled in settings`);
    return { skipped: true, reason: 'disabled', timestamp: now };
  }

  // Dual origin target selection: prefer last active URL if on matching origin, else fallback to standard index
  const xiaisTarget = (settings.lastXiaisUrl && isKemSuUrl(settings.lastXiaisUrl) && settings.lastXiaisUrl.includes('xiais.kemsu.ru'))
    ? settings.lastXiaisUrl
    : KEEPALIVE_TARGETS.xiais;

  const eiosTarget = (settings.lastEiosUrl && isKemSuUrl(settings.lastEiosUrl) && settings.lastEiosUrl.includes('eios.kemsu.ru'))
    ? settings.lastEiosUrl
    : KEEPALIVE_TARGETS.eios;

  console.log(`[${now}] [XIAS Keep-Alive] Running dual origin ping cycle...`);

  // Parallel dual origin pings via Promise.allSettled for complete failure isolation
  const [xiaisSettled, eiosSettled] = await Promise.allSettled([
    pingOrigin(xiaisTarget, 'Tomcat/XIAIS'),
    pingOrigin(eiosTarget, 'React SSO/EIOS')
  ]);

  const xiaisResult = xiaisSettled.status === 'fulfilled' ? xiaisSettled.value : { ok: false, error: xiaisSettled.reason };
  const eiosResult = eiosSettled.status === 'fulfilled' ? eiosSettled.value : { ok: false, error: eiosSettled.reason };

  const summary = {
    timestamp: new Date().toISOString(),
    xiais: xiaisResult,
    eios: eiosResult,
    success: xiaisResult.ok || eiosResult.ok
  };

  try {
    await chrome.storage.local.set({ lastKeepAlivePing: summary });
  } catch (err) {
    // Non-fatal storage error
  }

  return summary;
}

// Lifecycle registration
if (chrome.runtime?.onInstalled) {
  chrome.runtime.onInstalled.addListener(() => {
    setupAlarm();
    chrome.storage.local.get(['keepAliveEnabled'], (res) => {
      if (res.keepAliveEnabled === undefined) {
        chrome.storage.local.set({
          keepAliveEnabled: true,
          autoLoginEnabled: true,
          tickTickProjectName: 'КемГУ / Учёба'
        });
      }
    });
  });
}

if (chrome.runtime?.onStartup) {
  chrome.runtime.onStartup.addListener(() => {
    setupAlarm();
  });
}

// Immediate idempotent setup check on worker spin-up
setupAlarm();

// Alarms listener
if (chrome.alarms?.onAlarm) {
  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === ALARM_NAME || alarm.name === LEGACY_ALARM_NAME) {
      await runKeepAlivePing();
    }
  });
}

// Active Tab Tracking Listeners
if (chrome.tabs?.onActivated) {
  chrome.tabs.onActivated.addListener(async (activeInfo) => {
    try {
      const tab = await chrome.tabs.get(activeInfo.tabId);
      if (tab?.url && isKemSuUrl(tab.url)) {
        await recordActiveKemSuUrl(tab.url);
      }
    } catch (err) {
      // Tab closed or not accessible
    }
  });
}

if (chrome.tabs?.onUpdated) {
  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    const url = changeInfo?.url || tab?.url;
    if (url && isKemSuUrl(url) && (tab?.active || changeInfo?.status === 'complete')) {
      await recordActiveKemSuUrl(url);
    }
  });
}

// Обработка сообщений от content-скрипта и popup
if (chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (!request || !request.action) return;
    if (request.action === 'SAVE_EIOS_URL' || request.action === 'SAVE_KEMSU_URL') {
      const url = request.url || sender?.tab?.url;
      (async () => {
        if (url && isKemSuUrl(url)) {
          await recordActiveKemSuUrl(url);
        }
        sendResponse({ ok: true });
      })();
      return true;
    }

    if (request.action === 'TRIGGER_KEEPALIVE') {
      runKeepAlivePing()
        .then((summary) => sendResponse({ success: true, summary }))
        .catch((err) => sendResponse({ success: false, error: err?.message || String(err) }));
      return true;
    }

    if (request.action === 'TEST_TICKTICK') {
      testTickTickToken(request.token)
        .then((user) => sendResponse({ success: true, user }))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;
    }

    if (request.action === 'SYNC_TICKTICK_TASK') {
      createTickTickTask(request.task, request.token, request.projectName)
        .then((res) => sendResponse({ success: true, data: res }))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;
    }

    if (request.action === 'BATCH_SYNC_TICKTICK') {
      batchSyncTickTickTasks(request.tasks, request.token, request.projectName)
        .then((results) => sendResponse({ success: true, results }))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;
    }

    if (request.action === 'RECONCILE_TICKTICK_TASKS') {
      reconcileTickTickTasks(request.token, request.projectName)
        .then((res) => sendResponse({ success: true, data: res }))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;
    }

    if (request.action === 'DELETE_TICKTICK_TASK') {
      deleteTickTickTask(request.taskId, request.projectId, request.token, request.projectName)
        .then((res) => sendResponse({ success: true, data: res }))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;
    }
  });
}

// Проверка токена TickTick
async function testTickTickToken(token) {
  if (!token) throw new Error('Токен TickTick не указан');

  const res = await fetch(`${TICKTICK_API_BASE}/project`, {
    headers: {
      'Authorization': `Bearer ${token.trim()}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ошибка авторизации TickTick (${res.status}): ${text || 'Неверный токен'}`);
  }

  const projects = await res.json();
  return { username: 'TickTick User', projectsCount: Array.isArray(projects) ? projects.length : 0 };
}

// Получение или создание проекта в TickTick
async function getOrCreateProjectId(token, projectName = 'КемГУ / Учёба') {
  const headers = {
    'Authorization': `Bearer ${token.trim()}`,
    'Content-Type': 'application/json'
  };

  // Получаем список проектов
  const res = await fetch(`${TICKTICK_API_BASE}/project`, { headers });
  if (!res.ok) {
    throw new Error(`Не удалось получить список проектов TickTick: ${res.status}`);
  }

  const projects = await res.json();
  const existing = projects.find(p => p.name.toLowerCase() === projectName.toLowerCase());
  if (existing) {
    return existing.id;
  }

  // Создаем проект, если не найден
  const createRes = await fetch(`${TICKTICK_API_BASE}/project`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: projectName,
      color: '#4f46e5'
    })
  });

  if (!createRes.ok) {
    // Если не удалось создать проект, задачи можно создавать в дефолтный список (без projectId)
    console.warn('[TickTick] Could not create project, falling back to Inbox');
    return null;
  }

  const newProject = await createRes.json();
  return newProject.id;
}

// Создание одной задачи
async function createTickTickTask(taskData, token, projectName) {
  if (!token) throw new Error('Токен TickTick не настроен');

  let projectId = null;
  try {
    projectId = await getOrCreateProjectId(token, projectName);
  } catch (e) {
    console.warn('[TickTick] Project resolve error:', e);
  }

  const payload = {
    title: taskData.title,
    content: taskData.content || '',
    desc: taskData.desc || '',
    priority: taskData.priority || 0,
    tags: taskData.tags || ['КемГУ', 'Лаба']
  };

  if (projectId) {
    payload.projectId = projectId;
  }

  // Дедлайн
  if (taskData.dueDate) {
    payload.dueDate = taskData.dueDate; // формат ISO: 2026-10-15T23:59:59+07:00
  }

  const res = await fetch(`${TICKTICK_API_BASE}/task`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token.trim()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Ошибка создания задачи (${res.status}): ${errorText}`);
  }

  return await res.json();
}

// Пакетная синхронизация
async function batchSyncTickTickTasks(tasks, token, projectName) {
  const results = [];
  for (const t of tasks) {
    try {
      const res = await createTickTickTask(t, token, projectName);
      results.push({ id: t.uniqueId, success: true, tickTaskId: res.id, projectId: res.projectId });
    } catch (err) {
      results.push({ id: t.uniqueId, success: false, error: err.message });
    }
  }
  return results;
}

// Удаление задачи из TickTick
async function deleteTickTickTask(taskId, projectId, token, projectName = 'КемГУ / Учёба') {
  if (!token) throw new Error('Токен TickTick не настроен');
  if (!taskId) throw new Error('ID задачи TickTick не передан');

  let resolvedProjectId = projectId;
  if (!resolvedProjectId) {
    try {
      resolvedProjectId = await getOrCreateProjectId(token, projectName);
    } catch (e) {
      console.warn('[TickTick] Could not resolve project for deletion:', e);
    }
  }

  if (!resolvedProjectId) {
    throw new Error('Не удалось определить проект TickTick для удаления задачи');
  }

  const res = await fetch(`${TICKTICK_API_BASE}/project/${resolvedProjectId}/task/${taskId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token.trim()}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok && res.status !== 404) {
    const errorText = await res.text();
    throw new Error(`Ошибка удаления задачи (${res.status}): ${errorText}`);
  }

  return { success: true, taskId, projectId: resolvedProjectId };
}

// Проверка и синхронизация актуального состояния задач в TickTick (удаление устаревших и обработка выполненных)
async function reconcileTickTickTasks(token, projectName = 'КемГУ / Учёба') {
  if (!token) throw new Error('Токен TickTick не настроен');

  let projectId = null;
  try {
    projectId = await getOrCreateProjectId(token, projectName);
  } catch (e) {
    console.warn('[TickTick] Could not resolve project for reconciliation:', e);
    const storage = await chrome.storage.local.get(['xiasSyncedTasks']);
    return { prunedCount: 0, syncedTasks: storage.xiasSyncedTasks || {}, remoteCount: 0 };
  }

  if (!projectId) {
    const storage = await chrome.storage.local.get(['xiasSyncedTasks']);
    return { prunedCount: 0, syncedTasks: storage.xiasSyncedTasks || {}, remoteCount: 0 };
  }

  // Получаем актуальный список задач в проекте
  const res = await fetch(`${TICKTICK_API_BASE}/project/${projectId}/data`, {
    headers: {
      'Authorization': `Bearer ${token.trim()}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    throw new Error(`Ошибка получения данных проекта TickTick (${res.status})`);
  }

  const projectData = await res.json();
  const remoteTasks = Array.isArray(projectData.tasks) ? projectData.tasks : [];

  // Завершенные задачи (с галочкой в TickTick: status === 2 или completedTime)
  const completedTasks = remoteTasks.filter(t => t.status === 2 || t.completedTime);
  const completedTickIds = new Set(completedTasks.map(t => t.id).filter(Boolean));
  const completedTitles = new Set(completedTasks.map(t => (t.title || '').trim().toLowerCase()).filter(Boolean));

  // Активные невыполненные задачи (status !== 2)
  const activeTasks = remoteTasks.filter(t => t.status !== 2 && !t.completedTime);
  const activeTickIds = new Set(activeTasks.map(t => t.id).filter(Boolean));
  const activeTitles = new Set(activeTasks.map(t => (t.title || '').trim().toLowerCase()).filter(Boolean));

  // Получаем текущие сохраненные задачи и кэш заданий ЭИОС
  const storage = await chrome.storage.local.get(['xiasSyncedTasks', 'xiasCachedAssignments']);
  const currentSynced = storage.xiasSyncedTasks || {};
  let prunedCount = 0;
  const updatedSynced = { ...currentSynced };
  const completedUniqueIds = [];

  for (const [uniqueId, syncInfo] of Object.entries(currentSynced)) {
    const tickId = syncInfo && syncInfo.tickTaskId;
    const title = (syncInfo && syncInfo.title || '').trim().toLowerCase();

    let isCompleted = false;
    if (tickId && typeof tickId === 'string' && tickId !== 'true') {
      isCompleted = completedTickIds.has(tickId);
    } else if (title) {
      isCompleted = completedTitles.has(title);
    }

    let isStillActive = false;
    if (tickId && typeof tickId === 'string' && tickId !== 'true') {
      isStillActive = activeTickIds.has(tickId);
    } else if (title) {
      isStillActive = activeTitles.has(title);
    }

    // Если задача отмечена галочкой или удалена из TickTick — снимаем отметку синхронизации
    if (isCompleted || !isStillActive) {
      delete updatedSynced[uniqueId];
      prunedCount++;
      if (isCompleted) {
        completedUniqueIds.push(uniqueId);
      }
    }
  }

  if (prunedCount > 0) {
    await chrome.storage.local.set({ xiasSyncedTasks: updatedSynced });
    console.log(`[TickTick Reconcile] Pruned ${prunedCount} deleted or completed task(s) from local cache.`);
  }

  // Если задача была выполнена (поставили галочку в TickTick) — отмечаем её выполненной в дэшборде ЭИОС
  if (completedUniqueIds.length > 0 && storage.xiasCachedAssignments) {
    let cacheChanged = false;
    const cachedMap = storage.xiasCachedAssignments;
    for (const courseName of Object.keys(cachedMap)) {
      const list = cachedMap[courseName] || [];
      list.forEach(item => {
        if (completedUniqueIds.includes(item.uniqueId) && item.status !== 'DONE') {
          item.status = 'DONE';
          item.statusLabel = 'Выполнено в TickTick';
          cacheChanged = true;
        }
      });
    }
    if (cacheChanged) {
      await chrome.storage.local.set({ xiasCachedAssignments: cachedMap });
    }
  }

  return {
    success: true,
    prunedCount,
    syncedTasks: updatedSynced,
    remoteCount: remoteTasks.length,
    completedCount: completedUniqueIds.length
  };
}

// Export helper functions for Node.js test harness
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ALARM_NAME,
    LEGACY_ALARM_NAME,
    KEEP_ALIVE_PERIOD_MINUTES,
    KEEPALIVE_TARGETS,
    isKemSuUrl,
    recordActiveKemSuUrl,
    setupAlarm,
    pingOrigin,
    runKeepAlivePing,
    testTickTickToken,
    getOrCreateProjectId,
    createTickTickTask,
    deleteTickTickTask,
    batchSyncTickTickTasks,
    reconcileTickTickTasks
  };
}
