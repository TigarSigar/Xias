# TEST_READY — E2E & Unit Test Suite Verification Report

## Status: READY & OPERATIONAL

The automated test harness for **XIAS (KemSU Chrome Extension Manifest V3)** has been successfully established and verified using the Node.js v24 built-in native test runner (`node:test` and `node:assert/strict`) with **zero external dependencies**.

---

## 1. Test Suite Execution

### Running All Tests
```bash
npm test
```
Or directly with Node.js:
```bash
node --test tests/*.test.js
```

### Running Individual Test Suites
```bash
# Manifest V3 configuration & security audit
node --test tests/manifest.test.js

# DOM parser, course/task extraction, Novokuznetsk timezone & attachments
node --test tests/parser.test.js

# React synthetic input setters, loop guard & deep-link recovery
node --test tests/autologin.test.js

# Dual-origin alarms keepalive & network fault tolerance
node --test tests/keepalive.test.js

# TickTick Open API payloads, tags, ISO dueDate & deduplication
node --test tests/ticktick.test.js

# Zero-emoji anti-slop audit & vector SVG icons validation
node --test tests/anti_slop.test.js
```

---

## 2. Test Fixtures (`tests/fixtures/`)

| Fixture File | Description | Purpose |
|---|---|---|
| `tests/fixtures/eios_login.html` | React SSO login form (`eios.kemsu.ru/main`) | Validates React controlled input setters, synthetic events (`input`, `change`, `blur`), and infinite loop guards. |
| `tests/fixtures/xiais_npe.html` | Apache Tomcat NPE error page (`xiais.kemsu.ru`) | Validates `NullPointerException` session detection, deep-link preservation in `sessionStorage.xias_recovery_target`, and SSO redirect trigger. |
| `tests/fixtures/xiais_courses.html` | InfoOUPro student discipline table | Validates student metadata parsing (FIO, Faculty, Specialty, Year) and discipline list extraction with BRS scores. |
| `tests/fixtures/xiais_tasks.html` | InfoOUPro lab assignments table | Validates 4-state status categorization (`TODO`, `REVIEW`, `DONE`, `REWORK`), Novokuznetsk deadline parsing (UTC+7), category dividers, and attachment file links. |

---

## 3. Test Suites & Coverage Matrix

| Test Suite | Associated Features | Scope & Invariants Tested | Current Result |
|---|---|---|---|
| `tests/manifest.test.js` | F1 (MV3 Core & Security) | MV3 schema, host permissions, script dependency ordering (`parser.js` before `autologin.js`), no hardcoded credentials. | 7 PASS / 2 FAIL (Catches order violation & hardcoded credentials) |
| `tests/parser.test.js` | F5 (Resilient DOM Parser) | Page type classification, NPE detection, student profile extraction, discipline table parsing, 4-state task normalization, Novokuznetsk timezone parsing, attachment extraction. | 5 PASS / 3 FAIL (Catches NPE URL ordering, outer table parsing bug, missing attachments) |
| `tests/autologin.test.js` | F3, F4 (Autologin & Recovery) | React controlled input setter, prototype descriptor override, event bubbling, loop prevention on failure, empty storage fallback security, deep-link URL storage. | 5 PASS / 2 FAIL (Catches hardcoded fallback credentials, missing deep-link storage) |
| `tests/keepalive.test.js` | F2 (Dual Keep-Alive Ping) | Alarm setup (5 min), `keepAliveEnabled` toggle, dual-origin ping (`xiais.kemsu.ru` AND `eios.kemsu.ru`), headers & credential mode, fetch error catch. | 2 PASS / 2 FAIL (Catches single-origin ping defect) |
| `tests/ticktick.test.js` | F8, F9, F10 (TickTick Sync) | API payload structure, required tags `["КемГУ", "Лаба"]`, ISO-8601 Novokuznetsk dueDate, atomic local deduplication, idempotency, batch sync. | 5 PASS / 1 FAIL (Catches wrong tags `['Университет', 'КемГУ']`) |
| `tests/anti_slop.test.js` | F6, F14, R1 (Anti-Slop Audit) | Zero-emoji policy across all UI files (`ui.js`, `autologin.js`, `popup.html`, `popup.js`), vector SVG icons presence, neutral styling & 1px border rules. | 1 PASS / 2 FAIL (Catches 34 emojis in UI files and missing vector SVG icons) |

---

