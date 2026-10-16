# LEARN.md — как устроен SLOT.

Этот файл нужен, чтобы ты мог уверенно ориентироваться в проекте: открыть любой файл и понять, зачем он, что в нём происходит и как он связан с остальными.

Читать лучше по порядку: сначала общая схема, потом путь одного запроса, потом файлы, в конце — понятия (React, fetch, SQL, ORM...) на примерах из проекта.

---

## 1. Общая схема

```
Браузер (что видит пользователь)
   │  React-компоненты рисуют страницу
   │  api.js отправляет запросы:  fetch('/api/groups/3/schedule')
   ▼
Vite (порт 5173) — в режиме разработки пересылает /api/... на backend
   ▼
FastAPI (порт 8000) — принимает HTTP-запрос, выбирает нужную функцию (эндпоинт)
   │  Pydantic проверяет входные данные (schemas.py)
   │  auth.py проверяет токен и роль (для изменений)
   ▼
SQLAlchemy (ORM) — превращает Python-код в SQL-запросы (models.py)
   ▼
SQLite — файл backend/slot.db, где лежат таблицы
```

Ответ идёт обратно: SQLite → объекты Python → JSON → `fetch` → `useState` → React перерисовывает страницу.

---

## 2. Путь одного запроса: «открыть расписание ИС-21»

1. Пользователь кликает карточку группы. `GroupCard.jsx` — это `<Link to="/group/3">`.
2. React Router видит адрес `/group/3` и показывает `GroupSchedulePage` (так написано в `App.jsx`).
3. `GroupSchedulePage` достаёт `groupId = "3"` из адреса через `useParams()` и передаёт в `ScheduleScreen` функцию `loadWeek`.
4. В `ScheduleScreen` срабатывает `useEffect` → вызывается `getGroupSchedule(3, '2026-10-12')` из `api.js`.
5. `api.js` делает `fetch('/api/groups/3/schedule?week_start=2026-10-12')`.
6. На сервере FastAPI находит функцию `group_schedule` в `routers/schedule.py`.
7. Она берёт из базы занятия группы и вызывает `build_week()` из `schedule_service.py`. Та оставляет занятия нужной недели (чётной/нечётной), раскладывает их по дням и подставляет замены.
8. FastAPI превращает результат в JSON по схеме `WeekSchedule` и отправляет ответ.
9. В браузере `setWeek(data)` сохраняет неделю в состоянии, React перерисовывает `DayTabs` и `LessonCard`.

---

## 3. Backend (Python)

### `backend/app/database.py`
**За что отвечает:** подключение к базе SQLite.

| Что | Принимает | Возвращает |
| --- | --- | --- |
| `engine` | — | «двигатель», который выполняет SQL в файле `slot.db` |
| `SessionLocal` | — | фабрика сессий: `SessionLocal()` = новая сессия |
| `Base` | — | родительский класс для моделей |
| `get_db()` | — | отдаёт сессию на время запроса (`yield`), потом закрывает её |

**Связи:** `models.py` наследуется от `Base`; все эндпоинты получают сессию через `Depends(get_db)`.
**Если удалить:** backend не запустится — моделям и эндпоинтам не к чему подключаться.

### `backend/app/models.py`
**За что отвечает:** описание таблиц базы данных в виде классов (ORM).

| Класс | Таблица | Главные поля |
| --- | --- | --- |
| `Group` | `groups` | `name`, `course`, `specialty` |
| `Teacher` | `teachers` | `full_name`, `department`, `email` |
| `Subject` | `subjects` | `name` |
| `Classroom` | `classrooms` | `number`, `building`, `capacity` |
| `Lesson` | `lessons` | `group_id`, `subject_id`, `teacher_id`, `classroom_id`, `day_of_week` (1–6), `pair_number` (1–6), `week_type` (both/odd/even), `lesson_type` |
| `ScheduleChange` | `schedule_changes` | `lesson_id`, `date`, `change_type` (replacement/room/cancelled), `new_teacher_id`, `new_classroom_id`, `comment` |
| `User` | `users` | `username`, `password_hash`, `role`, `token` |

`ForeignKey("groups.id")` — внешний ключ: занятие ссылается на группу. `relationship(...)` позволяет писать `lesson.group.name` вместо отдельного запроса. `cascade="all, delete-orphan"` у `Lesson.changes`: удалили занятие — удалились и его замены.

