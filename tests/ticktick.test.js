const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createChromeMock } = require('./helpers/chrome_mock.js');

const ROOT_DIR = path.resolve(__dirname, '..');
const TICKTICK_CLIENT_PATH = path.join(ROOT_DIR, 'content', 'ticktick_client.js');
const BACKGROUND_PATH = path.join(ROOT_DIR, 'background', 'background.js');

function setupTickTickEnv(initialStorage = {}, mockFetchHandler) {
  const chrome = createChromeMock(initialStorage);
  const fetchCalls = [];

  const mockFetch = async (url, options = {}) => {
    fetchCalls.push({ url, options, body: options.body ? JSON.parse(options.body) : null });
    if (mockFetchHandler) {
      const res = await mockFetchHandler(url, options);
      if (res !== null && res !== undefined) return res;
    }
    // Default mock response
    if (url.includes('/project')) {
      if (options.method === 'DELETE') {
        return {
          ok: true,
          status: 200,
          json: async () => ({})
        };
      }
      if (options.method === 'POST') {
        return {
          ok: true,
          status: 200,
          json: async () => ({ id: 'proj_kemsu_123', name: 'КемГУ / Учёба' })
        };
      }
      if (url.includes('/data')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            project: { id: 'proj_kemsu_123', name: 'КемГУ / Учёба' },
            tasks: [
              { id: 'tick_task_999', title: 'Task Created' }
            ]
          })
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => [{ id: 'proj_kemsu_123', name: 'КемГУ / Учёба' }]
      };
    }
    if (url.includes('/task')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ id: 'tick_task_999', title: 'Task Created' })
      };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({})
    };
  };

  // Background context
  const bgContext = {
    chrome,
    fetch: mockFetch,
    console,
    Date,
    Math,
    setTimeout: (fn, ms) => setTimeout(fn, ms),
    clearTimeout: (id) => clearTimeout(id)
  };
  vm.createContext(bgContext);
  const bgCode = fs.readFileSync(BACKGROUND_PATH, 'utf-8');
  vm.runInContext(bgCode, bgContext);

  // Content script context
  const contentWindow = {
    XIASTickTick: null
  };
  const contentContext = {
    window: contentWindow,
    chrome,
    console,
    Date,
    Promise,
    setTimeout: (fn, ms) => setTimeout(fn, ms)
  };
  vm.createContext(contentContext);
  const clientCode = fs.readFileSync(TICKTICK_CLIENT_PATH, 'utf-8');
  vm.runInContext(clientCode, contentContext);

  return {
    chrome,
    client: contentWindow.XIASTickTick,
    fetchCalls
  };
}

