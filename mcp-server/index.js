import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { fetchLiveEiosData } from './crawler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const CACHE_FILE = path.join(DATA_DIR, 'eios_cache.json');
const DOWNLOADS_DIR = path.join(__dirname, '..', 'downloads');
const SYNC_PORT = parseInt(process.env.XIAS_MCP_PORT || '38421', 10);

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

// In-memory state
let state = {
  studentInfo: null,
  courses: [],
  assignments: {},
  cookies: '',
  lastSynced: null
};

// Load initial cache from disk
function loadCacheFromDisk() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const raw = fs.readFileSync(CACHE_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      state = {
        studentInfo: parsed.studentInfo || null,
        courses: parsed.courses || [],
        assignments: parsed.assignments || {},
        cookies: parsed.cookies || '',
        lastSynced: parsed.lastSynced || null
      };
      console.error(`[EIOS MCP] Loaded cache from disk: ${state.courses.length} courses, ${countAllAssignments()} assignments.`);
    }
  } catch (err) {
    console.error('[EIOS MCP] Error loading cache file:', err.message);
  }
}

function saveCacheToDisk() {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.error('[EIOS MCP] Error saving cache to disk:', err.message);
  }
}

function countAllAssignments() {
  return Object.values(state.assignments || {}).reduce((acc, list) => acc + (Array.isArray(list) ? list.length : 0), 0);
}

function getStats() {
  let totalTasks = 0;
  let todoTasks = 0;
  let reviewTasks = 0;
  let doneTasks = 0;
  let reworkTasks = 0;

  for (const list of Object.values(state.assignments || {})) {
    if (!Array.isArray(list)) continue;
    for (const task of list) {
      totalTasks++;
      if (task.status === 'TODO') todoTasks++;
      else if (task.status === 'REVIEW') reviewTasks++;
      else if (task.status === 'DONE') doneTasks++;
      else if (task.status === 'REWORK') reworkTasks++;
    }
  }

  return {
    totalCourses: state.courses ? state.courses.length : 0,
    totalTasks,
    todoTasks,
    reviewTasks,
    doneTasks,
    reworkTasks
  };
}

loadCacheFromDisk();

// 1. HTTP Server for live sync from the XIAS Chrome extension
const httpServer = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://127.0.0.1:${SYNC_PORT}`);

  if (req.method === 'POST' && url.pathname === '/api/sync') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 50 * 1024 * 1024) { // 50MB limit
        req.destroy();
      }
    });

    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        if (payload.studentInfo) state.studentInfo = payload.studentInfo;
        if (Array.isArray(payload.courses) && payload.courses.length > 0) state.courses = payload.courses;
        if (payload.assignments && typeof payload.assignments === 'object') {
          state.assignments = { ...state.assignments, ...payload.assignments };
        }
        if (payload.cookies) state.cookies = payload.cookies;
        state.lastSynced = new Date().toISOString();

        saveCacheToDisk();

        const stats = getStats();
        console.error(`[EIOS MCP Sync] Received live sync from XIAS extension! Courses: ${stats.totalCourses}, Tasks: ${stats.totalTasks} (TODO: ${stats.todoTasks}).`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          ok: true,
          message: 'Data successfully synced with EIOS MCP Server',
          stats,
          lastSynced: state.lastSynced
        }));
      } catch (err) {
        console.error('[EIOS MCP Sync] Error processing sync payload:', err);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ok: true,
      service: 'KemSU EIOS MCP Bridge',
      version: '1.0.0',
      lastSynced: state.lastSynced,
      stats: getStats()
    }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

httpServer.listen(SYNC_PORT, '127.0.0.1', () => {
  console.error(`[EIOS MCP] HTTP Sync Server listening on http://127.0.0.1:${SYNC_PORT}`);
});