**Связи:** используется во всех роутерах, в `seed.py`, `schedule_service.py`.
**Если удалить:** таблиц не будет, сервер упадёт при старте.

### `backend/app/schemas.py`
**За что отвечает:** какой JSON принимает и отдаёт API (Pydantic).

- `GroupIn`, `TeacherIn`, `SubjectIn`, `ClassroomIn`, `LessonIn`, `ChangeIn` — что присылает frontend при создании/изменении. Тут же правила: `course` от 1 до 4, `pair_number` от 1 до 6, `change_type` только из трёх значений.
- `...Out` — что сервер отдаёт обратно (с `id` и вложенными объектами).
- `WeekSchedule` → `ScheduleDay` → `ScheduleLesson` — формат недели.
- `LoginIn`, `LoginOut`, `UserOut` — вход.

**Пример:** если прислать `"pair_number": 9`, FastAPI сам вернёт ошибку **422**, а код эндпоинта даже не запустится.
**Если удалить:** роутеры не смогут проверять и описывать данные — сервер не запустится.

### `backend/app/auth.py`
**За что отвечает:** пароли, токены и проверка прав.

| Функция | Принимает | Возвращает |
| --- | --- | --- |
| `hash_password(password)` | пароль строкой | строку `соль$хеш` (PBKDF2, 100 000 итераций) |
| `verify_password(password, saved_hash)` | пароль и хеш из базы | `True` / `False` |
| `new_token()` | — | случайный токен из 48 символов |
| `get_current_user(authorization, db)` | заголовок `Authorization: Bearer ...` | пользователь или ошибка **401** |
| `require_admin(user)` | пользователь | тот же пользователь или ошибка **403**, если роль не `admin` |

**Связи:** `routers/auth.py` выдаёт токен; все POST/PUT/DELETE подключают `dependencies=[Depends(require_admin)]`.
**Если удалить:** изменять данные сможет кто угодно — или сервер не запустится из-за импортов.

### `backend/app/schedule_service.py`
**За что отвечает:** собирает неделю расписания с заменами.

| Функция | Принимает | Возвращает |
| --- | --- | --- |
| `monday_of(day)` | любую дату | понедельник этой недели |
| `week_type_of(day)` | дату | `'odd'` или `'even'` по номеру ISO-недели |
| `build_week(db, lessons, week_start)` | сессию, список занятий, дату | словарь `{week_start, week_type, days: [...]}` |

Логика `build_week`: 1) оставить занятия с `week_type` «both» или совпадающим с неделей; 2) одним запросом взять изменения этих занятий за неделю; 3) для каждого из 6 дней собрать список `{lesson, change}`.
**Связи:** вызывается из `routers/schedule.py` (группа) и `routers/teachers.py` (преподаватель) — одна функция на оба случая.
**Если удалить:** расписание на неделю не будет работать, остальной CRUD — будет.

### `backend/app/routers/*.py`
**За что отвечают:** эндпоинты API. В каждом файле есть `router = APIRouter(prefix=...)`.

| Файл | Эндпоинты |
| --- | --- |
| `groups.py` | `GET/POST /api/groups`, `GET/PUT/DELETE /api/groups/{id}` |
| `teachers.py` | то же + `GET /api/teachers/{id}/schedule` |
| `subjects.py`, `classrooms.py` | CRUD справочников |
| `lessons.py` | CRUD занятий + проверка конфликтов |
| `changes.py` | CRUD замен + проверка, что дата подходит к занятию |
| `schedule.py` | `GET /api/groups/{id}/schedule`, `GET /api/search?q=` |
| `auth.py` | `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout` |

Важные функции в `lessons.py`:
- `check_references(db, data)` — существуют ли группа, предмет, преподаватель, аудитория (иначе **400**);
- `weeks_overlap(a, b)` — пересекаются ли недели («каждую» пересекается со всем, нечётная с чётной — нет);
- `check_conflicts(db, data, skip_id)` — не занята ли группа, потом преподаватель, потом аудитория в это время (иначе **409** с понятным текстом). `skip_id` нужен при редактировании, чтобы занятие не конфликтовало само с собой.

В `changes.py`: `validate_change` проверяет, что дата — тот же день недели, что у занятия, и что в эту неделю пара вообще проводится; `save_fields` обнуляет лишние поля (у отмены нет нового преподавателя).

