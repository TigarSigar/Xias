#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CACHE_FILE = path.join(__dirname, 'data', 'eios_cache.json');
const DOWNLOADS_DIR = path.join(__dirname, '..', 'downloads');

function loadCache() {
  if (!fs.existsSync(CACHE_FILE)) {
    console.error('Кэш ЭИОС пуст. Откройте ИнфоОУПро в Google Chrome для автосинхронизации.');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
}

const args = process.argv.slice(2);
const command = args[0] || 'help';

switch (command) {
  case 'student': {
    const data = loadCache();
    console.log('\n--- ИНФОРМАЦИЯ О СТУДЕНТЕ ---');
    console.log('Студент:', data.studentInfo?.name || 'Не указан');
    console.log('Факультет:', data.studentInfo?.faculty || 'Не указан');
    console.log('Специальность:', data.studentInfo?.specialty || 'Не указана');
    console.log('Учебный год:', data.studentInfo?.year || 'Не указан');
    console.log('Последняя синхронизация:', data.lastSynced || 'Нет данных');
    break;
  }

  case 'courses': {
    const data = loadCache();
    const filter = args[1] ? args[1].toLowerCase() : '';
    console.log('\n--- СПИСОК ДИСЦИПЛИН ---');
    const courses = (data.courses || []).filter(c => !filter || c.name.toLowerCase().includes(filter));
    courses.forEach((c, idx) => {
      const assignments = data.assignments[c.name] || [];
      const todo = assignments.filter(a => a.status === 'TODO').length;
      const review = assignments.filter(a => a.status === 'REVIEW').length;
      const done = assignments.filter(a => a.status === 'DONE').length;
      console.log(`[${idx + 1}] ${c.name}`);
      console.log(`    Преподаватель: ${c.teacher || 'Не указан'}`);
      console.log(`    Задач: всего ${assignments.length} (Надо сделать: ${todo}, На проверке: ${review}, Сдано: ${done})`);
    });
    break;
  }

  case 'tasks': {
    const data = loadCache();
    const statusFilter = (args.find(a => a.startsWith('--status=')) || '').split('=')[1]?.toUpperCase();
    const courseFilter = (args.find(a => a.startsWith('--course=')) || '').split('=')[1]?.toLowerCase();

    console.log('\n--- ЗАДАНИЯ И ЛАБОРАТОРНЫЕ РАБОТЫ ---');
    let count = 0;
    for (const [courseName, list] of Object.entries(data.assignments || {})) {
      if (courseFilter && !courseName.toLowerCase().includes(courseFilter)) continue;
      if (!Array.isArray(list)) continue;

      for (const t of list) {
        if (statusFilter && statusFilter !== 'ALL' && t.status !== statusFilter) continue;
        count++;
        const statusBadge = t.status === 'DONE' ? '[✓ СДАНО]' : t.status === 'REVIEW' ? '[⏳ НА ПРОВЕРКЕ]' : '[• НАДО СДЕЛАТЬ]';
        console.log(`\n${statusBadge} ${courseName}: ${t.title}`);
        console.log(`    ID: ${t.uniqueId}`);
        console.log(`    Преподаватель: ${t.teacher || 'Не указан'}`);
        console.log(`    Дедлайн: ${t.deadlineRaw || 'Без срока'}`);
        if (t.comment) console.log(`    Комментарий: ${t.comment}`);
        if (t.attachments && t.attachments.length > 0) {
          console.log(`    Файлы задания:`);
          t.attachments.forEach(att => console.log(`      - ${att.name}: ${att.url}`));
        }
      }
    }
    console.log(`\nВсего выведено заданий: ${count}`);
    break;
  }

  case 'details': {
    const query = args[1];
    if (!query) {
      console.error('Укажите ID или название задания: node cli.js details <taskId>');
      process.exit(1);
    }
    const data = loadCache();
    let found = null;
    let foundCourse = '';
    for (const [cName, list] of Object.entries(data.assignments || {})) {
      for (const t of list) {
        if (t.uniqueId === query || t.title.toLowerCase().includes(query.toLowerCase())) {
          found = t;
          foundCourse = cName;
          break;
        }
      }
      if (found) break;
    }

    if (!found) {
      console.error(`Задание не найдено по запросу: ${query}`);
      process.exit(1);
    }

    console.log('\n--- ПОДРОБНОСТИ ЗАДАНИЯ ---');
    console.log('Предмет:', foundCourse);
    console.log('Название:', found.title);
    console.log('Преподаватель:', found.teacher);
    console.log('Статус:', found.statusLabel, `(${found.status})`);
    console.log('Крайний срок:', found.deadlineRaw);
    console.log('Инструкция/Комментарий:', found.comment || 'Нет');
    console.log('Ссылка сдачи (actionUrl):', found.actionUrl || 'Не указана');
    if (found.attachments && found.attachments.length > 0) {
      console.log('Прикрепленные материалы:');
      found.attachments.forEach((a, i) => console.log(`  [${i + 1}] ${a.name} -> ${a.url}`));
    }
    break;
  }

  case 'status': {
    if (!fs.existsSync(CACHE_FILE)) {
      console.log('Кэш отсутствует.');
      break;
    }
    const data = loadCache();
    const coursesCount = data.courses?.length || 0;
    const tasksCount = Object.values(data.assignments || {}).reduce((s, a) => s + (a?.length || 0), 0);
    console.log('\n--- СТАТУС МОСТА XIAS MCP ---');
    console.log('Файл кэша:', CACHE_FILE);
    console.log('Последняя синхронизация:', data.lastSynced);
    console.log('Курсов:', coursesCount);
    console.log('Заданий в базе:', tasksCount);
    console.log('Куки сессии:', data.cookies ? 'Активны' : 'Отсутствуют');
    break;
  }

  case 'refresh': {
    const data = loadCache();
    const cookies = args[1] || data.cookies;
    if (!cookies) {
      console.error('Нет сохраненных кук. Передайте строку кук: node cli.js refresh "JSESSIONID=..." или откройте портал в браузере.');
      process.exit(1);
    }
    console.log('Подключение к серверу КемГУ и сбор свежих заданий...');
    try {
      const { fetchLiveEiosData } = await import('./crawler.js');
      const live = await fetchLiveEiosData({ cookies });
      data.studentInfo = live.studentInfo;
      data.courses = live.courses;
      data.assignments = live.assignments;
      data.lastSynced = live.lastSynced;
      if (args[1]) data.cookies = args[1];
      fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), 'utf8');
      console.log('✓ Данные успешно обновлены напрямую с xiais.kemsu.ru!');
      const tasksCount = Object.values(data.assignments || {}).reduce((s, a) => s + (a?.length || 0), 0);
      console.log(`Обновлено курсов: ${data.courses.length}, заданий: ${tasksCount}`);
    } catch (err) {
      console.error('Ошибка обновления:', err.message);
      process.exit(1);
    }
    break;
  }

  default:
    console.log(`
Использование: node cli.js <команда>

Команды:
  student                 Показать информацию о студенте
  courses [фильтр]        Список всех дисциплин и прогресса
  tasks [--status=TODO]   Список заданий (фильтры: --status=TODO|REVIEW|DONE, --course=...)
  details <ID или имя>    Полные сведения о задании и ссылки на материалы
  refresh [cookies]       Автономно запросить сервер КемГУ и обновить список задач
  status                  Проверить статус синхронизации и актуальность кэша
`);
    break;
}
