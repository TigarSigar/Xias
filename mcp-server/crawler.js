import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

export function parseStudentInfoHtml(html) {
  const $ = cheerio.load(html);
  const info = {};

  const fullText = $('body').text();
  const studentMatch = fullText.match(/Студент:\s*([^\n\r<]+)/i);
  if (studentMatch) info.name = studentMatch[1].trim();

  const facMatch = fullText.match(/Факультет:\s*([^\n\r<]+)/i);
  if (facMatch) info.faculty = facMatch[1].trim();

  const specMatch = fullText.match(/Специальность:\s*([^\n\r<]+)/i);
  if (specMatch) info.specialty = specMatch[1].trim();

  const yearMatch = fullText.match(/Учебный год:\s*([^\n\r<]+)/i);
  if (yearMatch) info.year = yearMatch[1].trim();

  return info;
}

export function parseCoursesHtml(html, baseUrl = 'https://xiais.kemsu.ru/proc/stud/') {
  const $ = cheerio.load(html);
  const courses = [];

  $('table[border="1"] tr, table.table tr').each((_, tr) => {
    const cells = $(tr).find('td');
    if (cells.length < 3) return;

    const rowText = $(tr).text();
    if (rowText.includes('Дисциплина') && rowText.includes('Преподаватель')) return;

    let name = '';
    let teacher = '';
    let tasksUrl = '';

    // Course title is usually in cell 1 (second cell)
    const titleCell = cells.eq(1);
    name = titleCell.find('b').text().trim() || titleCell.text().trim();

    // Teacher cell is usually cell 6 or cell with teacher name
    if (cells.length >= 7) {
      teacher = cells.eq(6).text().trim();
    }

    // Tasks link can be in the action cell or anywhere in row
    const link = $(tr).find('a[href*="task"], a[href*="course"], a[href*="tasks_st"]').first();
    if (link.length > 0) {
      const href = link.attr('href');
      if (href) {
        try {
          tasksUrl = new URL(href, baseUrl).href;
        } catch (e) {
          tasksUrl = href;
        }
      }
    } else {
      const anyLink = $(tr).find('a').first();
      if (anyLink.length > 0) {
        const href = anyLink.attr('href');
        if (href && !href.startsWith('javascript:')) {
          try {
            tasksUrl = new URL(href, baseUrl).href;
          } catch (e) {
            tasksUrl = href;
          }
        }
      }
    }

    if (name) {
      courses.push({
        name,
        teacher: teacher || 'Не указан',
        tasksUrl
      });
    }
  });

  return courses;
}

