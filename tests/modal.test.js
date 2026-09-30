const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createDOMEnvironment, DOMEvent } = require('./helpers/dom.js');
const { createChromeMock } = require('./helpers/chrome_mock.js');

const ROOT_DIR = path.resolve(__dirname, '..');
const UI_PATH = path.join(ROOT_DIR, 'content', 'ui.js');
const ZIP_PATH = path.join(ROOT_DIR, 'content', 'zip_helper.js');

function setupUiEnv(initialStorage = {}) {
  const { window, document } = createDOMEnvironment(
    '<center>Old Content</center>',
    'https://xiais.kemsu.ru/proc/stud/index.shtm'
  );

  const chrome = createChromeMock(initialStorage);

  const context = {
    window,
    document,
    chrome,
    console,
    Date,
    Math,
    URL,
    setTimeout,
    clearTimeout,
    encodeURIComponent,
    decodeURIComponent,
    parseInt,
    fetch: (...args) => (window.fetch ? window.fetch(...args) : globalThis.fetch(...args)),
    FormData: globalThis.FormData,
    TextDecoder: globalThis.TextDecoder,
    File: globalThis.File,
    Blob: globalThis.Blob,
    DOMParser: window.DOMParser
  };

  window.fetch = globalThis.fetch;
  window.FormData = context.FormData;
  window.TextDecoder = context.TextDecoder;
  window.File = context.File;
  window.Blob = context.Blob;
  window.chrome = chrome;
  window.XIASTickTick = {
    getSyncedMap: async () => {
      const data = await chrome.storage.local.get(['xiasSyncedTasks']);
      return data.xiasSyncedTasks || {};
    },
    syncTask: async () => ({ success: true }),
    deleteTask: async () => ({ success: true }),
    reconcileSyncedTasks: async () => {
      const data = await chrome.storage.local.get(['xiasSyncedTasks']);
      return data.xiasSyncedTasks || {};
    }
  };

  vm.createContext(context);

  const zipCode = fs.readFileSync(ZIP_PATH, 'utf-8');
  vm.runInContext(zipCode, context);

  const uiCode = fs.readFileSync(UI_PATH, 'utf-8');
  vm.runInContext(uiCode, context);

  return {
    window,
    document,
    UI: window.XIASUI,
    chrome
  };
}

