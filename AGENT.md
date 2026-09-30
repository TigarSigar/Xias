# AGENT.md — Инструкции для AI-агента (XIAS / ЭИОС+ КемГУ)

> Этот файл описывает архитектуру проекта, рабочие процессы и правила,
> которым должен следовать AI-агент при продолжении разработки.

---

## Проект: XIAS — ЭИОС+ КемГУ

Браузерное расширение Chrome (Manifest V3) + локальный MCP-сервер для автоматизации
работы с порталом КемГУ (ИнфоОУПро / xiais.kemsu.ru).

---

## Структура репозитория

```
XIAS/
├── manifest.json              # Chrome Extension Manifest V3
├── background/
│   └── background.js          # Service worker: keep-alive, tab tracking, TickTick sync
├── content/
│   ├── parser.js              # DOM-парсер курсов, заданий, статусов
│   ├── ui.js                  # Основной UI: панель XIAS, модальное окно сдачи работ
│   ├── autologin.js           # Бесшовный SSO-автологин и восстановление сессии
│   ├── ticktick_client.js     # Интеграция с TickTick API
│   ├── zip_helper.js          # Авто-ZIP при загрузке нескольких файлов
│   ├── content.js             # Точка входа контент-скрипта
│   └── styles.css             # Стили панели XIAS
├── popup/
│   └── popup.html             # Страница настроек расширения
├── icons/                     # PNG-иконки расширения
├── mcp-server/
│   ├── index.js               # MCP-сервер (9 инструментов) + HTTP sync bridge :38421
│   ├── crawler.js             # Server-side HTML crawler (без браузера, windows-1251)
│   ├── cli.js                 # CLI: node cli.js [student|courses|tasks|details|refresh|status]
│   ├── package.json           # Зависимости: @modelcontextprotocol/sdk, cheerio, zod
│   ├── .env.example           # Пример переменных окружения
│   ├── README.md              # Инструкции для пользователей
│   └── data/
│       └── eios_cache.json    # Локальный кэш (создаётся при первом sync)
├── tests/                     # Jest unit-тесты
├── downloads/                 # Загружаемые материалы заданий (gitignored)
├── AGENT.md                   # Этот файл
└── README.md                  # Общая документация
```

---

## Как работает система

### 1. Chrome Extension

Контент-скрипты выполняются на всех страницах `*.kemsu.ru`.

**Поток данных:**
1. `parser.js` — парсит страницы ИнфоОУПро (windows-1251, старый Tomcat)
2. `ui.js` — строит панель поверх портала, управляет модальным окном сдачи работ
3. `autologin.js` — отслеживает разлогин и автоматически восстанавливает SSO-сессию
4. `ui.js::syncToLocalMcpServer()` — POST на `http://127.0.0.1:38421/api/sync` передаёт
   данные (курсы, задания, куки) в MCP-сервер

### 2. SSO-авторизация КемГУ (важно!)

КемГУ использует двухслойную систему:
- `eios.kemsu.ru` — React SPA (Vite), работает с `api-next.kemsu.ru/api`
- `xiais.kemsu.ru` — старый Tomcat (windows-1251), требует JSESSIONID

**Схема авторизации (автологин):**
```
eios.kemsu.ru/main (логин SPA)
  → POST api-next.kemsu.ru/api/security/auth/auth
  → xiais.kemsu.ru/dekanat/eios-next-bridge/auth.htm (iframe)
    → POST xiais.kemsu.ru/dekanat/restricted/index_next.htm (login+password)
    → Set-Cookie: JSESSIONID=... (Tomcat session)
  → Бесшовный переход в /proc/stud/
```

**Ключевой факт:** JSESSIONID от `index_next.htm` даёт доступ к `/proc/stud/`,
НО при прямых fetch-запросах (вне браузерного контекста) сессия получает
`NullPointerException` на `/proc/stud/index.shtm`, т.к. Tomcat привязывает
контекст студента к конкретному соединению браузера.

**Вывод:** Надёжная сдача файлов возможна только через Chrome (с активной сессией),
а не через прямые HTTP-запросы из Node.js.

### 3. MCP-сервер (`mcp-server/`)

Локальный сервер ModelContextProtocol для AI-агентов (Antigravity, Claude, etc.).