export function parseTasksHtml(html, courseName = '', teacher = '', baseUrl = 'https://xiais.kemsu.ru/proc/stud/course_st/') {
  const $ = cheerio.load(html);
  const assignments = [];

  $('table[border="1"] tr, table.table tr').each((idx, tr) => {
    const cells = $(tr).find('td');
    if (cells.length < 2) return;

    const rowText = $(tr).text();
    if (rowText.includes('Задание') && rowText.includes('Срок')) return;

    let title = cells.eq(0).text().trim();
    if (!title) return;

    // Filter out category header summary rows like "Лабораторные работы 1"
    const isPluralCategory = /^(Лабораторные работы|Практические работы|Контрольные работы)\s*\d*$/i.test(title);
    const hasActionOrState = $(tr).find('a[href*="send_task"], a[href*="file"], input, form').length > 0;
    if (isPluralCategory && !hasActionOrState) return;

    let deadlineRaw = '';
    let comment = '';
    let maxScore = '';
    let resultScore = '';
    let actionUrl = '';
    const attachments = [];

    // Find links in row
    $(tr).find('a').each((_, a) => {
      const href = $(a).attr('href') || '';
      const text = $(a).text().trim();

      if (href.includes('send_task')) {
        try {
          actionUrl = new URL(href, baseUrl).href;
        } catch (e) {
          actionUrl = href;
        }
      } else if (href.includes('file') || href.includes('.pdf') || href.includes('.doc') || href.includes('.zip')) {
        try {
          attachments.push({
            name: text || path.basename(href) || 'Материалы задания',
            url: new URL(href, baseUrl).href
          });
        } catch (e) {
          attachments.push({ name: text, url: href });
        }
      }
    });

    // Extract deadline from cells
    cells.each((_, c) => {
      const text = $(c).text().trim();
      const dateMatch = text.match(/\d{2}\.\d{2}\.\d{4}(?:\s+\d{2}:\d{2})?/);
      if (dateMatch && !deadlineRaw) {
        deadlineRaw = dateMatch[0];
      }
    });

    // Detect status
    let status = 'TODO';
    let statusLabel = 'Нужно сделать';
    const lowerText = rowText.toLowerCase();

    if (lowerText.includes('зачтено') || lowerText.includes('принято') || lowerText.includes('сдано') || lowerText.includes('5/') || lowerText.includes('отлично')) {
      status = 'DONE';
      statusLabel = 'Сдано';
    } else if (lowerText.includes('на проверке') || lowerText.includes('проверяется') || lowerText.includes('отправлено')) {
      status = 'REVIEW';
      statusLabel = 'На проверке';
    } else if (lowerText.includes('доработка') || lowerText.includes('переделать') || lowerText.includes('исправить')) {
      status = 'REWORK';
      statusLabel = 'На доработке';
    }

    const uniqueId = `task_${Math.abs(hashString(`${courseName}_${title}`))}`;

    assignments.push({
      uniqueId,
      title,
      courseName,
      teacher: teacher || '',
      category: 'Лабораторные работы',
      comment,
      deadlineRaw,
      deadlineISO: parseDeadlineISO(deadlineRaw),
      maxScore,
      resultScore,
      status,
      statusLabel,
      actionUrl,
      attachments
    });
  });

  return assignments;
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function parseDeadlineISO(str) {
  if (!str) return null;
  const m = str.match(/(\d{2})\.(\d{2})\.(\d{4})(?:\s+(\d{2}):(\d{2}))?/);
  if (!m) return null;
  const day = m[1];
  const month = m[2];
  const year = m[3];
  const hour = m[4] || '23';
  const min = m[5] || '59';
  // KemSU timezone is Asia/Novokuznetsk (UTC+7)
  return `${year}-${month}-${day}T${hour}:${min}:00+07:00`;
}

// Live fetcher
export async function fetchLiveEiosData({ cookies }) {
  if (!cookies) {
    throw new Error('Нет активных кук сессии. Откройте ИнфоОУПро в Chrome или укажите куки.');
  }

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Cookie': cookies
  };

  // 1. Fetch main index
  const indexRes = await fetch('https://xiais.kemsu.ru/proc/stud/index.shtm', { headers });
  if (!indexRes.ok) {
    throw new Error(`Ошибка ответа xiais.kemsu.ru: HTTP ${indexRes.status}`);
  }

  const indexBuf = await indexRes.arrayBuffer();
  const indexHtml = new TextDecoder('windows-1251').decode(indexBuf);

  if (indexHtml.includes('NullPointerException') || indexHtml.includes('авторизация') || indexHtml.includes('Вход')) {
    throw new Error('Сессия ЭИОС устарела. Требуется повторный вход на портал.');
  }

  const studentInfo = parseStudentInfoHtml(indexHtml);
  const courses = parseCoursesHtml(indexHtml);
  const assignments = {};

  // 2. Fetch assignments for each course
  for (const course of courses) {
    if (!course.tasksUrl) continue;
    try {
      const cRes = await fetch(course.tasksUrl, { headers });
      if (cRes.ok) {
        const cBuf = await cRes.arrayBuffer();
        const cHtml = new TextDecoder('windows-1251').decode(cBuf);
        const tasks = parseTasksHtml(cHtml, course.name, course.teacher);
        if (tasks.length > 0) {
          assignments[course.name] = tasks;
        }
      }
    } catch (err) {
      console.error(`[Crawler] Ошибка получения заданий по ${course.name}:`, err.message);
    }
  }

  return {
    studentInfo,
    courses,
    assignments,
    lastSynced: new Date().toISOString()
  };
}
