# Макет SLOT. в Figma

**Файл:** https://www.figma.com/design/ZUFInFJpvHthITPWluXE5n — настоящий редактируемый файл: компоненты, варианты, Auto Layout, переменные, стили, прототип.

## Структура файла

На бесплатном плане Figma (Starter) в файле может быть только **3 страницы**, поэтому разделы 01–05 оформлены как **Sections** внутри страниц:

| Страница | Секция | Что внутри |
| --- | --- | --- |
| Design System | 00 / Cover | Обложка проекта |
| | 01 / Foundations | Палитра (светлая и тёмная), типографика (13 текстовых стилей), отступы, скругления, тени, сетка, иконки |
| | 02 / Components | Библиотека компонентов с вариантами состояний |
| Screens | 03 / Desktop Screens — 1440 | 6 экранов: главная, расписание группы, поиск, изменения, админ-панель, форма занятия |
| | 04 / Mobile Screens — 390 | 4 экрана: главная, расписание, поиск, изменения |
| Prototype | — | Копии экранов, связанные переходами, и два сценария (flow): Desktop и Mobile |

## Дизайн-система

- **Переменные** — коллекция `SLOT Tokens`: 21 цвет (`color/bg`, `color/accent`…), отступы `space/1…14`, скругления `radius/sm…full`. Заливки и обводки компонентов привязаны к переменным (кроме служебных рамок наборов вариантов), отступы и скругления — тоже, когда значение совпадает с токеном.
- **Текстовые стили** — Display, H1, H2, H3, Body, Body Medium, Label, Small, Small Medium, Caption, Overline, Mono, Mono Large. Шрифты: Onest и JetBrains Mono.
- **Стили теней** — `Shadow/sm`, `Shadow/md`, `Shadow/lg`.

## Компоненты (страница Design System → 02 / Components)

| Компонент | Варианты | В React |
| --- | --- | --- |
| Button | Variant: Primary / Secondary / Ghost / Danger × State: Default / Hover / Pressed / Disabled; свойства Label, Show icon | `components/ui/Button.jsx` |
| Icon Button | State: Default / Hover / Disabled | кнопки-стрелки, действия в таблице |
| Input, Select | State: Default / Hover / Focus / Error / Disabled; свойства Label, Value, Show label | `components/ui/Field.jsx` |
| Lesson Status | Status: Neutral / Accent / Now / Replacement / Room / Cancelled | `components/ui/Badge.jsx` |
| Nav Item, Sidebar | State: Default / Hover / Active; Sidebar — Active по пунктам | `components/layout/Sidebar.jsx` |
| Mobile Top Bar, Mobile Tab Bar | Tab Bar — Active по вкладкам | `components/layout/MobileNav.jsx` |
| Segment | Active: true / false | `components/ui/Segmented.jsx` |
| Week Switcher | — | `components/schedule/WeekSwitcher.jsx` |
| Day Tab | State: Default / Hover / Active; свойство Today | `components/schedule/DayTabs.jsx` |
| Lesson Card | Status: Default / Now / Replacement / Room / Cancelled | `components/schedule/LessonCard.jsx` |
| Change Row | Type: Replacement / Room / Cancelled | `components/schedule/ChangeRow.jsx` |
| Group Card | State: Default / Hover | `components/schedule/GroupCard.jsx` |
| Teacher Row | — | `components/schedule/ResultRow.jsx` |
| Changes Banner, Stat Card | Stat: Type | `pages/HomePage.jsx`, `pages/ChangesPage.jsx` |
| Table Row | Kind: Header / Row | таблицы админ-панели |
| Modal, Notification, Empty State | Notification: Success / Error | `components/ui/Modal.jsx`, `Toast.jsx`, `EmptyState.jsx` |

У каждого компонента в Figma в поле Description написано, какой React-файл ему соответствует.

## Прототип

Откройте страницу **Prototype** → кнопка Present (▶). Два сценария:

- **Desktop: студент → администратор** — главная → карточка ИС-21 → расписание → меню «Поиск» → преподаватель → «Администрирование» → строка таблицы или «Добавить занятие» → форма → «Сохранить».
- **Mobile: расписание с телефона** — нижняя панель вкладок, карточка группы, результат поиска.

Работает 46 переходов. Ссылки «экран сам на себя» (например, пункт «Расписание» на экране расписания) Figma не принимает, поэтому их нет.

## Ограничения бесплатного плана и что из этого следует

1. **3 страницы** → разделы оформлены как Sections.
2. **Один режим переменных** → в переменных хранится светлая тема. Тёмная палитра показана на Foundations статичными образцами, а в приложении тёмная тема полностью работает (переключатель в меню, `tokens.css`).

## Как собран макет

Макет создан программно через Figma MCP (Plugin API) — скриптами из `figma/scripts/`:

- `lib.js` — общие функции: токены, текстовые стили, Auto Layout-контейнеры, иконки;
- `part1-foundations-components.js` — Foundations и библиотека компонентов;
- `part2-screens.js` — экраны из экземпляров компонентов;
- `part3-prototype.js` — связи прототипа;
- `build-icons.mjs` — берёт SVG иконок из пакета `lucide-react`, чтобы иконки в Figma и в React совпадали;
- `mock-figma.mjs`, `run-mock.mjs` — заглушка Figma API для проверки скриптов без Figma;
- `bundle.mjs` — собирает части в `dist/` для отправки в Figma.

Скрипты используют расширение `figma.createAutoLayout()`, которое есть в среде Figma MCP, поэтому как обычный плагин Figma они без доработки не запустятся. Сам файл в Figma полностью редактируется вручную.

## Известные отличия макета от приложения

- В макете неделя 12–17 октября подписана как «Нечётная», а приложение считает чётность по номеру ISO-недели: это 42-я неделя, то есть чётная. В макете это просто пример текста.
- В приложении есть режим «Неделя» (сетка из 6 колонок). В макете он представлен только переключателем «День / Неделя», отдельного экрана нет.
