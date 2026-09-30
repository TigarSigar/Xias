// Mock Chrome Extension API for XIAS MV3 tests
// Provides storage.local, alarms, runtime messaging, and life-cycle events.

function createChromeMock(initialStorage = {}) {
  const storageData = { ...initialStorage };
  const alarms = new Map();

  const installListeners = [];
  const startupListeners = [];
  const alarmListeners = [];
  const messageListeners = [];

  const chromeMock = {
    runtime: {
      lastError: null,
      onInstalled: {
        addListener(fn) {
          installListeners.push(fn);
        }
      },
      onStartup: {
        addListener(fn) {
          startupListeners.push(fn);
        }
      },
      onMessage: {
        addListener(fn) {
          messageListeners.push(fn);
        }
      },
      sendMessage(message, callback) {
        chromeMock.runtime.lastError = null;
        let responded = false;
        const sendResponse = (res) => {
          responded = true;
          if (callback) callback(res);
        };

        for (const listener of messageListeners) {
          try {
            const isAsync = listener(message, { tab: { id: 1 } }, sendResponse);
            if (isAsync === true) {
              return;
            }
          } catch (err) {
            chromeMock.runtime.lastError = { message: err.message };
            if (callback) callback({ success: false, error: err.message });
            return;
          }
        }

        if (!responded && callback) {
          callback(undefined);
        }
      }
    },

    alarms: {
      onAlarm: {
        addListener(fn) {
          alarmListeners.push(fn);
        }
      },
      get(name, callback) {
        const alarm = alarms.get(name) || null;
        if (callback) callback(alarm);
        return Promise.resolve(alarm);
      },
      create(name, options) {
        alarms.set(name, {
          name,
          periodInMinutes: options.periodInMinutes,
          scheduledTime: Date.now() + (options.periodInMinutes || 1) * 60000
        });
      },
      clear(name, callback) {
        const existed = alarms.delete(name);
        if (callback) callback(existed);
        return Promise.resolve(existed);
      },
      _triggerAlarm(name) {
        const alarm = alarms.get(name) || { name };
        for (const fn of alarmListeners) {
          fn(alarm);
        }
      }
    },

    storage: {
      local: {
        get(keys, callback) {
          let result = {};
          if (typeof keys === 'string') {
            result[keys] = storageData[keys];
          } else if (Array.isArray(keys)) {
            for (const k of keys) {
              if (storageData[k] !== undefined) {
                result[k] = storageData[k];
              }
            }
          } else if (typeof keys === 'object' && keys !== null) {
            for (const [k, defaultVal] of Object.entries(keys)) {
              result[k] = storageData[k] !== undefined ? storageData[k] : defaultVal;
            }
          } else if (!keys) {
            result = { ...storageData };
          }

          if (callback) {
            callback(result);
          }
          return Promise.resolve(result);
        },
        set(items, callback) {
          Object.assign(storageData, items);
          if (callback) {
            callback();
          }
          return Promise.resolve();
        },
        remove(keys, callback) {
          const list = Array.isArray(keys) ? keys : [keys];
          for (const k of list) {
            delete storageData[k];
          }
          if (callback) {
            callback();
          }
          return Promise.resolve();
        },
        clear(callback) {
          for (const k of Object.keys(storageData)) {
            delete storageData[k];
          }
          if (callback) {
            callback();
          }
          return Promise.resolve();
        },
        _getData() {
          return storageData;
        }
      }
    },

    // Test helper methods to simulate life-cycle triggers
    _triggerInstalled() {
      for (const fn of installListeners) fn();
    },
    _triggerStartup() {
      for (const fn of startupListeners) fn();
    },
    _getAlarms() {
      return alarms;
    }
  };

  return chromeMock;
}

module.exports = { createChromeMock };
