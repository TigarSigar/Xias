// XIAS TickTick Client Helper for Content Scripts

window.XIASTickTick = {
  // Получить список уже отправленных заданий из хранилища
  async getSyncedMap() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['xiasSyncedTasks'], (res) => {
        resolve(res.xiasSyncedTasks || {});
      });
    });
  },

  // Проверить, отправлена ли уже эта задача
  async isSynced(uniqueTaskId) {
    const map = await this.getSyncedMap();
    return !!map[uniqueTaskId];
  },

  // Отметить задачу как синхронизированную
  async markSynced(uniqueTaskId, tickTaskId, title = '', projectId = '') {
    const map = await this.getSyncedMap();
    map[uniqueTaskId] = {
      syncedAt: new Date().toISOString(),
      tickTaskId: tickTaskId || true,
      title: title || '',
      projectId: projectId || ''
    };
    await new Promise((resolve) => {
      chrome.storage.local.set({ xiasSyncedTasks: map }, resolve);
    });
  },

  // Снять отметку о синхронизации с задачи
  async unmarkSynced(uniqueTaskId) {
    const map = await this.getSyncedMap();
    if (map[uniqueTaskId]) {
      delete map[uniqueTaskId];
      await new Promise((resolve) => {
        chrome.storage.local.set({ xiasSyncedTasks: map }, resolve);
      });
    }
  },

  // Получить настройки (токен, имя проекта)
  async getConfig() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['tickTickToken', 'tickTickProjectName'], (res) => {
        const rawToken = String(res.tickTickToken || '').trim();
        const cleanToken = rawToken.replace(/^["'`]|["'`]$/g, '').trim();
        resolve({
          token: cleanToken,
          projectName: res.tickTickProjectName || 'КемГУ / Учёба'
        });
      });
    });
  },

  // Отправить одну задачу в TickTick
  async syncTask(task) {
    const config = await this.getConfig();
    if (!config.token) {
      throw new Error('Токен TickTick не настроен. Откройте настройки расширения XIAS.');
    }

    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'SYNC_TICKTICK_TASK',
        task,
        token: config.token,
        projectName: config.projectName
      }, async (response) => {
        if (chrome.runtime.lastError) {
          return reject(new Error(chrome.runtime.lastError.message));
        }
        if (!response || !response.success) {
          return reject(new Error((response && response.error) || 'Неизвестная ошибка TickTick'));
        }
        await this.markSynced(task.uniqueId, response.data && response.data.id, task.title, response.data && response.data.projectId);
        resolve(response.data);
      });
    });
  },

  // Удалить задачу из TickTick и снять отметку
  async deleteTask(uniqueTaskId) {
    const map = await this.getSyncedMap();
    const syncInfo = map[uniqueTaskId];
    const config = await this.getConfig();

    // Снимаем локальную отметку синхронизации
    await this.unmarkSynced(uniqueTaskId);

    if (!config.token || !syncInfo || !syncInfo.tickTaskId || syncInfo.tickTaskId === true) {
      return { success: true, localOnly: true };
    }

    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'DELETE_TICKTICK_TASK',
        taskId: syncInfo.tickTaskId,
        projectId: syncInfo.projectId,
        token: config.token,
        projectName: config.projectName
      }, (response) => {
        if (chrome.runtime.lastError) {
          return reject(new Error(chrome.runtime.lastError.message));
        }
        if (!response || !response.success) {
          return reject(new Error((response && response.error) || 'Ошибка удаления задачи в TickTick'));
        }
        resolve(response.data);
      });
    });
  },

  // Синхронизировать пачку несинхронизированных задач
  async syncBatch(tasks) {
    const config = await this.getConfig();
    if (!config.token) {
      throw new Error('Токен TickTick не настроен. Откройте настройки расширения XIAS.');
    }

    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'BATCH_SYNC_TICKTICK',
        tasks,
        token: config.token,
        projectName: config.projectName
      }, async (response) => {
        if (chrome.runtime.lastError) {
          return reject(new Error(chrome.runtime.lastError.message));
        }
        if (!response || !response.success) {
          return reject(new Error((response && response.error) || 'Ошибка синхронизации'));
        }

        // Обновляем статусы
        const map = await this.getSyncedMap();
        for (const res of response.results) {
          if (res.success) {
            const taskObj = tasks.find(t => t.uniqueId === res.id);
            map[res.id] = {
              syncedAt: new Date().toISOString(),
              tickTaskId: res.tickTaskId || true,
              projectId: res.projectId || '',
              title: (taskObj && taskObj.title) || ''
            };
          }
        }
        await new Promise((resolve) => {
          chrome.storage.local.set({ xiasSyncedTasks: map }, resolve);
        });
        resolve(response.results);
      });
    });
  },

  // Сверить локальный кэш с реальными задачами в TickTick
  async reconcileSyncedTasks() {
    const config = await this.getConfig();
    if (!config.token) {
      return await this.getSyncedMap();
    }

    return new Promise((resolve) => {
      chrome.runtime.sendMessage({
        action: 'RECONCILE_TICKTICK_TASKS',
        token: config.token,
        projectName: config.projectName
      }, async (response) => {
        if (chrome.runtime.lastError || !response || !response.success) {
          // Если ошибка сети или токена, возвращаем локальное состояние без падения
          const fallbackMap = await this.getSyncedMap();
          return resolve(fallbackMap);
        }
        resolve(response.data && response.data.syncedTasks ? response.data.syncedTasks : await this.getSyncedMap());
      });
    });
  }
};
