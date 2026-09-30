const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createDOMEnvironment } = require('./helpers/dom.js');

const ROOT_DIR = path.resolve(__dirname, '..');
const PARSER_PATH = path.join(ROOT_DIR, 'content', 'parser.js');
const FIXTURES_DIR = path.join(__dirname, 'fixtures');

function loadParser(html = '', url = 'https://xiais.kemsu.ru/proc/stud/index.shtm') {
  const { window, document } = createDOMEnvironment(html, url);
  const code = fs.readFileSync(PARSER_PATH, 'utf-8');

  const context = {
    window,
    document,
    location: window.location,
    console,
    Date,
    Math,
    parseInt,
    parseFloat,
    Array,
    String,
    RegExp
  };

  vm.createContext(context);
  vm.runInContext(code, context);

  return {
    parser: window.XIASParser,
    window,
    document
  };
}

test('XIASParser Unit and Opaque-Box DOM Parsing Suite', async (t) => {
  const npeHtml = fs.readFileSync(path.join(FIXTURES_DIR, 'xiais_npe.html'), 'utf-8');
  const coursesHtml = fs.readFileSync(path.join(FIXTURES_DIR, 'xiais_courses.html'), 'utf-8');
  const tasksHtml = fs.readFileSync(path.join(FIXTURES_DIR, 'xiais_tasks.html'), 'utf-8');

  await t.test('Page Type Detection (getPageType)', () => {
    assert.equal(
      loadParser('', 'https://eios.kemsu.ru/main/personal-area').parser.getPageType(),
      'EIOS_PERSONAL_AREA',
      'Should detect EIOS personal area'
    );
    assert.equal(
      loadParser('', 'https://eios.kemsu.ru/main').parser.getPageType(),
      'EIOS_LOGIN',
      'Should detect EIOS login page'
    );
    assert.equal(
      loadParser('', 'https://xiais.kemsu.ru/proc/stud/index.shtm').parser.getPageType(),
      'XIAIS_INDEX',
      'Should detect InfoOUPro index'
    );
    assert.equal(
      loadParser('', 'https://xiais.kemsu.ru/proc/stud/course_st/tasks_st.htm?id=101').parser.getPageType(),
      'XIAIS_TASKS',
      'Should detect InfoOUPro tasks page'
    );
    assert.equal(
      loadParser(npeHtml, 'https://xiais.kemsu.ru/proc/stud/index.shtm').parser.getPageType(),
      'XIAIS_SESSION_EXPIRED',
      'Should detect Tomcat NPE session expiration'
    );
    assert.equal(
      loadParser('', 'https://example.com/unknown').parser.getPageType(),
      'UNKNOWN',
      'Should return UNKNOWN for arbitrary pages'
    );
  });

  await t.test('Session Expiration Detection (isSessionExpired)', () => {
    const { parser: npeParser } = loadParser(npeHtml, 'https://xiais.kemsu.ru/proc/stud/index.shtm');
    assert.equal(npeParser.isSessionExpired(), true, 'Must detect expired session on NPE error page');

    const { parser: normalParser } = loadParser(coursesHtml, 'https://xiais.kemsu.ru/proc/stud/index.shtm');
    assert.equal(normalParser.isSessionExpired(), false, 'Normal course page must not be flagged as expired');
  });

  await t.test('Student Info Metadata Extraction (parseStudentInfo)', () => {
    const { parser } = loadParser(coursesHtml, 'https://xiais.kemsu.ru/proc/stud/index.shtm');
    const info = parser.parseStudentInfo();

    assert.equal(info.name, 'Кононенко Е. С.', 'Student FIO must match fixture');
    assert.equal(info.faculty, 'Институт цифры', 'Faculty must match fixture');
    assert.ok(info.specialty.includes('Прикладная информатика'), 'Specialty must match fixture');
  });

  await t.test('Courses Table Parsing (parseCoursesFromIndex)', () => {
    const { parser } = loadParser(coursesHtml, 'https://xiais.kemsu.ru/proc/stud/index.shtm');
    const courses = parser.parseCoursesFromIndex();

    assert.equal(courses.length, 4, 'Should extract 4 courses from fixture table');

    // Verify Course 1
    const c1 = courses[0];
    assert.equal(c1.name, 'Базы данных');
    assert.equal(c1.reportingType, 'Экзамен');
    assert.equal(c1.year, '2026-2027');
    assert.equal(c1.hours, '144');
    assert.equal(c1.period, '1 сем.');
    assert.equal(c1.teacher, 'Петров П. П.');
    assert.equal(c1.score, 68.5);
    assert.ok(c1.actionElement, 'Action link element to tasks must exist');

    // Verify Course 4
    const c4 = courses[3];
    assert.equal(c4.name, 'Физическая культура и спорт');
    assert.equal(c4.reportingType, 'Зачет');
    assert.equal(c4.score, 0);

    // Malformed table handling
    const { parser: emptyParser } = loadParser('<div><p>Нет таблиц</p></div>');
    const emptyCourses = emptyParser.parseCoursesFromIndex();
    assert.deepEqual(emptyCourses, [], 'Must handle missing course table gracefully without throwing');
  });

  await t.test('Task Table Parsing & 4-State Normalization (parseTasksPage)', () => {
    const { parser } = loadParser(tasksHtml, 'https://xiais.kemsu.ru/proc/stud/course_st/tasks_st.htm?id=101');
    const result = parser.parseTasksPage();

    assert.equal(result.courseName, 'Базы данных', 'Discipline name must be parsed from header');
    assert.equal(result.assignments.length, 5, 'Should parse all 5 assignments');

    const [t1, t2, t3, t4, t5] = result.assignments;

    // Task 1: TODO (Не сдано)
    assert.ok(t1.title.includes('Лабораторная работа №1'));
    assert.equal(t1.status, 'TODO', 'Unsubmitted task must be mapped to TODO');
    assert.equal(t1.needSubmission, true);
    assert.equal(t1.deadlineRaw, '26-09-2026 23:59:59');

    // Task 2: REVIEW (На проверке)
    assert.ok(t2.title.includes('Лабораторная работа №2'));
    assert.equal(t2.status, 'REVIEW', 'Submitted task awaiting teacher check must be mapped to REVIEW');

    // Task 3: DONE (Оценено)
    assert.ok(t3.title.includes('Лабораторная работа №3'));
    assert.equal(t3.status, 'DONE', 'Graded task must be mapped to DONE');
    assert.equal(t3.resultScore, '19,5');

    // Task 4: REWORK (На доработке)
    assert.ok(t4.title.includes('Лабораторная работа №4'));
    assert.equal(t4.status, 'REWORK', 'Task returned for revision must be mapped to REWORK');

    // Task 5: Category boundary test
    assert.ok(t5.title.includes('Курсовой проект'));
    assert.equal(t5.category, 'Индивидуальные задания', 'Must assign category from table section divider');
    assert.equal(t5.status, 'TODO');
  });

  await t.test('Novokuznetsk (UTC+7) Timezone-Aware Deadline Parsing', () => {
    const { parser } = loadParser();
    const raw = '26-09-2026 23:59:59';
    const parsed = parser.parseDate(raw);

    assert.ok(parsed, 'parseDate must return a valid date string');

    // KemSU portal operates in Kemerovo/Novokuznetsk timezone (Asia/Novokuznetsk, UTC+7)
    // 2026-09-26 23:59:59 at UTC+7 equals 2026-09-26 16:59:59 UTC
    const expectedUtcIso = '2026-09-26T16:59:59.000Z';
    const parsedUtcIso = new Date(parsed).toISOString();

    assert.equal(
      parsedUtcIso,
      expectedUtcIso,
      `Deadline must be parsed assuming Novokuznetsk (UTC+7) timezone. Expected ${expectedUtcIso}, got ${parsedUtcIso}`
    );
  });

  await t.test('Attachment File Extraction (F5 / Interface Contract)', () => {
    const { parser } = loadParser(tasksHtml, 'https://xiais.kemsu.ru/proc/stud/course_st/tasks_st.htm?id=101');
    const result = parser.parseTasksPage();

    const t1 = result.assignments[0];
    assert.ok(Array.isArray(t1.attachments), 'Task must have attachments array property per PROJECT.md interface contract');
    assert.ok(t1.attachments.length > 0, 'Task 1 has an attached методичка and must extract at least 1 attachment');
    assert.ok(
      t1.attachments.some(a => a.url && a.url.includes('method_db_lab1.pdf')),
      'Attachment URL must point to method_db_lab1.pdf'
    );
  });

  await t.test('parseDate edge cases and fault tolerance', () => {
    const { parser } = loadParser();
    assert.equal(parser.parseDate(''), null, 'Empty string must return null');
    assert.equal(parser.parseDate(null), null, 'Null must return null');
    assert.equal(parser.parseDate('невалидная дата'), null, 'Invalid string must return null');

    // Date without time component (defaults to 23:59:59)
    const dateOnly = parser.parseDate('26.09.2026');
    assert.ok(dateOnly, 'Date without time should be parseable');
  });

  await t.test('Plural category summary rows are filtered out and not parsed as tasks', () => {
    const htmlWithCategoryHeader = `
      <table border="1">
        <tr>
          <th>Наименование задания</th>
          <th>Сдача</th>
          <th>Комментарий</th>
          <th>Контрольная дата</th>
          <th>Макс. балл</th>
          <th>Итог балл</th>
          <th>Состояние</th>
          <th>Действия</th>
        </tr>
        <tr>
          <td>Лабораторные работы 1</td>
          <td></td>
          <td></td>
          <td></td>
          <td>32</td>
          <td></td>
          <td></td>
          <td></td>
        </tr>
        <tr>
          <td>Лабораторная работа 1</td>
          <td>Да</td>
          <td></td>
          <td>30.09.2026</td>
          <td>4</td>
          <td></td>
          <td>Не сдано</td>
          <td><a href="send.htm?id=1"><img src="l.gif"></a></td>
        </tr>
        <tr>
          <td>Лабораторная работа 2</td>
          <td>Да</td>
          <td></td>
          <td>15.10.2026</td>
          <td>4</td>
          <td></td>
          <td>На проверке</td>
          <td><a href="send.htm?id=2"><img src="l.gif"></a></td>
        </tr>
      </table>
    `;
    const { parser, document } = loadParser(htmlWithCategoryHeader, 'https://xiais.kemsu.ru/proc/stud/course_st/tasks_st.htm?id=999');
    const result = parser.parseTasksFromDocument(document, 'Тестовый курс', 'Преподаватель');
    
    assert.equal(result.assignments.length, 2, 'Should only include the 2 individual labs, excluding category summary header');
    assert.equal(result.assignments[0].title, 'Лабораторная работа 1');
    assert.equal(result.assignments[1].title, 'Лабораторная работа 2');
    assert.equal(result.assignments[0].category, 'Лабораторные работы 1', 'Subsequent tasks should inherit the category name');
  });
});