test('XIAS UI Modal and Task Bubble Unit Tests', async (t) => {
  await t.test('renderCourseCards formats teacher, clean title, deadline and details button', async () => {
    const { UI, document } = setupUiEnv();

    const courses = [
      {
        id: 'c1',
        name: 'Базы данных',
        teacher: 'Иванов И.И.',
        score: 45,
        assignments: [
          {
            uniqueId: 'task_1',
            title: 'Лабораторная работа 1: Проектирование схемы',
            teacher: 'Иванов И.И.',
            status: 'TODO',
            statusLabel: 'Нужно сделать',
            deadlineRaw: '28-09-2026 23:59:59',
            deadlineISO: '2026-09-28T23:59:59+07:00',
            maxScore: '50',
            resultScore: '',
            attachments: [{ name: 'Задание.pdf', url: 'https://xiais.kemsu.ru/files/task1.pdf' }]
          }
        ]
      }
    ];

    document.body.innerHTML = '<div id="xias-courses-container"></div>';
    UI.renderCourseCards(courses, {});

    const container = document.getElementById('xias-courses-container');
    assert.ok(container.innerHTML.includes('Иванов И.И.'), 'Card must show teacher name');
    assert.ok(container.innerHTML.includes('Базы данных'), 'Card must show course name');
    assert.ok(container.innerHTML.includes('Лабораторная работа 1: Проектирование схемы'), 'Card must show task title');
    assert.ok(container.innerHTML.includes('Крайний срок: <b>28-09-2026 23:59:59</b>'), 'Card must show formatted deadline');
    assert.ok(container.innerHTML.includes('Подробнее / Сдать'), 'Card must include details/submission button');
    assert.ok(container.innerHTML.includes('+ TickTick'), 'Card must include TickTick sync button');
  });

  await t.test('openTaskModal opens bubble modal with full metadata, materials and submission dropzone', async () => {
    const { UI, document } = setupUiEnv();

    const course = {
      id: 'c2',
      name: 'Архитектура ЭВМ',
      teacher: 'Петров П.П.'
    };

    const task = {
      uniqueId: 'task_2',
      title: 'Лабораторная работа №2',
      teacher: 'Петров П.П.',
      status: 'TODO',
      statusLabel: 'Нужно сделать',
      deadlineRaw: '30-09-2026 23:59:59',
      deadlineISO: '2026-09-30T23:59:59+07:00',
      maxScore: '20',
      resultScore: '',
      comment: 'Не забудьте приложить отчет и исходники',
      attachments: [
        { name: 'Методичка.pdf', url: 'https://xiais.kemsu.ru/docs/metod.pdf' }
      ],
      actionUrl: 'https://xiais.kemsu.ru/proc/stud/send_answer.htm?id=123'
    };

    UI.openTaskModal(task, course);

    const overlay = document.getElementById('xias-modal-overlay');
    assert.ok(overlay, 'Modal overlay must be added to DOM');

    const modal = document.getElementById('xias-task-modal');
    assert.ok(modal, 'Modal container must exist');

    // Title and metadata verification
    assert.ok(modal.innerHTML.includes('Лабораторная работа №2'), 'Modal must display task title');
    assert.ok(modal.innerHTML.includes('Архитектура ЭВМ'), 'Modal must display course name');
    assert.ok(modal.innerHTML.includes('Петров П.П.'), 'Modal must display teacher name');
    assert.ok(modal.innerHTML.includes('30-09-2026 23:59:59'), 'Modal must display deadline');
    assert.ok(modal.innerHTML.includes('Не забудьте приложить отчет и исходники'), 'Modal must display teacher comment');

    // Materials verification
    assert.ok(modal.innerHTML.includes('Методичка.pdf'), 'Modal must display attached methodology file');

    // Auto-ZIP notice and dropzone verification
    assert.ok(modal.innerHTML.includes('xias-modal-dropzone'), 'Modal must include dropzone');
    assert.ok(modal.innerHTML.includes('.docx'), 'Notice must explain .docx, .txt and .zip exemption');
    assert.ok(modal.innerHTML.includes('автоматически упаковываются в <b>.zip</b>'), 'Notice must mention auto-zip packaging');

    // Close button verification
    const closeBtn = modal.querySelector('#xias-modal-close');
    assert.ok(closeBtn, 'Close button must exist');
    closeBtn.click();
    assert.equal(document.getElementById('xias-modal-overlay'), null, 'Modal should close when close button is clicked');
  });

  await t.test('closeTaskModal cleanly removes modal from DOM', async () => {
    const { UI, document } = setupUiEnv();

    const course = { id: 'c3', name: 'Сети', teacher: 'Сидоров С.С.' };
    const task = { uniqueId: 'task_3', title: 'Лаба 3', status: 'DONE', statusLabel: 'Оценено' };

    UI.openTaskModal(task, course);
    assert.ok(document.getElementById('xias-modal-overlay'));

    UI.closeTaskModal();
    assert.equal(document.getElementById('xias-modal-overlay'), null);
  });

  await t.test('isValidTask rejects page header dump and select junk while accepting real tasks', async () => {
    const { UI } = setupUiEnv();

    const garbageTask1 = {
      title: 'Пасютин Александр Сергеевич\nФакультет Институт цифры\nСпециальность Бакалавриат'
    };
    const garbageTask2 = {
      title: '- Блок - - Выбрать - Бакалавриат'
    };
    const garbageTask3 = {
      title: 'Контрольная дата Максимальный балл Состояние'
    };

    const validTask1 = {
      title: '1. Установка и основные принципы работы с платформой'
    };
    const validTask2 = {
      title: 'Интеллект-карты'
    };

    assert.equal(UI.isValidTask(garbageTask1), false, 'Must reject faculty/header dump');
    assert.equal(UI.isValidTask(garbageTask2), false, 'Must reject select/block dump');
    assert.equal(UI.isValidTask(garbageTask3), false, 'Must reject table header dump');
    assert.equal(UI.isValidTask(validTask1), true, 'Must accept valid assignment title');
    assert.equal(UI.isValidTask(validTask2), true, 'Must accept valid short assignment title');
  });

  await t.test('file selection in openTaskModal produces chips without errors', async () => {
    const { UI, document } = setupUiEnv();

    const course = { id: 'c4', name: 'ООП', teacher: 'Кузнецов К.К.' };
    const task = { uniqueId: 'task_4', title: 'Лаба 4' };

    UI.openTaskModal(task, course);
    const modal = document.getElementById('xias-task-modal');
    assert.ok(modal);

    const fileInput = modal.querySelector('#xias-modal-file-input');
    assert.ok(fileInput);

    const testFile = new File(['content'], 'test.docx', { type: 'application/vnd.openxmlformats' });
    fileInput.files = [testFile];

    // Dispatch change event
    const event = new DOMEvent('change', { bubbles: true });
    fileInput.dispatchEvent(event);

    // Wait for async updateFiles
    await new Promise(r => setTimeout(r, 20));

    const previewList = modal.querySelector('#xias-modal-file-preview');
    assert.ok(previewList.innerHTML.includes('test.docx'), 'Must display selected file chip');
    assert.ok(previewList.innerHTML.includes('Без сжатия'), 'Must show uncompressed badge for docx');

    const submitBtn = modal.querySelector('#xias-modal-submit-btn');
    assert.equal(submitBtn.disabled, false, 'Submit button must be enabled when file is selected');

    // Verify solution title input field
    const titleInput = modal.querySelector('#xias-modal-solution-title');
    assert.ok(titleInput, 'Modal must have a solution title input field');
    assert.equal(titleInput.value, 'Лаба 4', 'Title field must be prefilled with task title');

    UI.closeTaskModal();
  });

  await t.test('default activeTab is TODO ("Надо сделать")', () => {
    const { UI } = setupUiEnv();
    assert.equal(UI.activeTab, 'TODO', 'Default dashboard tab must be TODO');
  });

  await t.test('isValidTask rejects category summary titles lacking action links or state', () => {
    const { UI } = setupUiEnv();

    const categoryHeader1 = {
      title: 'Лабораторные работы 1',
      actionUrl: '',
      statusRaw: ''
    };
    const categoryHeader2 = {
      title: 'Практические занятия 2'
    };
    const realLab = {
      title: 'Лабораторная работа 1',
      actionUrl: 'send.htm?id=1',
      status: 'TODO'
    };

    assert.equal(UI.isValidTask(categoryHeader1), false, 'Must reject category summary header');
    assert.equal(UI.isValidTask(categoryHeader2), false, 'Must reject category header');
    assert.equal(UI.isValidTask(realLab), true, 'Must accept singular lab task');
  });

  await t.test('updateStatsCounters correctly calculates and updates DOM counters', () => {
    const { UI, document } = setupUiEnv();

    document.body.innerHTML = `
      <div id="xias-stat-todo-val">0</div>
      <div id="xias-stat-review-val">0</div>
      <div id="xias-stat-done-val">0</div>
      <div id="xias-stat-score-val">0</div>
      <div id="xias-tab-todo-count">0</div>
      <div id="xias-tab-review-count">0</div>
      <div id="xias-tab-done-count">0</div>
    `;

    const courses = [
      {
        name: 'Информатика',
        score: 30,
        assignments: [
          { title: 'Лабораторная работа 1', status: 'TODO' },
          { title: 'Лабораторная работа 2', status: 'REVIEW' },
          { title: 'Лабораторная работа 3', status: 'DONE' },
          { title: 'Лабораторные работы 1', status: 'TODO' } // Fake category header should be ignored
        ]
      },
      {
        name: 'Математика',
        score: 50,
        assignments: [
          { title: 'Практическая работа 1', status: 'TODO' }
        ]
      }
    ];

    UI.updateStatsCounters(courses);

    assert.equal(document.getElementById('xias-stat-todo-val').textContent, '2', 'TODO count must be 2');
    assert.equal(document.getElementById('xias-stat-review-val').textContent, '1', 'REVIEW count must be 1');
    assert.equal(document.getElementById('xias-stat-done-val').textContent, '1', 'DONE count must be 1');
    assert.equal(document.getElementById('xias-stat-score-val').textContent, '80', 'Total score must be 80');
    assert.equal(document.getElementById('xias-tab-todo-count').textContent, '2', 'Tab TODO count must be 2');
  });

  await t.test('enhanceTasksPage button toggles off and calls deleteTask when clicked in synced state', async () => {
    let deletedTaskId = null;
    const { UI, document, window } = setupUiEnv({
      xiasSyncedTasks: {
        task_toggle_1: {
          syncedAt: '2026-09-24T10:00:00Z',
          tickTaskId: 'tick_999',
          title: 'Чек-листы и тест-кейсы'
        }
      }
    });

    window.XIASTickTick.deleteTask = async (id) => {
      deletedTaskId = id;
      return { success: true };
    };

    // Create a mock table row
    const row = document.createElement('tr');
    const td1 = document.createElement('td');
    td1.textContent = 'Чек-листы и тест-кейсы';
    const tdAction = document.createElement('td');
    row.appendChild(td1);
    row.appendChild(tdAction);

    const parsedData = {
      courseName: 'Тестирование программного обеспечения',
      assignments: [
        {
          uniqueId: 'task_toggle_1',
          title: 'Чек-листы и тест-кейсы',
          status: 'TODO',
          statusLabel: 'Не просмотрено',
          rawRow: row
        }
      ]
    };

    UI.enhanceTasksPage(parsedData);

    // Wait for getSyncedMap
    await new Promise(r => setTimeout(r, 20));

    const btn = tdAction.querySelector('.xias-inline-ticktick-btn');
    assert.ok(btn, 'TickTick button must be injected into task row');
    assert.ok(btn.classList.contains('synced'), 'Button must initially be in synced state');

    // Click the button to toggle off (cancel entry and delete from TickTick)
    btn.click();

    // Wait for async deleteTask handler
    await new Promise(r => setTimeout(r, 20));

    assert.equal(deletedTaskId, 'task_toggle_1', 'deleteTask must be invoked with the task uniqueId');
    assert.equal(btn.classList.contains('synced'), false, 'Button must no longer have synced class');
    assert.ok(btn.innerHTML.includes('+ TickTick'), 'Button must revert to + TickTick');
  });

  await t.test('openTaskModal submits solution form and uploads attached file to ЭИОС', async () => {
    const { UI, document, window } = setupUiEnv();

    let postedUrl = null;
    let postedBody = null;

    window.fetch = async (url, options = {}) => {
      if (options.method === 'POST') {
        postedUrl = url;
        postedBody = options.body;
        return {
          ok: true,
          status: 200,
          arrayBuffer: async () => Buffer.from('<html>Успешно</html>'),
          text: async () => '<html>Успешно</html>'
        };
      }
      // GET form page
      const html = `
        <form action="send_task.htm" enctype="multipart/form-data">
          <input type="hidden" name="id" value="501">
          <input type="text" name="name" value="">
          <textarea name="comment"></textarea>
          <input type="file" name="userfile">
          <input type="submit" name="sub" value="Загрузить">
        </form>
      `;
      return {
        ok: true,
        status: 200,
        arrayBuffer: async () => Buffer.from(html),
        text: async () => html
      };
    };

    const course = { id: 'c1', name: 'Базы данных', teacher: 'Петров П.П.' };
    const task = {
      uniqueId: 'task_sub_1',
      title: 'Лабораторная работа 1',
      actionUrl: 'send_task.htm?id=501',
      status: 'TODO',
      statusLabel: 'Нужно сделать'
    };

    UI.openTaskModal(task, course);
    const modal = document.getElementById('xias-task-modal');
    assert.ok(modal);

    const fileInput = modal.querySelector('#xias-modal-file-input');
    const testFile = new File(['binary content'], 'lab1.docx', { type: 'application/vnd.openxmlformats' });
    fileInput.files = [testFile];
    fileInput.dispatchEvent(new DOMEvent('change', { bubbles: true }));

    await new Promise(r => setTimeout(r, 20));

    const submitBtn = modal.querySelector('#xias-modal-submit-btn');
    assert.equal(submitBtn.disabled, false);

    submitBtn.click();
    await new Promise(r => setTimeout(r, 50));

    assert.ok(postedUrl, 'POST request must be sent to ЭИОС');
    assert.ok(postedUrl.includes('course_st/send_task.htm'), 'URL must be resolved to course_st/send_task.htm');
    assert.equal(task.status, 'REVIEW', 'Task status must be updated to REVIEW');
    assert.ok(submitBtn.innerHTML.includes('Отправлено'), 'Submit button must show Отправлено');
    assert.equal(submitBtn.disabled, true, 'Submit button must be disabled after successful upload');

    UI.closeTaskModal();
  });
});