httpServer.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[EIOS MCP] Port ${SYNC_PORT} is already in use by another instance. Continuing in stdio mode.`);
  } else {
    console.error('[EIOS MCP] HTTP Server error:', err.message);
  }
});

// 2. Initialize Model Context Protocol (MCP) Server
const mcpServer = new McpServer({
  name: 'kemsu-eios',
  version: '1.0.0'
});

// Tool 1: eios_get_student_info
mcpServer.tool(
  'eios_get_student_info',
  'Get authenticated KemSU student profile information (name, group, faculty, study year, semester) and overall task completion statistics.',
  {},
  async () => {
    const stats = getStats();
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          student: state.studentInfo || { status: 'Not yet synced from browser' },
          lastSynced: state.lastSynced,
          statistics: stats,
          cookieActive: !!state.cookies
        }, null, 2)
      }]
    };
  }
);

// Tool 2: eios_list_courses
mcpServer.tool(
  'eios_list_courses',
  'List all university academic disciplines/courses with assigned teachers, task progress (todo, review, done, rework), and task URLs.',
  {
    search: z.string().optional().describe('Optional query to filter courses by title or teacher name')
  },
  async ({ search }) => {
    let list = (state.courses || []).map(course => {
      const courseAssignments = state.assignments[course.name] || [];
      const stats = {
        total: courseAssignments.length,
        todo: courseAssignments.filter(a => a.status === 'TODO').length,
        review: courseAssignments.filter(a => a.status === 'REVIEW').length,
        done: courseAssignments.filter(a => a.status === 'DONE').length,
        rework: courseAssignments.filter(a => a.status === 'REWORK').length
      };
      return {
        name: course.name,
        teacher: course.teacher || 'Не указан',
        stats,
        tasksUrl: course.tasksUrl || ''
      };
    });

    if (search && search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.teacher.toLowerCase().includes(q));
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          totalCourses: list.length,
          courses: list
        }, null, 2)
      }]
    };
  }
);

// Tool 3: eios_get_tasks
mcpServer.tool(
  'eios_get_tasks',
  'List assignments, labs, and homework tasks with comprehensive filters (status, course, search) and deadline sorting.',
  {
    status: z.enum(['all', 'TODO', 'REVIEW', 'DONE', 'REWORK']).optional().describe('Filter by assignment status (default: all)'),
    course: z.string().optional().describe('Filter by course/discipline name (case-insensitive substring)'),
    search: z.string().optional().describe('Filter by task title or comment keywords'),
    limit: z.number().optional().describe('Maximum number of tasks to return (default: 50)')
  },
  async ({ status, course, search, limit }) => {
    let tasks = [];

    for (const [courseName, list] of Object.entries(state.assignments || {})) {
      if (!Array.isArray(list)) continue;
      for (const t of list) {
        tasks.push({
          uniqueId: t.uniqueId,
          courseName,
          title: t.title,
          teacher: t.teacher || '',
          category: t.category || '',
          deadlineRaw: t.deadlineRaw || '',
          deadlineISO: t.deadlineISO || '',
          status: t.status || 'TODO',
          statusLabel: t.statusLabel || '',
          maxScore: t.maxScore || '',
          resultScore: t.resultScore || '',
          hasMaterials: (t.attachments && t.attachments.length > 0),
          materialsCount: (t.attachments || []).length,
          actionUrl: t.actionUrl || ''
        });
      }
    }

    if (status && status !== 'all') {
      tasks = tasks.filter(t => t.status === status);
    }

    if (course && course.trim()) {
      const cq = course.toLowerCase();
      tasks = tasks.filter(t => t.courseName.toLowerCase().includes(cq));
    }

    if (search && search.trim()) {
      const sq = search.toLowerCase();
      tasks = tasks.filter(t => t.title.toLowerCase().includes(sq) || (t.teacher && t.teacher.toLowerCase().includes(sq)));
    }

    // Sort by deadlineISO ascending if present, placing missing deadlines at end
    tasks.sort((a, b) => {
      if (!a.deadlineISO) return 1;
      if (!b.deadlineISO) return -1;
      return new Date(a.deadlineISO) - new Date(b.deadlineISO);
    });

    const maxItems = limit && limit > 0 ? limit : 50;
    const paginated = tasks.slice(0, maxItems);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          matchedTotal: tasks.length,
          returned: paginated.length,
          tasks: paginated
        }, null, 2)
      }]
    };
  }
);

// Tool 4: eios_get_task_details
mcpServer.tool(
  'eios_get_task_details',
  'Get full metadata, instructions, downloadable materials/files, and submission details for a specific task.',
  {
    taskId: z.string().optional().describe('Unique ID of the task (e.g., from eios_get_tasks)'),
    taskTitle: z.string().optional().describe('Title of the task to search for'),
    courseName: z.string().optional().describe('Discipline name to narrow search')
  },
  async ({ taskId, taskTitle, courseName }) => {
    let matchedTask = null;
    let matchedCourse = '';

    for (const [cName, list] of Object.entries(state.assignments || {})) {
      if (courseName && !cName.toLowerCase().includes(courseName.toLowerCase())) continue;
      if (!Array.isArray(list)) continue;
      for (const t of list) {
        if (taskId && t.uniqueId === taskId) {
          matchedTask = t;
          matchedCourse = cName;
          break;
        }
        if (taskTitle && t.title.toLowerCase().includes(taskTitle.toLowerCase())) {
          matchedTask = t;
          matchedCourse = cName;
          break;
        }
      }
      if (matchedTask) break;
    }

    if (!matchedTask) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: 'Task not found with specified criteria',
            query: { taskId, taskTitle, courseName }
          }, null, 2)
        }]
      };
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          task: {
            ...matchedTask,
            courseName: matchedCourse
          }
        }, null, 2)
      }]
    };
  }
);

// Tool 5: eios_download_material
mcpServer.tool(
  'eios_download_material',
  'Download attached assignment materials (PDF, DOCX, ZIP guidelines) from KemSU to local disk so the agent can read and analyze them.',
  {
    url: z.string().describe('The URL of the file to download (from task.attachments)'),
    filename: z.string().optional().describe('Optional custom filename to save as')
  },
  async ({ url, filename }) => {
    try {
      let targetUrl = url;
      if (!targetUrl.startsWith('http')) {
        targetUrl = new URL(targetUrl, 'https://xiais.kemsu.ru/proc/stud/course_st/').href;
      }

      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      };
      if (state.cookies) {
        headers['Cookie'] = state.cookies;
      }

      console.error(`[EIOS MCP] Downloading material: ${targetUrl}`);
      const res = await fetch(targetUrl, { headers });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}: ${res.statusText}`);
      }

      // Determine filename
      let saveName = filename;
      if (!saveName) {
        const cd = res.headers.get('content-disposition');
        if (cd && cd.includes('filename=')) {
          const match = cd.match(/filename\*?=['"]?(?:UTF-8'')?([^'";]+)['"]?/i);
          if (match) saveName = decodeURIComponent(match[1]);
        }
      }
      if (!saveName) {
        const urlObj = new URL(targetUrl);
        saveName = path.basename(urlObj.pathname) || `material_${Date.now()}.bin`;
      }

      // Clean name
      saveName = saveName.replace(/[<>:"/\\|?*]/g, '_');
      const savePath = path.join(DOWNLOADS_DIR, saveName);

      const arrayBuffer = await res.arrayBuffer();
      fs.writeFileSync(savePath, Buffer.from(arrayBuffer));

      console.error(`[EIOS MCP] File saved successfully: ${savePath} (${arrayBuffer.byteLength} bytes)`);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            filePath: savePath,
            fileName: saveName,
            sizeBytes: arrayBuffer.byteLength,
            message: `File downloaded and saved to disk. Agent can now inspect with view_file tool.`
          }, null, 2)
        }]
      };
    } catch (err) {
      console.error('[EIOS MCP] Download error:', err);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: err.message
          }, null, 2)
        }]
      };
    }
  }
);