Удаление справочника, который используется (`teacher.lessons` не пустой), возвращает **409** «Нельзя удалить: преподаватель ведёт N занятий».

**Если удалить файл роутера:** пропадут его адреса (ответ 404), остальное продолжит работать.

### `backend/app/seed.py`
**За что отвечает:** тестовые данные (все имена вымышленные): 6 групп, 10 преподавателей, 12 предметов, 10 аудиторий, 114 занятий, 10 изменений, 2 пользователя.

- `create_lessons` раскладывает предметы по сетке так, чтобы не было конфликтов (множество `busy` хранит занятых преподавателей и аудитории);
- `create_changes` создаёт замены **от сегодняшней даты** (`demo_days()`), чтобы на демонстрации всегда было что показать;
- `seed_if_empty()` вызывается при старте сервера; `python -m app.seed` пересоздаёт базу.

**Если удалить:** сервер не запустится (его импортирует `main.py`); без вызова база будет пустой.

### `backend/app/main.py`
**За что отвечает:** создаёт приложение FastAPI, таблицы, тестовые данные, подключает CORS и роутеры.
**Если удалить:** запускать нечего.

### `backend/tests/test_api.py`
9 автотестов: расписание, поиск, 401 без входа, 403 для `student`, неверный пароль, CRUD занятия и конфликт, валидация замены, защита от удаления, свежесть тестовых изменений. Тесты работают на временной базе и не трогают `slot.db`.

---

## 4. Frontend (React)

### `src/main.jsx`
Точка входа. Применяет сохранённую тему, оборачивает приложение в `BrowserRouter` (адреса страниц) и `ToastProvider` (уведомления), рисует `<App />` в `<div id="root">`.
**Если удалить:** страница будет пустой.

### `src/App.jsx`
Карта маршрутов: адрес → страница. Все страницы вложены в `AppLayout` (меню + контент).
**Если удалить:** страницы не будут открываться по адресам.

### `src/api/api.js`
Все запросы к серверу в одном месте.

| Функция | Принимает | Возвращает (Promise) |
| --- | --- | --- |
| `request(path, options)` | адрес и `{method, body}` | JSON ответа; при ошибке бросает `Error` с текстом из `detail` |
| `getGroupSchedule(groupId, weekStart)` | id группы, дата | неделя |
| `getTeacherSchedule(teacherId, weekStart)` | id преподавателя, дата | неделя |
| `search(text)` | строка | `{groups, teachers}` |
| `getChanges(filters)` | `{group_id, date_from, date_to}` | список изменений |
| `getList(resource)`, `getItem(resource, id)` | `'groups'`, `'teachers'`... | список / объект |
| `createItem`, `updateItem`, `deleteItem` | ресурс, id, данные | созданный / обновлённый объект / `null` |
| `getLessons(filters)` | `{group_id}` | занятия |
| `login`, `getMe`, `logout` | логин и пароль / — | токен и пользователь / пользователь / `null` |

`request` сам добавляет заголовок `Authorization: Bearer <токен>`, если пользователь вошёл. При ответе 401 токен стирается.
**Если удалить:** ни одна страница не получит данные.

### `src/utils/storage.js`, `src/utils/dates.js`, `src/data/constants.js`
- `storage.js` — запись и чтение `localStorage` (токен, последняя группа, тема) с `try/catch`.
- `dates.js` — `toISODate`, `fromISODate`, `addDays`, `getMonday`, `isSameDay`, `dayOfWeek`, `formatWeekRange`, `formatRelativeDay`, `timeToMinutes`, `isoWeekNumber`. Даты с сервером передаются строкой `ГГГГ-ММ-ДД`.
- `constants.js` — расписание звонков `BELLS`, названия дней, типы недель и изменений.

### `src/styles/tokens.css`, `global.css`
`tokens.css` — дизайн-токены, **те же значения, что в Figma** (цвета, шрифты, отступы, скругления, тени). Блок `[data-theme='dark']` переопределяет только цвета — так работает тёмная тема. `global.css` — базовые стили страницы.

### `src/components/ui/` — базовые элементы (как в Figma → Components)