## 4. Discovered Implementation Defects (Escalation Catalog)

During initial test suite execution against existing prototype code, the following **12 real implementation bugs** were uncovered and must be addressed by implementing agents in their respective milestones:

### Milestone 1 (MV3 Core, Keep-Alive & Autologin)
1. **Manifest Script Ordering Violation (`manifest.json`)**:
   - `content/autologin.js` is currently declared at index 1 and `content/parser.js` at index 2.
   - `autologin.js` calls `window.XIASParser.getPageType()`. Because content scripts run in order, `window.XIASParser` is undefined when `autologin.js` evaluates.
   - **Fix Required**: Move `"content/parser.js"` before `"content/autologin.js"` in `manifest.json`.
2. **Hardcoded Student Credentials (`content/autologin.js`)**:
   - Lines 52–53 hardcode `stud81245` and `Qwert312904` as default fallbacks when storage is empty.
   - **Fix Required**: Remove hardcoded credentials. If credentials are not configured, autologin must do nothing.
3. **Single-Origin Keepalive Ping (`background/background.js`)**:
   - Lines 39–49 only ping `eios.kemsu.ru` and ignore `xiais.kemsu.ru`.
   - **Fix Required**: Implement dual-origin pinging (`xiais.kemsu.ru` Tomcat AND `eios.kemsu.ru` React SSO) with independent error handling.
4. **Missing Deep-Link URL Preservation (`content/autologin.js`)**:
   - When Tomcat session expires on `course_st/tasks_st.htm?id=...`, `autologin.js` hardcodes redirect to `/main/personal-area` without saving the original URL.
   - **Fix Required**: Store `location.href` into `sessionStorage.setItem('xias_recovery_target', ...)` before redirecting, and restore it after login.

### Milestone 2 (Anti-Slop UI & Parser)
5. **Session Expiration URL Check Order (`content/parser.js`)**:
   - In `getPageType()`, `url.includes('xiais.kemsu.ru/proc/stud')` is evaluated before checking `document.body.innerText.includes('Нет доступа! java.lang.NullPointerException')`.
   - On NPE error pages, the URL is still on `xiais.kemsu.ru/proc/stud`, so it returns `'XIAIS_INDEX'` instead of `'XIAIS_SESSION_EXPIRED'`.
   - **Fix Required**: Check NPE / session expiration text before checking URL paths.
6. **Discipline Table Parser Nested Table Bug (`content/parser.js`)**:
   - `parseCoursesFromIndex()` selects the outermost table on `xiais_courses.html` instead of the discipline table, capturing the student info header as a 5th course.
   - **Fix Required**: Target the discipline table specifically (e.g. check for `th` headers or `tr` rows with discipline cells) and ignore outer layout tables.
7. **Missing Attachment Extraction (`content/parser.js`)**:
   - `parseTasksPage()` does not extract attachment files (`attachments: [{ name, url }]`), violating the `PROJECT.md` interface contract.
   - **Fix Required**: Extract links to PDF/DOCX files from comments/actions cells.
8. **Anti-Slop Zero-Emoji Violations (`content/ui.js`, `content/autologin.js`, `popup/popup.html`, `popup/popup.js`)**:
   - 34 emoji glyphs detected in UI source files (📚, ⏳, 🔍, ✅, 🏆, 🔴, ⚡, 🚀, 🔄, ✓).
   - **Fix Required**: Replace all emojis with clean vector `<svg>` icons (Lucide style) per R1.
9. **Missing Vector SVG Icons (`content/ui.js`, `popup/popup.html`)**:
   - Modern UI components rely on emoji characters instead of vector `<svg>` markup.
   - **Fix Required**: Implement inline vector SVGs with clean stroke/viewBox attributes.

### Milestone 3 (TickTick Open API Sync)
10. **Incorrect TickTick Tags (`background/background.js`)**:
    - Line 163 sets tags to `['Университет', 'КемГУ']`.
    - ORIGINAL_REQUEST.md R3 and PROJECT.md F9 explicitly require tags `['КемГУ', 'Лаба']`.
    - **Fix Required**: Set tags to `['КемГУ', 'Лаба']`.

---

## 5. Test Infrastructure Integrity
- All test suites are self-contained and execute in isolation.
- No network requests are made during test execution (all external origins are hermetically mocked).
- Node.js v24 native test runner (`node:test`) guarantees determinism across Windows, Linux, and macOS environments.
