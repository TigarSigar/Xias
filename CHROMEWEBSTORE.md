# Chrome Web Store Listing — XIAS (ЭИОС+ КемГУ & TickTick)

> Last Updated: 2026-09-15

## Store Listing

**Extension Name** [REQUIRED]
XIAS — ЭИОС+ КемГУ & TickTick

**Short Description** [REQUIRED]
Современный дашборд заданий ЭИОС КемГУ (ИнфоОУПро), бесшовный автологин, защита сессии и синхронизация задач с TickTick.

**Detailed Description** [REQUIRED]
XIAS (ЭИОС+) — расширение для браузера Google Chrome, созданное для студентов Кемеровского государственного университета (КемГУ). Расширение трансформирует устаревший интерфейс личного кабинета ИнфоОУПро в строгий, лаконичный дашборд задач в инженерном стиле, решает проблему частых разрывов веб-сессии и обеспечивает двустороннюю интеграцию с сервисом TickTick.

Основные возможности:

1. Инженерный дашборд задач (Anti-Slop UI)
Заменяет неадаптивные таблицы 2000-х годов на удобные карточки учебных дисциплин и единый список заданий.
Четкая визуальная дифференциация статусов: «Нужно сделать», «На проверке», «Оценено / Сдано».
Мгновенный живой поиск по названию работы и дисциплины.
Быстрый доступ к описанию задания и прикрепленным методическим материалам.
Возможность в один клик переключиться на оригинальный вид портала ИнфоОУПро.
Интерфейс оформлен в нейтральной палитре с векторными иконками и без визуального шума.

2. Бесшовный автологин и поддержание активности (Keep-Alive)
Фоновый сервис-воркер регулярно отправляет легкие проверочные запросы к серверам университета, предотвращая таймаут веб-сессии во время работы.
Автоматическое заполнение формы входа на eios.kemsu.ru с корректной эмуляцией пользовательского ввода.
Автоматическое восстановление сессии при возникновении серверных ошибок истекшей сессии на xiais.kemsu.ru с возвратом к текущему экрану.

3. Интеграция с TickTick
Одиночная отправка задания в TickTick нажатием кнопки в карточке лабораторной работы.
Пакетная синхронизация всех активных дедлайнов в один клик.
Точное распознавание даты и времени дедлайна с сохранением в задаче TickTick.
Автоматическое создание и привязка к списку «КемГУ / Учёба» с тегами #КемГУ и #Лаба.
Локальная дедупликация задач для предотвращения повторного создания.

Как начать пользоваться:
1. Установите расширение в Chrome.
2. Откройте окно настроек XIAS, нажав на иконку расширения.
3. Введите токен TickTick Open API (ссылка на получение токена доступна в окне настроек) и проверьте подключение.
4. При желании включите автологин, указав свой номер зачетки и пароль от ЭИОС.
5. Перейдите на портал ИнфоОУПро и работайте с заданиями в современном интерфейсе.

Безопасность и конфиденциальность:
Все учетные данные (логин, пароль, токен TickTick) хранятся исключительно локально на вашем компьютере в защищенном хранилище браузера (chrome.storage.local). Данные не передаются сторонним серверам и используются только для авторизации на официальных ресурсах КемГУ (*.kemsu.ru) и обращения к API TickTick (api.ticktick.com).

Техническая поддержка и исходный код:
Вопросы, предложения и сообщения об ошибках принимаются через репозиторий проекта и контактные каналы разработчика.

**Category** [REQUIRED]
Productivity

**Single Purpose** [REQUIRED]
Модернизация интерфейса учебного портала КемГУ с организацией учета лабораторных работ и синхронизацией дедлайнов с TickTick.

**Primary Language** [REQUIRED]
Russian

---

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|-----------|--------|----------|
| Store Icon [REQUIRED] | 128×128 PNG | ✅ Ready | `icons/icon128.png` |
| Small Icon | 16×16 PNG | ✅ Ready | `icons/icon16.png` |
| Medium Icon | 48×48 PNG | ✅ Ready | `icons/icon48.png` |
| Screenshot 1 [REQUIRED] | 1280×800 | ⬜ To be captured | `promo/screenshot_dashboard.png` |
| Screenshot 2 [RECOMMENDED] | 1280×800 | ⬜ To be captured | `promo/screenshot_tasks.png` |
| Screenshot 3 [RECOMMENDED] | 1280×800 | ⬜ To be captured | `promo/screenshot_popup.png` |
| Screenshot 4 [RECOMMENDED] | 1280×800 | ⬜ To be captured | `promo/screenshot_legacy_toggle.png` |
| Small Promo Tile [RECOMMENDED] | 440×280 | ⬜ To be captured | `promo/promo_small_440x280.png` |
| Marquee Promo Tile | 1400×560 | ⬜ To be captured | `promo/promo_marquee_1400x560.png` |