| Файл | Props | Что делает |
| --- | --- | --- |
| `Button.jsx` | `variant`, `size`, `icon`, `fullWidth`, `...rest` | кнопка в 4 вариантах |
| `Field.jsx` → `Input`, `Select` | `label`, `error`, `icon`, `options`, `placeholder` | поле ввода и выпадающий список с подписью и ошибкой |
| `Badge.jsx` | `tone`, `icon`, `children` | метка статуса |
| `Segmented.jsx` | `options`, `value`, `onChange` | переключатель «День / Неделя» и т.п. |
| `Modal.jsx` | `title`, `onClose`, `footer`, `children` | модальное окно, закрывается по Esc и клику на фон |
| `EmptyState.jsx` | `icon`, `title`, `text`, `action` | заглушка «ничего нет» |
| `Toast.jsx` → `ToastProvider`, `useToast` | — | всплывающие уведомления; любой компонент вызывает `showToast('Сохранено')` |

### `src/components/layout/`
- `AppLayout.jsx` — каркас: `Sidebar` + `MobileNav` + `<Outlet />` (место для страницы).
- `Sidebar.jsx` — боковое меню (скрывается на экранах уже 768px).
- `MobileNav.jsx` — верхняя шапка и нижние вкладки на телефоне.
- `navItems.js` — список пунктов меню, общий для обоих меню.
- `NowWidget.jsx` — «Идёт 3 пара»: `useEffect` + `setInterval` обновляет время раз в 30 секунд.
- `ThemeToggle.jsx`, `Logo.jsx`.

### `src/components/schedule/`
| Файл | Props / функции | Что делает |
| --- | --- | --- |
| `ScheduleScreen.jsx` | `header`, `loadWeek`, `mode` | общий экран для группы и преподавателя: состояние недели, дня, режима, загрузка |
| `lessonStatus.js` | `getLessonStatus(item, date)`, `getPairProgress`, `shortName`, `roomLabel` | статус карточки (замена / идёт сейчас / ...) и форматирование |
| `LessonCard.jsx` | `item`, `status`, `mode` | карточка занятия (5 состояний, как варианты в Figma) |
| `DayTabs.jsx` | `days`, `selected`, `onSelect` | вкладки дней; `pairsLabel(n)` склоняет «пара/пары/пар» |
| `WeekSwitcher.jsx` | `weekStart`, `weekType`, `onPrev`, `onNext` | переключение недель |
| `WeekGrid.jsx` | `days`, `onSelectDay` | режим «Неделя» |
| `ChangeRow.jsx` | `change` | строка на странице «Изменения» |
| `GroupCard.jsx`, `ResultRow.jsx` | `group` / `to, avatar, title, subtitle, query` | карточка группы, строка поиска с подсветкой |

### `src/pages/`
| Файл | Что делает |
| --- | --- |
| `HomePage.jsx` | загружает группы и изменения на сегодня; фильтрует группы по вводу; Enter открывает первую найденную |
| `GroupSchedulePage.jsx` | `useParams` → id группы; запоминает последнюю группу |
| `TeacherSchedulePage.jsx` | то же для преподавателя |
| `SearchPage.jsx` | поиск с задержкой 250 мс (чтобы не слать запрос на каждую букву), фильтр «Все / Группы / Преподаватели» |
| `ChangesPage.jsx` | изменения начиная с сегодня, фильтры по группе и типу, группировка по датам |
| `LoginPage.jsx` | форма входа, сохраняет токен |
| `admin/AdminPage.jsx` | проверяет вход (`getMe`), загружает справочники, показывает вкладки |
| `admin/LessonsPanel.jsx`, `LessonForm.jsx` | таблица и форма занятий |
| `admin/ChangesPanel.jsx`, `ChangeForm.jsx` | таблица и форма замен |
| `admin/DirectoryPanel.jsx` + `directories.js` | одна вкладка для любого справочника; поля описаны в `directories.js` |
| `admin/ConfirmDialog.jsx` | «Точно удалить?» |

---

## 5. Понятия на примерах из проекта

### React-компонент
Функция, которая возвращает разметку (JSX). Пример — `Badge.jsx`:
```jsx
function Badge({ tone = 'neutral', icon: Icon, children }) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>
}
```
Компонент можно использовать как тег: `<Badge tone="now">Идёт сейчас</Badge>`. Один компонент — много мест: `Badge` есть в карточке занятия, в строке изменения, на главной.

### Props
Входные данные компонента — как аргументы функции. `LessonCard` получает `item`, `status`, `mode`. Компонент props **не меняет**, только читает. `children` — то, что написано между тегами (`Идёт сейчас`).