// Tool 6: eios_submit_solution
mcpServer.tool(
  'eios_submit_solution',
  'Submit a completed solution file (DOCX, ZIP) directly to KemSU ИнфоОУПро for a given task.',
  {
    taskId: z.string().optional().describe('Unique ID of the task'),
    taskTitle: z.string().optional().describe('Title of the task'),
    courseName: z.string().optional().describe('Course name'),
    filePath: z.string().describe('Absolute local filesystem path to the file (DOCX or ZIP) to upload'),
    solutionTitle: z.string().optional().describe('Title of the work/solution to submit in the form'),
    comment: z.string().optional().describe('Optional student comment/note to teacher')
  },
  async ({ taskId, taskTitle, courseName, filePath, solutionTitle, comment }) => {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File does not exist at path: ${filePath}`);
      }

      // Locate task
      let targetTask = null;
      let targetCourse = '';
      for (const [cName, list] of Object.entries(state.assignments || {})) {
        if (courseName && !cName.toLowerCase().includes(courseName.toLowerCase())) continue;
        if (!Array.isArray(list)) continue;
        for (const t of list) {
          if (taskId && t.uniqueId === taskId) {
            targetTask = t;
            targetCourse = cName;
            break;
          }
          if (taskTitle && t.title.toLowerCase().includes(taskTitle.toLowerCase())) {
            targetTask = t;
            targetCourse = cName;
            break;
          }
        }
        if (targetTask) break;
      }

      if (!targetTask) {
        throw new Error(`Target assignment could not be identified with given parameters.`);
      }

      if (!targetTask.actionUrl) {
        throw new Error(`Assignment "${targetTask.title}" has no actionUrl configured for submission.`);
      }

      let uploadUrl = targetTask.actionUrl;
      if (!uploadUrl.startsWith('http')) {
        uploadUrl = new URL(uploadUrl, 'https://xiais.kemsu.ru/proc/stud/course_st/').href;
      }
      uploadUrl = uploadUrl.replace(/^http:/i, 'https:');

      const fileBuffer = fs.readFileSync(filePath);
      const fileName = path.basename(filePath);

      const formData = new FormData();
      formData.append('name', solutionTitle || targetTask.title);
      if (comment) formData.append('comment', comment);
      formData.append('sub', 'Загрузить');
      formData.append('userfile', new Blob([fileBuffer]), fileName);

      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      };
      if (state.cookies) {
        headers['Cookie'] = state.cookies;
      }

      console.error(`[EIOS MCP] Submitting solution for "${targetTask.title}" to ${uploadUrl}`);
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers,
        body: formData,
        redirect: 'manual'
      });

      const isSuccess = res.ok || res.type === 'opaqueredirect' || res.status === 302 || res.status === 200 || res.status === 0;

      if (isSuccess) {
        targetTask.status = 'REVIEW';
        targetTask.statusLabel = 'На проверке';
        saveCacheToDisk();

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              taskTitle: targetTask.title,
              courseName: targetCourse,
              uploadedFile: fileName,
              status: 'REVIEW',
              statusLabel: 'На проверке',
              message: 'Solution successfully uploaded to KemSU ЭИОС ИнфоОУПро!'
            }, null, 2)
          }]
        };
      } else {
        throw new Error(`EIOS returned HTTP ${res.status}: ${res.statusText}`);
      }
    } catch (err) {
      console.error('[EIOS MCP] Submission error:', err);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: err.message
          }, null, 2)
        }]
      };
    }
  }
);

// Tool 7: eios_sync_status
mcpServer.tool(
  'eios_sync_status',
  'Check the bridge connection status, session cookie validity, and latest data timestamp from the XIAS extension.',
  {},
  async () => {
    const stats = getStats();
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          status: 'online',
          port: SYNC_PORT,
          lastSynced: state.lastSynced || 'Never (open XIAS dashboard in browser)',
          cookiesConfigured: !!state.cookies,
          summary: stats,
          tip: 'To update EIOS data, simply open or refresh https://xiais.kemsu.ru/proc/stud/index.shtm in Google Chrome.'
        }, null, 2)
      }]
    };
  }
);

// Tool 8: eios_refresh_data
mcpServer.tool(
  'eios_refresh_data',
  'Connect directly to KemSU ЭИОС (xiais.kemsu.ru) in background, crawl all courses, parse pending tasks and materials, and refresh the local cache autonomously.',
  {
    cookies: z.string().optional().describe('Optional fresh cookie string; if omitted, uses the stored session cookie')
  },
  async ({ cookies }) => {
    const cookieToUse = cookies || state.cookies;
    if (!cookieToUse) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'Нет активной сессии (кук). Откройте страницу ИнфоОУПро в Google Chrome или передайте строку Cookie.'
          }, null, 2)
        }]
      };
    }
    try {
      console.error('[EIOS MCP] Fetching live data from xiais.kemsu.ru...');
      const liveData = await fetchLiveEiosData({ cookies: cookieToUse });
      if (liveData.studentInfo) state.studentInfo = liveData.studentInfo;
      if (liveData.courses) state.courses = liveData.courses;
      if (liveData.assignments) state.assignments = liveData.assignments;
      state.lastSynced = liveData.lastSynced;
      if (cookies) state.cookies = cookies;
      saveCacheToDisk();

      const stats = getStats();
      console.error(`[EIOS MCP] Live crawl completed! Total courses: ${stats.totalCourses}, Tasks: ${stats.totalTasks} (TODO: ${stats.todoTasks})`);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'Данные ЭИОС успешно обновлены напрямую с сервера КемГУ!',
            stats,
            lastSynced: state.lastSynced
          }, null, 2)
        }]
      };
    } catch (err) {
      console.error('[EIOS MCP] Live crawl failed:', err);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: err.message
          }, null, 2)
        }]
      };
    }
  }
);

// Tool 9: eios_export_snapshot
mcpServer.tool(
  'eios_export_snapshot',
  'Export the full raw JSON dataset containing all parsed courses, assignments, and student metadata.',
  {},
  async () => {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          studentInfo: state.studentInfo,
          courses: state.courses,
          assignments: state.assignments,
          lastSynced: state.lastSynced
        }, null, 2)
      }]
    };
  }
);

// 3. Connect to Stdio Transport
const transport = new StdioServerTransport();
await mcpServer.connect(transport);
console.error('[EIOS MCP] Model Context Protocol server successfully initialized on stdio.');