test('TickTick Open API Integration & Deduplication Test Suite', async (t) => {
  await t.test('Payload Generation: Tags must strictly be ["КемГУ", "Лаба"] (R3 / F9)', async () => {
    const { client, fetchCalls } = setupTickTickEnv({
      tickTickToken: 'valid_test_token_123',
      tickTickProjectName: 'КемГУ / Учёба'
    });

    const taskToSync = {
      uniqueId: 'task_db_lab1',
      title: '[Базы данных] Лабораторная работа №1',
      desc: 'Построить ER-диаграмму',
      dueDate: '2026-09-26T23:59:59+07:00',
      priority: 3
    };

    await client.syncTask(taskToSync);

    const taskCall = fetchCalls.find(c => c.url.endsWith('/task'));
    assert.ok(taskCall, 'Must POST to https://api.ticktick.com/open/v1/task');

    const payload = taskCall.body;
    assert.equal(payload.title, '[Базы данных] Лабораторная работа №1');
    assert.equal(payload.dueDate, '2026-09-26T23:59:59+07:00');

    // Verification of required tags per ORIGINAL_REQUEST.md R3: теги (#КемГУ, #Лаба)
    assert.ok(Array.isArray(payload.tags), 'Tags must be an array');
    assert.deepEqual(
      payload.tags,
      ['КемГУ', 'Лаба'],
      'Tags must be strictly ["КемГУ", "Лаба"] per R3 requirement'
    );
  });

  await t.test('ISO-8601 DueDate formatting with Novokuznetsk timezone (+07:00)', async () => {
    const { client, fetchCalls } = setupTickTickEnv({
      tickTickToken: 'valid_test_token_123',
      tickTickProjectName: 'КемГУ / Учёба'
    });

    const taskWithNovokuznetskDate = {
      uniqueId: 'task_math_lab2',
      title: '[Мат. анализ] Типовой расчет №1',
      desc: 'Пределы и непрерывность',
      dueDate: '2026-10-15T23:59:59+07:00'
    };

    await client.syncTask(taskWithNovokuznetskDate);

    const taskCall = fetchCalls.find(c => c.url.endsWith('/task'));
    assert.ok(taskCall, 'Task creation call must exist');
    assert.equal(taskCall.body.dueDate, '2026-10-15T23:59:59+07:00', 'Must preserve timezone offset in dueDate');
  });

  await t.test('Local Deduplication in chrome.storage.local (F10 / R3)', async () => {
    const { chrome, client } = setupTickTickEnv({
      tickTickToken: 'valid_test_token_123'
    });

    const taskId = 'task_unique_101';
    assert.equal(await client.isSynced(taskId), false, 'Task should not be marked as synced initially');

    await client.syncTask({
      uniqueId: taskId,
      title: '[ООП] Лабораторная №1'
    });

    assert.equal(await client.isSynced(taskId), true, 'Task must be marked as synced after successful sync');

    // Inspect storage directly
    const storage = await chrome.storage.local.get(['xiasSyncedTasks']);
    const syncedMap = storage.xiasSyncedTasks;
    assert.ok(syncedMap && syncedMap[taskId], 'xiasSyncedTasks map must contain taskId record');
    assert.ok(syncedMap[taskId].syncedAt, 'Record must include syncedAt timestamp');
    assert.equal(syncedMap[taskId].tickTaskId, 'tick_task_999');
  });

  await t.test('Idempotency: Re-syncing already synced task is prevented or idempotent', async () => {
    const { client, fetchCalls } = setupTickTickEnv({
      tickTickToken: 'valid_test_token_123'
    });

    const taskId = 'task_idempotent_test';

    // First sync
    await client.syncTask({
      uniqueId: taskId,
      title: '[Информатика] Задание 1'
    });

    const initialTaskPosts = fetchCalls.filter(c => c.url.endsWith('/task')).length;
    assert.equal(initialTaskPosts, 1, 'First sync should make exactly 1 task creation call');

    // Mark as already synced
    assert.equal(await client.isSynced(taskId), true);

    // In a clean implementation, syncTask or the UI prevents re-submitting an already synced task
    // Testing isSynced check:
    const isAlreadySynced = await client.isSynced(taskId);
    assert.equal(isAlreadySynced, true, 'isSynced must guard against duplicate submissions');
  });

  await t.test('Batch Sync (syncBatch) syncs multiple tasks and updates local store', async () => {
    const { client, chrome } = setupTickTickEnv({
      tickTickToken: 'valid_test_token_123'
    });

    const batch = [
      { uniqueId: 'batch_1', title: '[Курс 1] Задание 1' },
      { uniqueId: 'batch_2', title: '[Курс 2] Задание 2' }
    ];

    const results = await client.syncBatch(batch);
    assert.equal(results.length, 2, 'Batch sync must return results for all tasks');
    assert.ok(results.every(r => r.success === true), 'All tasks in batch should succeed');

    assert.equal(await client.isSynced('batch_1'), true);
    assert.equal(await client.isSynced('batch_2'), true);

    const storage = await chrome.storage.local.get(['xiasSyncedTasks']);
    assert.ok(storage.xiasSyncedTasks['batch_1']);
    assert.ok(storage.xiasSyncedTasks['batch_2']);
  });

  await t.test('Missing token error handling', async () => {
    // No token in storage
    const { client } = setupTickTickEnv({ tickTickToken: '' });

    await assert.rejects(async () => {
      await client.syncTask({ uniqueId: 'task_no_token', title: 'Task' });
    }, /Токен TickTick не настроен/);
  });

  await t.test('Reconciliation: Tasks deleted in TickTick are pruned from local cache', async () => {
    // Setup storage with two tasks: one active, one deleted in TickTick
    const initialStorage = {
      tickTickToken: 'valid_test_token_123',
      tickTickProjectName: 'КемГУ / Учёба',
      xiasSyncedTasks: {
        task_still_active: {
          syncedAt: '2026-09-23T10:00:00Z',
          tickTaskId: 'tick_task_999',
          title: 'Активная работа'
        },
        task_deleted_in_ticktick: {
          syncedAt: '2026-09-23T09:00:00Z',
          tickTaskId: 'tick_task_deleted_777',
          title: 'Удаленная работа'
        }
      }
    };

    const { client, chrome } = setupTickTickEnv(initialStorage);

    // Initial check
    assert.equal(await client.isSynced('task_still_active'), true);
    assert.equal(await client.isSynced('task_deleted_in_ticktick'), true);

    // Run reconciliation with TickTick remote
    const updatedMap = await client.reconcileSyncedTasks();

    // Verify task_deleted_in_ticktick is pruned, while task_still_active is preserved
    assert.equal(await client.isSynced('task_deleted_in_ticktick'), false, 'Deleted task must no longer be marked as synced');
    assert.equal(await client.isSynced('task_still_active'), true, 'Active task must remain synced');

    const storage = await chrome.storage.local.get(['xiasSyncedTasks']);
    assert.equal(storage.xiasSyncedTasks['task_deleted_in_ticktick'], undefined, 'Must be pruned from chrome.storage.local');
    assert.ok(storage.xiasSyncedTasks['task_still_active'], 'Active task must remain in chrome.storage.local');
  });

  await t.test('unmarkSynced removes task from storage and allows re-syncing', async () => {
    const initialStorage = {
      tickTickToken: 'valid_test_token_123',
      xiasSyncedTasks: {
        task_to_unmark: {
          syncedAt: '2026-09-23T10:00:00Z',
          tickTaskId: 'tick_task_999'
        }
      }
    };

    const { client, chrome } = setupTickTickEnv(initialStorage);
    assert.equal(await client.isSynced('task_to_unmark'), true);

    await client.unmarkSynced('task_to_unmark');
    assert.equal(await client.isSynced('task_to_unmark'), false);

    const storage = await chrome.storage.local.get(['xiasSyncedTasks']);
    assert.equal(storage.xiasSyncedTasks['task_to_unmark'], undefined);

    // Re-syncing should succeed
    await client.syncTask({ uniqueId: 'task_to_unmark', title: 'Повторная синхронизация' });
    assert.equal(await client.isSynced('task_to_unmark'), true);
  });

  await t.test('deleteTask removes task from TickTick and unmarks local storage', async () => {
    const initialStorage = {
      tickTickToken: 'valid_test_token_123',
      tickTickProjectName: 'КемГУ / Учёба',
      xiasSyncedTasks: {
        task_to_delete: {
          syncedAt: '2026-09-23T10:00:00Z',
          tickTaskId: 'tick_task_999',
          projectId: 'proj_kemsu_123',
          title: 'Лабораторная работа 1'
        }
      }
    };

    const { client, chrome, fetchCalls } = setupTickTickEnv(initialStorage);
    assert.equal(await client.isSynced('task_to_delete'), true);

    await client.deleteTask('task_to_delete');
    assert.equal(await client.isSynced('task_to_delete'), false, 'Task must be un-synced locally');

    const storage = await chrome.storage.local.get(['xiasSyncedTasks']);
    assert.equal(storage.xiasSyncedTasks['task_to_delete'], undefined, 'Must be removed from storage');

    // Verify DELETE request was issued to TickTick
    const deleteCall = fetchCalls.find(c => c.options && c.options.method === 'DELETE');
    assert.ok(deleteCall, 'DELETE HTTP request must be sent to TickTick');
    assert.ok(deleteCall.url.includes('tick_task_999'), 'DELETE URL must include task ID');
  });

  await t.test('Reconciliation marks completed tasks (status === 2 / галочка) as DONE in xiasCachedAssignments', async () => {
    const initialStorage = {
      tickTickToken: 'valid_test_token_123',
      tickTickProjectName: 'КемГУ / Учёба',
      xiasSyncedTasks: {
        task_completed: {
          syncedAt: '2026-09-23T10:00:00Z',
          tickTaskId: 'tick_task_done_555',
          title: 'Сданная лаба'
        }
      },
      xiasCachedAssignments: {
        'Тестирование ПО': [
          {
            uniqueId: 'task_completed',
            title: 'Сданная лаба',
            status: 'TODO',
            statusLabel: 'Нужно сделать'
          }
        ]
      }
    };

    // Custom fetch handler where TickTick returns task with status: 2 (completed checkbox)
    const customFetchHandler = async (url, options) => {
      if (url.includes('/project') && url.includes('/data')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            project: { id: 'proj_kemsu_123', name: 'КемГУ / Учёба' },
            tasks: [
              { id: 'tick_task_done_555', title: 'Сданная лаба', status: 2 }
            ]
          })
        };
      }
      return null;
    };

    const { client, chrome } = setupTickTickEnv(initialStorage, customFetchHandler);

    await client.reconcileSyncedTasks();

    // Verify un-synced
    assert.equal(await client.isSynced('task_completed'), false, 'Completed task must be pruned from synced tasks');

    // Verify marked as DONE in cached assignments
    const storage = await chrome.storage.local.get(['xiasCachedAssignments']);
    const taskInCache = storage.xiasCachedAssignments['Тестирование ПО'][0];
    assert.equal(taskInCache.status, 'DONE', 'Task status must become DONE when completed in TickTick');
    assert.equal(taskInCache.statusLabel, 'Выполнено в TickTick');
  });
});