### useState
Память компонента. Изменил состояние — React перерисовал компонент.
```jsx
const [view, setView] = useState('day')     // ScheduleScreen.jsx
<Segmented value={view} onChange={setView} ... />
```
`view` — текущее значение, `setView('week')` — изменить. Обычную переменную менять бесполезно: React о ней не знает.

### useEffect
Код, который запускается **после** отрисовки — для загрузки данных, таймеров, подписок.
```jsx
useEffect(() => {
  loadWeek(weekStart).then(setWeek)
}, [weekStart, loadWeek])   // запускать заново, когда меняется неделя
```
Второй аргумент — список зависимостей. `[]` — только один раз (как в `HomePage`). Функция, которую возвращает эффект, — «уборка»: в `NowWidget` это `clearInterval`, в `SearchPage` — `clearTimeout`.

### async / await
Способ писать асинхронный код как обычный. `await` ждёт ответа, не блокируя страницу.
```jsx
async function handleSubmit(event) {        // LoginPage.jsx
  const data = await login(username, password)
  saveToken(data.token)
}
```
Ошибки ловятся через `try { ... } catch (err) { ... }`.

### fetch
Встроенная функция браузера для HTTP-запросов. У нас она вызывается в одном месте — `request()` в `api.js`:
```js
const response = await fetch(path, { method, headers, body: JSON.stringify(data) })
const json = await response.json()
```
`response.ok` — `true`, если статус 200–299.

### API
Договорённость, какие адреса есть у сервера и что они принимают/отдают. Полный список с примерами — http://localhost:8000/docs (FastAPI строит его сам из кода).

### HTTP-запросы
| Метод | Смысл | Пример |
| --- | --- | --- |
| GET | получить | `GET /api/groups` |
| POST | создать | `POST /api/lessons` |
| PUT | заменить/изменить | `PUT /api/lessons/12` |
| DELETE | удалить | `DELETE /api/changes/4` |

Коды ответа в проекте: **200** OK, **201** создано, **204** удалено (без тела), **400** неверные данные, **401** не вошёл, **403** нет прав, **404** не найдено, **409** конфликт (время занято, нельзя удалить), **422** не прошла проверка Pydantic.

### SQL
Язык запросов к базе. Мы его почти не пишем руками — это делает ORM. Но вот что примерно выполняется для `GET /api/lessons?group_id=1`:
```sql
SELECT * FROM lessons WHERE group_id = 1 ORDER BY day_of_week, pair_number;
```
Посмотреть базу можно программой DB Browser for SQLite: открыть `backend/slot.db`.

### ORM
Связь «класс ↔ таблица». Вместо SQL пишем Python:
```python
db.query(Lesson).filter(Lesson.group_id == group_id).all()   # SELECT
db.add(lesson); db.commit()                                   # INSERT
setattr(lesson, field, value); db.commit()                    # UPDATE
db.delete(lesson); db.commit()                                # DELETE
```
`lesson.teacher.full_name` — ORM сам подтянет преподавателя по внешнему ключу.

### CRUD
**C**reate, **R**ead, **U**pdate, **D**elete — четыре базовые операции. В SLOT. они есть для групп, преподавателей, предметов, аудиторий, занятий и замен:

| | HTTP | ORM | Где в интерфейсе |
| --- | --- | --- | --- |
| Create | POST | `db.add()` | «Добавить занятие» |
| Read | GET | `db.query()` | таблица, расписание |
| Update | PUT | `setattr()` + `commit()` | карандаш → форма → «Сохранить» |
| Delete | DELETE | `db.delete()` | корзина → «Удалить» |

---

## 6. Как Figma связан с кодом

- Цвета, шрифты, отступы и скругления из Figma (переменные `SLOT Tokens`) = CSS-переменные в `tokens.css`. Пример: `color/accent` в Figma = `--color-accent` в CSS.
- Варианты компонентов = props или CSS-классы. `Lesson Card / Status=Replacement` в Figma = `<LessonCard status="replacement" />` = класс `.replacement` в `LessonCard.module.css`.
- Auto Layout в Figma = `display: flex` + `gap` + `padding` в CSS. Например, карточка занятия в Figma: колонка времени 96px с отступами 18/20 → в CSS `.time { width: 96px; padding: 18px 0 18px 20px; }`.
- Брейкпоинт 768px: в Figma — отдельные экраны 390px, в CSS — `@media (max-width: 767px)`.
