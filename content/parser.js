// XIAS Parser for KemSU EIOS & XI AIS (InfoOUPro)
// Covers: eios.kemsu.ru, xiais.kemsu.ru/proc/stud/index.shtm, xiais.kemsu.ru/proc/stud/course_st/tasks_st.htm

window.XIASParser = {
  // Определение типа текущей страницы
  getPageType() {
    if (this.isSessionExpired()) {
      return 'XIAIS_SESSION_EXPIRED';
    }
    const url = (window.location && window.location.href) || '';
    if (url.includes('xiais.kemsu.ru/help.htm')) return 'XIAIS_HELP_STUB';
    if (url.includes('eios.kemsu.ru/main/personal-area')) return 'EIOS_PERSONAL_AREA';
    if (url.includes('eios.kemsu.ru/main') || url.includes('eios.kemsu.ru/login')) return 'EIOS_LOGIN';
    if (url.includes('course_st/tasks_st.htm') || url.includes('tasks_st')) {
      return 'XIAIS_TASKS';
    }
    if (url.includes('xiais.kemsu.ru/proc/stud/index.shtm') || (url.includes('xiais.kemsu.ru/proc/stud') && !url.includes('course_st'))) {
      return 'XIAIS_INDEX';
    }
    return 'UNKNOWN';
  },

  // Безопасное получение текстового содержимого (работает и в DOM, и в detached DOMParser)
  getText(el) {
    if (!el) return '';
    return (el.textContent || el.innerText || '').trim();
  },

  // Проверка валидности имени сущности (курс, преподаватель) — исключает двоеточия, дефисы и мусор
  isValidEntityName(str) {
    if (!str || typeof str !== 'string') return false;
    const clean = str.replace(/[:\-–—\s\.\,\[\]\(\)]/g, '').trim();
    return clean.length >= 2;
  },

  // Очистка названия сущности от скобок [семестр 1] и ведущих/замыкающих знаков препинания
  cleanEntityName(str) {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/\[.*\]/g, '').replace(/^[:\-–—\s]+/, '').replace(/[:\-–—\s]+$/, '').trim();
  },

  // Проверка сессии на странице xiais
  isSessionExpired() {
    const text = document.body ? (document.body.textContent || document.body.innerText || '') : '';
    return text.includes('Нет доступа') || text.includes('NullPointerException') || text.includes('Сессия устарела');
  },

  // Извлечение информации о студенте (ФИО, Факультет, Специальность)
  parseStudentInfo() {
    const text = document.body ? (document.body.textContent || document.body.innerText || '') : '';
    const info = {
      name: 'Студент',
      faculty: 'Институт цифры',
      specialty: 'Фундаментальная информатика и информационные технологии',
      year: '2026-2027'
    };

    // Поиск ФИО (например "Кононенко Е.С.")
    const nameMatch = text.match(/([А-ЯЁ][а-яё]+)\s+([А-ЯЁ]\.\s*[А-ЯЁ]\.)/);
    if (nameMatch) {
      info.name = `${nameMatch[1]} ${nameMatch[2]}`;
    }

    // Факультет и специальность
    const facultyMatch = text.match(/Факультет[\s\S]*?(Институт[^\n\r\t<]+)/i);
    if (facultyMatch) {
      info.faculty = facultyMatch[1].trim();
    }

    const specMatch = text.match(/Специальность[\s\S]*?([Бакалавриат|Специалитет|Магистратура][^\n\r\t<]+)/i);
    if (specMatch) {
      info.specialty = specMatch[1].trim();
    }

    return info;
  },

  // Парсинг списка курсов на главной странице xiais.kemsu.ru/proc/stud/index.shtm
  parseCoursesFromIndex() {
    const tables = Array.from(document.querySelectorAll('table'));
    const candidateTables = tables.filter(t => {
      const txt = this.getText(t);
      return txt.includes('Дисциплина') && (txt.includes('Отчетность') || txt.includes('Преподаватель'));
    });

    if (candidateTables.length === 0) return new Array();

    // Выбираем самую специфичную таблицу (с наименьшим числом вложенных таблиц)
    candidateTables.sort((a, b) => a.querySelectorAll('table').length - b.querySelectorAll('table').length);
    const courseTable = candidateTables[0];

    const rows = Array.from(courseTable.querySelectorAll('tr'));
    const courses = new Array();

    rows.forEach((row, idx) => {
      // Игнорируем строки, содержащие только th (заголовки)
      if (row.querySelector('th') && !row.querySelector('td')) return;

      const cells = Array.from(row.querySelectorAll('td'));
      if (cells.length < 6) return;

      const titleCell = cells[1];
      if (!titleCell) return;
      const courseName = this.getText(titleCell);
      if (!courseName || courseName.toLowerCase().includes('дисциплина')) return;

      const reportingType = cells[2] ? this.getText(cells[2]) : '';
      const year = cells[3] ? this.getText(cells[3]) : '';
      const hours = cells[4] ? this.getText(cells[4]) : '';
      const period = cells[5] ? this.getText(cells[5]) : '';
      const teacher = cells[6] ? this.getText(cells[6]) : '';
      const scoreRaw = cells[7] ? this.getText(cells[7]) : '0';
      const score = parseFloat(scoreRaw.replace(',', '.')) || 0;

      // 0. Извлечение c_id дисциплины
      let cId = '';
      const cIdInput = row.querySelector('input[name="c_id"], input[name="id"]');
      if (cIdInput && cIdInput.value) {
        cId = cIdInput.value.trim();
      }
      if (!cId) {
        const allInputs = Array.from(row.querySelectorAll('input'));
        for (const inp of allInputs) {
          if ((inp.name === 'c_id' || inp.name === 'id') && inp.value) {
            cId = inp.value.trim();
            break;
          }
        }
      }
      if (!cId) {
        const rowHtml = row.innerHTML || '';
        const mCid = rowHtml.match(/name=["']?c_id["']?\s+value=["']?(\d+)["']?/i) || rowHtml.match(/value=["']?(\d+)["']?\s+name=["']?c_id["']?/i);
        if (mCid) cId = mCid[1];
      }

      // Ищем элемент действия (иконка лупы, ссылка или кнопка отправки)
      let actionEl = null;
      let rawTasksUrl = '';
      const actionCell = cells[8] || cells[cells.length - 1];
      if (actionCell) {
        actionEl = actionCell.querySelector('a, input[type="image"], button, img');
      }
      if (!actionEl) {
        actionEl = row.querySelector('img, a[href*="tasks"], a[href*="course"], a');
      }

      // 1. Прямой поиск ссылки в строке или actionEl
      if (actionEl) {
        if (actionEl.getAttribute && actionEl.getAttribute('href')) {
          rawTasksUrl = actionEl.getAttribute('href');
        } else if (actionEl.href) {
          rawTasksUrl = actionEl.href;
        } else if (actionEl.closest && actionEl.closest('a')) {
          rawTasksUrl = actionEl.closest('a').getAttribute('href') || actionEl.closest('a').href;
        } else if (actionEl.parentNode && actionEl.parentNode.tagName === 'A') {
          rawTasksUrl = actionEl.parentNode.getAttribute('href') || actionEl.parentNode.href;
        }
      }

      if (!rawTasksUrl) {
        const anyA = row.querySelector('a[href*="tasks"], a[href*="course"], a');
        if (anyA) {
          rawTasksUrl = anyA.getAttribute('href') || anyA.href || '';
        }
      }

      // 2. Поиск формы в строке
      let formAction = '';
      let formMethod = 'GET';
      let formInputs = null;
      const form = row.querySelector('form');
      if (form) {
        formAction = form.getAttribute('action') || '';
        formMethod = (form.getAttribute('method') || 'GET').toUpperCase();
        formInputs = {};
        form.querySelectorAll('input').forEach(i => {
          if (i.name) formInputs[i.name] = i.value || '';
        });
      }

      if (!rawTasksUrl && form) {
        const act = formAction;
        const params = Array.from(form.querySelectorAll('input'))
          .filter(i => i.name && i.value)
          .map(i => `${encodeURIComponent(i.name)}=${encodeURIComponent(i.value)}`)
          .join('&');
        if (act) rawTasksUrl = act + (params ? (act.includes('?') ? '&' : '?') + params : '');
      }

      // 3. Поиск onclick обработчиков
      if (!rawTasksUrl) {
        const onclickEls = row.querySelectorAll('[onclick]');
        for (const el of onclickEls) {
          const oc = el.getAttribute('onclick') || '';
          const m = oc.match(/(?:location\.href|location|open)\s*=\s*['"]([^'"]+)['"]/i)
            || oc.match(/(?:window\.open|location\.assign|location\.replace)\s*\(\s*['"]([^'"]+)['"]/i)
            || oc.match(/['"](course_st\/[^'"]+)['"]/i);
          if (m) {
            rawTasksUrl = m[1];
            break;
          }
        }
      }

      let tasksUrl = '';
      if (cId) {
        tasksUrl = `https://xiais.kemsu.ru/proc/stud/course_st/tasks_st.htm?c_id=${encodeURIComponent(cId)}`;
      } else if (rawTasksUrl && !rawTasksUrl.startsWith('javascript:')) {
        try {
          const URLClass = (typeof URL !== 'undefined') ? URL : (typeof window !== 'undefined' ? window.URL : globalThis.URL);
          const base = (rawTasksUrl.startsWith('stud/') || rawTasksUrl.startsWith('/stud/'))
            ? 'https://xiais.kemsu.ru/proc/'
            : 'https://xiais.kemsu.ru/proc/stud/';
          tasksUrl = new URLClass(rawTasksUrl, base).href;
          tasksUrl = tasksUrl.replace(/\/stud\/stud\//g, '/stud/');
          if (cId && !tasksUrl.includes('c_id=')) {
            tasksUrl += (tasksUrl.includes('?') ? '&' : '?') + 'c_id=' + encodeURIComponent(cId);
          }
        } catch (e) {
          tasksUrl = rawTasksUrl;
        }
      }

      const id = 'course_' + this.hashCode(courseName);

      courses.push({
        id,
        name: courseName,
        reportingType,
        year,
        hours,
        period,
        teacher,
        score,
        scoreRaw,
        actionElement: actionEl,
        c_id: cId,
        tasksUrl,
        formAction,
        formMethod,
        formInputs,
        rawRow: row
      });
    });

    return courses;
  },

  // Парсинг заданий на странице дисциплины xiais.kemsu.ru/proc/stud/course_st/tasks_st.htm
  parseTasksPage(doc = (typeof document !== 'undefined' ? document : null)) {
    return this.parseTasksFromDocument(doc);
  },

  parseTasksFromDocument(doc = (typeof document !== 'undefined' ? document : null), explicitCourseName = '', explicitTeacher = '') {
    if (!doc) return { courseName: '', teacher: '', assignments: [] };

    // 1. Извлекаем название текущей дисциплины и преподавателя из самого документа
    let docCourseName = '';
    let docTeacher = '';
    const bodyText = doc.body ? (doc.body.textContent || doc.body.innerText || '') : '';
    const isValid = (s) => this.isValidEntityName(s);
    const clean = (s) => this.cleanEntityName(s);

    if (doc) {
      // 1.1 Поиск в заголовках и текстовых элементах страницы
      const elements = Array.from(doc.querySelectorAll('h1, h2, h3, h4, th, td, b, span, p'));
      for (const el of elements) {
        const t = this.getText(el);
        const m = t.match(/^Дисциплина\s*[:\-–—]?\s*(.+)$/i);
        if (m && m[1] && !m[1].startsWith('->') && !m[1].toLowerCase().includes('задания') && m[1].length < 120) {
          const cand = clean(m[1]);
          if (isValid(cand)) {
            docCourseName = cand;
            break;
          }
        }
      }

      // 1.2 Если в таблице пара или тройка ячеек <td>Дисциплина</td> <td>:</td> <td>Название</td>
      if (!docCourseName) {
        const labelCell = elements.find(el => {
          const t = this.getText(el).toLowerCase().trim();
          return t === 'дисциплина:' || t === 'дисциплина';
        });
        if (labelCell) {
          let sib = labelCell.nextElementSibling;
          while (sib) {
            const cand = clean(this.getText(sib));
            if (isValid(cand) && cand.length < 120 && !cand.toLowerCase().includes('задания')) {
              docCourseName = cand;
              break;
            }
            sib = sib.nextElementSibling;
          }
        }
      }

      // 1.3 Fallback: regex по тексту страницы
      if (!docCourseName) {
        const courseMatch = bodyText.match(/Дисциплина\s*[:\-–—]?\s*([^\n\r\t<\[\]]+)/i);
        if (courseMatch && !courseMatch[1].includes('->')) {
          const cand = clean(courseMatch[1]);
          if (isValid(cand)) {
            docCourseName = cand;
          }
        }
      }
    }

    if (doc) {
      const elements = Array.from(doc.querySelectorAll('th, td, b, span, p'));
      for (const el of elements) {
        const t = this.getText(el);
        const m = t.match(/^Преподаватель\s*[:\-–—]?\s*(\S.+)$/i);
        if (m && m[1] && m[1].length < 80) {
          const cand = clean(m[1]);
          if (isValid(cand)) {
            docTeacher = cand;
            break;
          }
        }
        if (/^Преподаватель\s*[:\-–—]?$/i.test(t.trim())) {
          let sib = el.nextElementSibling;
          while (sib) {
            const cand = clean(this.getText(sib));
            if (isValid(cand) && cand.length < 80) {
              docTeacher = cand;
              break;
            }
            sib = sib.nextElementSibling;
          }
          if (docTeacher) break;

          if (el.nextSibling && (el.nextSibling.textContent || el.nextSibling.nodeValue)) {
            const nextTxt = clean(el.nextSibling.textContent || el.nextSibling.nodeValue || '');
            if (isValid(nextTxt) && nextTxt.length < 80) {
              docTeacher = nextTxt;
              break;
            }
          }
        }
      }
      if (!docTeacher) {
        const teacherMatch = bodyText.match(/Преподаватель\s*[:\-–—]?\s*([^\n\r\t<\[\]]+)/i);
        if (teacherMatch) {
          const cand = clean(teacherMatch[1]);
          if (isValid(cand)) {
            docTeacher = cand;
          }
        }
      }
    }

    // Проверка на несовпадение предмета:
    // Если явно передан ожидаемый предмет, а в документе обнаружен другой
    const normalize = (s) => (s || '').toLowerCase().replace(/[^a-zа-яё0-9]/gi, '');
    const normExplicit = normalize(explicitCourseName);
    const normDoc = normalize(docCourseName);

    if (normExplicit && normDoc && normExplicit !== normDoc && !normExplicit.includes(normDoc) && !normDoc.includes(normExplicit)) {
      return {
        courseName: docCourseName,
        teacher: docTeacher || explicitTeacher || '',
        assignments: [],
        isMismatch: true
      };
    }

    const courseName = explicitCourseName || docCourseName || '';
    const teacher = docTeacher || explicitTeacher || '';

    // 2. Ищем таблицу «Назначенные задания» (наиболее вложенную таблицу, содержащую заголовки заданий)
    const hasTaskHeaders = (t) => {
      const txt = this.getText(t).toLowerCase();
      const hasTitle = txt.includes('наименование задания') || txt.includes('назначенные задания') || txt.includes('название');
      const hasDateOrScore = txt.includes('контрольная дата') || txt.includes('максимальный балл') || txt.includes('состояние');
      return hasTitle && hasDateOrScore;
    };

    const tables = Array.from(doc.querySelectorAll('table'));
    const candidateTables = tables.filter(hasTaskHeaders);

    // Выбираем самую глубокую (innermost) таблицу: у нее не должно быть дочерних таблиц с теми же заголовками
    let tasksTable = candidateTables.find(t => {
      const childTables = Array.from(t.querySelectorAll('table'));
      return !childTables.some(hasTaskHeaders);
    });

    // Fallback: последняя из таблиц-кандидатов (в DOM внутренние таблицы идут глубже)
    if (!tasksTable && candidateTables.length > 0) {
      tasksTable = candidateTables[candidateTables.length - 1];
    }

    if (!tasksTable) {
      const altCandidates = tables.filter(t => {
        const txt = this.getText(t).toLowerCase();
        return txt.includes('контрольная дата') && txt.includes('состояние');
      });
      tasksTable = altCandidates.find(t => {
        const childTables = Array.from(t.querySelectorAll('table'));
        return !childTables.some(ct => this.getText(ct).toLowerCase().includes('контрольная дата'));
      }) || altCandidates[altCandidates.length - 1];
    }

    if (!tasksTable) return { courseName, teacher, assignments: [] };

    const rows = Array.from(tasksTable.querySelectorAll('tr'));
    const assignments = [];
    let currentCategory = 'Лабораторные работы';

    const garbageWords = [
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
      'дисциплина:'
    ];

    rows.forEach((row) => {
      // Игнорируем строки, содержащие вложенные таблицы или селекты выбора специальностей
      if (row.querySelectorAll('table').length > 0 || row.querySelector('select')) return;

      const cells = Array.from(row.querySelectorAll('td'));
      if (cells.length === 0) return;

      const rowText = this.getText(row);
      const rowLower = rowText.toLowerCase();

      // Игнорируем заголовки и служебные фильтры
      if (rowLower.includes('контрольная дата') || rowLower.includes('максимальный балл') || rowLower.includes('наименование задания')) return;
      if (rowLower.includes('факультет') || rowLower.includes('специальность')) return;
      if (rowLower.includes('назначенные задания по дисциплине')) return;

      // Проверка на строку-разделитель категории (например «Лабораторные работы»)
      if (cells.length < 4 && (rowLower.includes('работы') || rowLower.includes('задания') || rowLower.includes('практические'))) {
        currentCategory = rowText.replace(/[^\w\sа-яА-ЯёЁ.-]/g, '').trim() || rowText;
        return;
      }

      if (cells.length < 4) return;

      let title = this.getText(cells[0]);
      if (!title || title.length > 150) return;

      // Исключаем попадание мусорных заголовков
      const titleLower = title.toLowerCase();
      if (garbageWords.some(w => titleLower.includes(w))) return;
      if ((title.match(/\n/g) || []).length > 1) return;

      const needSubmission = this.getText(cells[1]).toLowerCase() === 'да';
      const comment = this.getText(cells[2]);
      const deadlineRaw = this.getText(cells[3]); // например "26-09-2026 23:59:59"
      const maxScore = this.getText(cells[4]);
      const resultScore = this.getText(cells[5]);
      const stateRaw = this.getText(cells[6]);

      // Нормализуем статус:
      // 'DONE' (Оценено / Зачтено), 'REVIEW' (На проверке), 'TODO' (Сделать), 'REWORK' (Доработка)
      let status = 'TODO';
      let statusLabel = 'Нужно сделать';
      const stateLower = stateRaw.toLowerCase();

      if (stateLower.includes('оценен') || stateLower.includes('зачтен') || stateLower.includes('принят') || (resultScore && parseFloat(resultScore) > 0)) {
        status = 'DONE';
        statusLabel = 'Оценено';
      } else if (stateLower.includes('на проверке') || stateLower.includes('отправлен') || stateLower.includes('ожидает')) {
        status = 'REVIEW';
        statusLabel = 'На проверке';
      } else if (stateLower.includes('доработк') || stateLower.includes('исправ')) {
        status = 'REWORK';
        statusLabel = 'На доработке';
      } else {
        status = 'TODO';
        statusLabel = 'Нужно сделать';
      }

      // Парсинг даты ISO
      const deadlineISO = this.parseDate(deadlineRaw);

      // Прикрепленные файлы (методички и задания)
      const attachments = [];
      const links = Array.from(row.querySelectorAll('a'));
      links.forEach(a => {
        let href = a.getAttribute('href') || a.href || '';
        const txt = this.getText(a);
        if (href && (href.includes('file') || href.includes('download') || href.includes('load') || href.includes('.pdf') || href.includes('.doc') || href.includes('.zip') || href.includes('metod') || href.includes('method') || txt.includes('Файл') || txt.includes('Методич') || txt.includes('.'))) {
          try {
            href = new URL(href, 'https://xiais.kemsu.ru/proc/stud/course_st/').href;
          } catch (e) {}
          attachments.push({
            name: txt || 'Файл задания',
            url: href
          });
        }
      });

      // Ищем действие КемГУ (ссылка на send_task.htm или view_task.htm, лупа или кнопка)
      const actionCell = cells[7] || cells[cells.length - 1];
      let actionEl = actionCell ? actionCell.querySelector('a:not(.xias-inline-ticktick-btn), input, button:not(.xias-inline-ticktick-btn), img') : null;
      if (!actionEl) {
        actionEl = row.querySelector('img[src*="loupe"], img[src*="edit"], a[href*="task"], a[href*="send"], a[href*="view"]');
      }

      // Проверка на сводную строку категории (например «Лабораторные работы 1», «Практические работы 2»)
      const isPluralCategory = /^(лабораторные|практические|контрольные|семестровые|самостоятельные|расчетно-графические)\s+(работы|занятия|задания)/i.test(title);
      if (isPluralCategory && (!actionEl || !stateRaw)) {
        currentCategory = title;
        return;
      }

      // Если нет действия КемГУ и нет статуса — это не отдельное задание
      if (!actionEl && !stateRaw) {
        return;
      }

      let actionUrl = '';

      // 1. Поиск прямой ссылки задачи в строке
      const directTaskLink = row.querySelector('a[href*="send_task"], a[href*="edit_task"], a[href*="view_task"], a[href*="task"], a[href*="send"]');
      if (directTaskLink) {
        actionUrl = directTaskLink.getAttribute('href') || directTaskLink.href || '';
      }

      // 2. Поиск формы в строке
      if (!actionUrl) {
        const form = row.querySelector('form');
        if (form) {
          const act = form.getAttribute('action') || '';
          const params = Array.from(form.querySelectorAll('input'))
            .filter(i => i.name && i.value)
            .map(i => `${encodeURIComponent(i.name)}=${encodeURIComponent(i.value)}`)
            .join('&');
          if (act) actionUrl = act + (params ? (act.includes('?') ? '&' : '?') + params : '');
        }
      }

      // 3. Поиск onclick обработчиков
      if (!actionUrl) {
        const onclickEls = row.querySelectorAll('[onclick]');
        for (const el of onclickEls) {
          const onclick = el.getAttribute('onclick') || '';
          const match = onclick.match(/(?:location\.href|location|open)\s*=\s*['"]([^'"]+)['"]/i)
            || onclick.match(/(?:window\.open|location\.assign|location\.replace)\s*\(\s*['"]([^'"]+)['"]/i)
            || onclick.match(/['"](send_task\.htm[^'"]*)['"]/i)
            || onclick.match(/['"](view_task\.htm[^'"]*)['"]/i);
          if (match) {
            actionUrl = match[1];
            break;
          }
        }
      }

      // 4. Поиск в actionEl
      if (!actionUrl && actionEl) {
        if (actionEl.tagName === 'A') {
          actionUrl = actionEl.getAttribute('href') || actionEl.href || '';
        } else if (actionEl.closest && actionEl.closest('a')) {
          actionUrl = actionEl.closest('a').getAttribute('href') || actionEl.closest('a').href || '';
        } else if (actionEl.parentNode && actionEl.parentNode.tagName === 'A') {
          actionUrl = actionEl.parentNode.getAttribute('href') || actionEl.parentNode.href || '';
        }
      }

      if (actionUrl && !actionUrl.startsWith('javascript:')) {
        try {
          actionUrl = new URL(actionUrl, 'https://xiais.kemsu.ru/proc/stud/course_st/').href;
        } catch (e) {}
      }

      const uniqueId = 'task_' + this.hashCode((courseName || 'course') + '_' + title);

      assignments.push({
        uniqueId,
        courseName,
        teacher,
        category: currentCategory,
        title,
        needSubmission,
        comment,
        deadlineRaw,
        deadlineISO,
        maxScore,
        resultScore,
        status,
        statusLabel,
        attachments,
        files: attachments,
        actionElement: actionEl,
        actionUrl,
        rawRow: row
      });
    });

    return {
      courseName,
      teacher,
      assignments
    };
  },

  // Парсинг дат типа "26-09-2026 23:59:59" или "26.09.2026" (часовой пояс Кемерово / Новокузнецк UTC+7)
  parseDate(str) {
    if (!str || typeof str !== 'string') return null;
    const match = str.match(/(\d{2})[.\-](\d{2})[.\-](\d{4})(\s+(\d{2}):(\d{2})(:(\d{2}))?)?/);
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const year = parseInt(match[3], 10);
      const hour = match[5] ? parseInt(match[5], 10) : 23;
      const min = match[6] ? parseInt(match[6], 10) : 59;
      const sec = match[8] ? parseInt(match[8], 10) : 59;

      // Кемерово / Новокузнецк находится в часовом поясе Asia/Novokuznetsk (UTC+7).
      // Преобразуем локальное время UTC+7 в метку времени UTC:
      const utcMs = Date.UTC(year, month, day, hour - 7, min, sec);
      return new Date(utcMs).toISOString();
    }
    return null;
  },

  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  }
};