### Screenshot Notes
- **Screenshot 1**: Основной дашборд XIAS на `xiais.kemsu.ru/proc/stud/index.shtm` со списком карточек курсов, бейджами статусов лаб, фильтрами («Все», «Надо сделать», «На проверке», «Оценено») и строкой живого поиска.
- **Screenshot 2**: Страница заданий конкретного предмета с акцентными дедлайнами, кнопками «+ TickTick» и прикрепленными методическими файлами.
- **Screenshot 3**: Всплывающее окно настроек (popup) с проверкой токена TickTick, настройкой автологина и переключателем Keep-Alive.
- **Screenshot 4**: Демонстрация быстрого переключения между новым интерфейсом XIAS и оригинальной таблицей ИнфоОУПро.

---

## Permissions Justification

| Permission | Type | Justification |
|------------|------|---------------|
| `storage` | permissions | Необходимо для сохранения пользовательских настроек (токен доступа TickTick, название проекта, флаги автологина и keep-alive), локального кэша карточек заданий и хеш-карты синхронизированных задач для предотвращения создания дубликатов в TickTick. |
| `alarms` | permissions | Необходимо для планирования и запуска фонового таймера (каждые 5 минут) в сервис-воркере для отправки легких keep-alive запросов к серверу университета, что предотвращает неожиданный разлогин студента из-за таймаута веб-сессии. |
| `tabs` | permissions | Необходимо для отслеживания активной вкладки студента с порталом КемГУ (`xiais.kemsu.ru` и `eios.kemsu.ru`) для сохранения актуальной рабочей сессии и предотвращения разлогина во время переключения между задачами. |
| `*://*.kemsu.ru/*` | host_permissions | Необходимо для внедрения контентных скриптов интерфейса, парсинга таблиц заданий на портале ИнфоОУПро (`xiais.kemsu.ru`), выполнения бесшовного автологина на странице SSO (`eios.kemsu.ru`) и фоновой проверки активности веб-сессии. |
| `https://api.ticktick.com/*` | host_permissions | Необходимо для взаимодействия фонового сервис-воркера с официальным REST API сервиса TickTick: проверки валидности токена (`/user/profile`), поиска или создания проекта (`/project`) и добавления задач с дедлайнами (`/task`). |

---

## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** Yes (processed strictly on-device)

| Data Type | Collected? | Transmitted Off-Device? | Purpose | Shared with Third Parties? |
|-----------|-----------|------------------------|---------|---------------------------|
| Personally identifiable info | No | No | N/A | No |
| Health info | No | No | N/A | No |
| Financial info | No | No | N/A | No |
| Authentication info | Yes | No (EIOS credentials stay on device; TickTick token sent only to TickTick API) | Локальное хранение учетных данных для автологина на `eios.kemsu.ru` и токена для создания задач в личном аккаунте пользователя TickTick. | No |
| Personal communications | No | No | N/A | No |
| Location | No | No | N/A | No |
| Web history | No | No | N/A | No |
| User activity | No | No | N/A | No |
| Website content | Yes | Transmitted only to TickTick API (tasks created by user) | Считывание названий заданий, дедлайнов и ссылок на методички для отображения в дашборде и экспорта в задачи TickTick по прямой команде пользователя. | No |

### Data Use Certification
- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

---

## Privacy Policy

**Privacy Policy URL**: `https://kemsu.ru/privacy` (or repository privacy policy markdown)

Краткая выдержка политики конфиденциальности:
Расширение XIAS уважает приватность пользователей. Расширение не собирает, не отслеживает и не передает разработчикам или сторонним лицам аналитику, персональные данные, пароли или историю посещений. Все данные хранятся локально в браузере пользователя с использованием защищенного API `chrome.storage.local`. Взаимодействие с внешними серверами ограничено порталом университета (`kemsu.ru`) и официальным API сервиса управления задачами TickTick (`api.ticktick.com`), к которому запросы направляются исключительно по инициативе пользователя.

---

## Distribution

**Visibility**: Public
**Regions**: All regions
**Pricing**: Free

---

## Developer Info

**Publisher Name**: XIAS Dev Team
**Contact Email**: support@xias.local (или официальный email разработчика)
**Support URL / Email**: https://github.com/XIAS/XIAS/issues
**Homepage URL**: https://kemsu.ru

---

## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 1.0.0 | 2026-09-15 | Первый релиз: Manifest V3 core, Anti-Slop UI, автологин, keep-alive, синхронизация с TickTick | Draft |

---

## Review Notes

### Known Issues / Limitations
- Для работы интеграции с TickTick требуется персональный токен доступа (Personal Access Token), создаваемый пользователем в кабинете разработчика TickTick.
- Автологин срабатывает на стандартной React-форме входа личного кабинета ЭИОС (`eios.kemsu.ru/main`).
