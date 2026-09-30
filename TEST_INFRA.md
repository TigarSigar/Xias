# XIAS Test Infrastructure Specification

## 1. Overview & Test Philosophy
XIAS is a Chrome Extension (Manifest V3) for the KemSU student portal (InfoOUPro / EIOS) providing an Anti-Slop dashboard, automated session keep-alive, seamless SSO autologin, and TickTick Open API synchronization.

The test infrastructure follows an **opaque-box, requirement-driven testing philosophy** derived directly from `ORIGINAL_REQUEST.md` and `PROJECT.md`.
- Tests verify **observable behavior and interface contracts**, not internal implementation details.
- Tests are **strictly isolated**: each test sets up its own isolated environment (DOM tree, storage state, alarm registry) and cleans up afterwards.
- Tests are **adversarial**: edge cases, malformed HTML, missing dates, session timeouts, and encoding variances are verified.
- **Test Writer Boundary**: Test code only is created/modified. Implementation defects uncovered during test execution are cataloged and escalated to the implementing agent.

## 2. Test Runner & Environment
- **Runtime**: Node.js v24 (`v24.20.0`)
- **Harness**: Built-in `node:test` runner and `node:assert/strict` assertion library.
- **Zero External Dependencies**: The test environment runs directly without requiring external `npm install` or third-party test frameworks, ensuring rapid, hermetic, and deterministic test runs.
- **DOM & Chrome Emulation**: Lightweight, standard-compliant DOM fixtures and Chrome Extension MV3 API mocks in `tests/helpers/dom.js` and `tests/helpers/chrome_mock.js`.

### Running Tests
Execute the entire test suite via npm:
```bash
npm test
```
Or directly via Node.js:
```bash
node --test tests/*.test.js
```
Individual suites:
```bash
node --test tests/manifest.test.js
node --test tests/parser.test.js
node --test tests/autologin.test.js
node --test tests/keepalive.test.js
node --test tests/ticktick.test.js
node --test tests/anti_slop.test.js
```

## 3. Fixtures Inventory (`tests/fixtures/`)
Real-world, faithful HTML fixtures reflecting the exact DOM structures of the KemSU portal:

| Fixture File | Description | Key Elements Simulated |
|--------------|-------------|------------------------|
| `tests/fixtures/eios_login.html` | React login form at `eios.kemsu.ru/main` | Controlled inputs (`type="text"`, `type="password"`), submit button, React internal setters, error banner container |
| `tests/fixtures/xiais_npe.html` | Tomcat 500 error page at `xiais.kemsu.ru` | `Нет доступа! java.lang.NullPointerException` body, JSP stack trace, session expiration indicators |
| `tests/fixtures/xiais_courses.html` | Student discipline index table | Student header (FIO, Faculty, Specialty, Year), table of disciplines, scores, reporting types, task detail links |
| `tests/fixtures/xiais_tasks.html` | Discipline lab assignments table | Discipline title, category dividers ("Лабораторные работы", "Индивидуальные задания"), all 4 statuses (TODO, REVIEW, DONE, REWORK), deadlines, BRS scores, attachment links |

## 4. Test Suites Architecture

```
tests/
├── fixtures/
│   ├── eios_login.html       # React SSO login form fixture
│   ├── xiais_npe.html        # Apache Tomcat NPE session expiration fixture
│   ├── xiais_courses.html    # InfoOUPro student discipline table fixture
│   └── xiais_tasks.html      # InfoOUPro lab assignments table fixture
├── helpers/
│   ├── dom.js                # HTML parser & lightweight DOM engine with React setter support
│   └── chrome_mock.js        # Chrome Extension MV3 mocks (storage, alarms, runtime)
├── manifest.test.js          # MV3 schema, host permissions, script order, security checks
├── parser.test.js            # Table parsing, status categorizations, timezone-aware dates
├── autologin.test.js         # React input emulation, loop prevention, NPE session recovery
├── keepalive.test.js         # Background alarm, dual-origin pings, network fault tolerance
├── ticktick.test.js          # Payload formatting, tags, Novokuznetsk dueDate, deduplication
└── anti_slop.test.js         # Zero-emoji audit, vector SVG verification, neutral styling
```

## 5. Coverage Goals & Criteria

### F1: MV3 Core & Security (`manifest.test.js`)
- [x] Manifest format is strictly MV3 (`manifest_version: 3`).
- [x] Permissions include `storage` and `alarms`.
- [x] Host permissions include `*://*.kemsu.ru/*` and `https://api.ticktick.com/*`.
- [x] Script execution order: `content/parser.js` MUST precede `content/autologin.js`.
- [x] No hardcoded student credentials in manifest or repository source code.

### F2: Dual Keep-Alive Ping (`keepalive.test.js`)
- [x] Background alarm `xiasKeepAlivePing` registered with 5-minute interval.
- [x] Pings BOTH `xiais.kemsu.ru` and `eios.kemsu.ru` concurrently or sequentially.
- [x] Sends `X-Requested-With: XMLHttpRequest` and `credentials: include`.
- [x] Resilient to single-origin network failure without throwing uncaught exceptions.

### F3 & F4: Autologin & Session Recovery (`autologin.test.js`)
- [x] React input setter overrides prototype descriptor and triggers `input`, `change`, `blur` events.
- [x] Successful form submission triggers button click or form submit.
- [x] Infinite loop guard: stops when `xias_login_failed` is set or bad credential message detected.
- [x] NPE recovery: detects `NullPointerException`, preserves destination URL in `sessionStorage.xias_recovery_target`, initiates SSO redirect.

### F5: Resilient DOM Parser (`parser.test.js`)
- [x] Accurate page type classification (`XIAIS_INDEX`, `XIAIS_TASKS`, `XIAIS_SESSION_EXPIRED`, `EIOS_LOGIN`).
- [x] Student profile metadata extraction (FIO, Faculty, Specialty).
- [x] Full course table extraction with BRS score normalization.
- [x] Task table extraction with 4-state status mapping: `TODO`, `REVIEW`, `DONE`, `REWORK`.
- [x] Novokuznetsk (UTC+7) timezone preserved during deadline parsing.
- [x] Attachment file link extraction (PDF, DOCX).

### F8, F9, F10: TickTick Synchronization (`ticktick.test.js`)
- [x] Task payload conforms to TickTick Open API specification.
- [x] Tags are strictly `["КемГУ", "Лаба"]`.
- [x] `dueDate` formatted in ISO-8601 with Novokuznetsk time preservation.
- [x] Atomic deduplication via `chrome.storage.local.xiasSyncedTasks`.
- [x] Idempotency: duplicate sync requests for same task ID are rejected.

### Anti-Slop Standards (`anti_slop.test.js`)
- [x] Zero Unicode emoji characters across all production UI files (`ui.js`, `autologin.js`, `popup.html`, `popup.js`).
- [x] All interface icons are pure vector `<svg>` elements.
- [x] Neutral, professional styling palette without aggressive neon gradients.