**Запуск:**
```bash
cd mcp-server
npm install
node index.js
```

**Порты:**
- MCP stdio — стандартный MCP-транспорт для агентов
- HTTP `:38421` — REST bridge для sync из расширения

**9 инструментов:**
| Инструмент | Назначение |
|---|---|
| `eios_get_student_info` | Имя, факультет, специальность |
| `eios_list_courses` | Список курсов с URL заданий |
| `eios_get_tasks` | Задания с фильтрами (status, course, deadline) |
| `eios_get_task_details` | Детали конкретного задания |
| `eios_download_material` | Скачать методичку/материал задания |
| `eios_submit_solution` | Сдать файл решения (требует куки из браузера!) |
| `eios_refresh_data` | Принудительный live-краулинг через куки |
| `eios_sync_status` | Статус сервера, статистика |
| `eios_export_snapshot` | JSON-снимок всех данных |

### 4. Сдача работ через расширение (ui.js)

Полная цепочка при нажатии «Отправить»:
1. Получить `actionUrl` задания (из `tasks_st.htm?id=XXX`)
2. Загрузить форму `send_task.htm?id=XXX` через fetch (windows-1251 decode)
3. Собрать FormData: hidden inputs + `name` + `sub=Загрузить` + `userfile=<blob>`
4. POST с `redirect: 'manual'` (избегает зависания на 302 HTTP→HTTPS)
5. Статус 302 или 200 = успех

---

## Правила для агента

### Обязательные

1. **Никогда не коммить секреты.** `eiosLogin`, `eiosPassword`, реальный `JSESSIONID`,
   личные данные студента — только в `chrome.storage.local` или `.env` (gitignored).

2. **Нет эмодзи (Zero-Emoji / Anti-Slop).** Весь UI, логи, комментарии — только
   чистая типографика и SVG-иконки. Никаких ✅❌🔴🟢 и т.д.

3. **Windows-1251 везде при работе с xiais.kemsu.ru.** Всегда `new TextDecoder('windows-1251')`.
   Использовать UTF-8 — баг.

4. **Сдача работ требует активного браузера.** Прямой Node.js fetch без браузерной
   сессии даёт NullPointerException на ИнфоОУПро. Используй `eios_submit_solution`
   только когда расширение отправило куки через `/api/sync`.

5. **Не трогать `background.js` keep-alive алармы** — они критичны для поддержания
   сессии Tomcat живой (каждые 5 минут).

### Кодстайл

- ES Modules (`import`/`export`) в mcp-server, `type: "module"` в package.json
- Vanilla JS в content-скриптах (без бандлера — прямой Manifest V3)
- Комментарии на русском языке (для однокурсников)
- `console.error()` для MCP-логов (stdout зарезервирован для MCP-протокола)

### Тесты

```bash
npm test   # Jest unit-тесты
```

Тесты используют `window.__XIAS_TEST__ = true` для подавления реальных sync-запросов.

---

## Быстрый старт на новой машине

```bash
# 1. Клонировать
git clone https://github.com/TigarSigar/Xias.git
cd Xias

# 2. Установить зависимости MCP-сервера
cd mcp-server
npm install

# 3. Создать .env (см. .env.example)
cp .env.example .env
# Заполнить XIAS_MCP_PORT (по умолчанию 38421)

# 4. Запустить MCP-сервер
node index.js

# 5. Установить расширение в Chrome
# chrome://extensions/ -> Режим разработчика -> Загрузить распакованное
# Выбрать папку Xias/ (где лежит manifest.json)

# 6. В настройках расширения ввести логин/пароль от ЭИОС
# chrome.storage.local сохранит их зашифрованно

# 7. Открыть xiais.kemsu.ru — расширение активируется автоматически
```

---

## Известные ограничения и TODO

- [ ] Сдача работ через MCP без браузера (нужен Node.js cookiejar + SSO flow)
- [ ] Автоматическая загрузка реального `tasksUrl` курсов (сейчас из sync)
- [ ] WebSocket real-time sync вместо polling
- [ ] Поддержка двухфакторной аутентификации КемГУ
- [ ] Тесты для crawler.js (mock HTML fixtures)
- [ ] Публикация в Chrome Web Store
