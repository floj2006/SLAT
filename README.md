# SLOT. — расписание колледжа

Веб-платформа для просмотра и редактирования расписания колледжа: выбор группы, расписание на день и неделю, поиск преподавателей, замены и отмены, административная панель с реальной серверной авторизацией.

Индивидуальный практический проект по дисциплине «Проектирование и дизайн информационных систем».

| Что | Где |
| --- | --- |
| Макет в Figma (редактируемый) | https://www.figma.com/design/ZUFInFJpvHthITPWluXE5n |
| Frontend (React + Vite) | `frontend/` |
| Backend (FastAPI + SQLite) | `backend/` |
| Как устроен код — разбор по файлам | [`LEARN.md`](LEARN.md) |
| Сценарий защиты и вопросы | [`DEFENSE.md`](DEFENSE.md) |
| Как собран макет Figma | [`figma/README.md`](figma/README.md) |

## Запуск на Windows (PowerShell)

Нужны **Python 3.11+** и **Node.js 18+**.

### 1. Backend — терминал №1

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1        # если ругается на политику: Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Сервер запустится на http://localhost:8000. Документация API (можно отправлять запросы прямо из браузера): http://localhost:8000/docs

При первом запуске создаётся файл `backend/slot.db` с тестовыми данными. Пересоздать базу заново:

```powershell
python -m app.seed
```

### 2. Frontend — терминал №2

```powershell
cd frontend
npm install
npm run dev
```

Откройте http://localhost:5173

### Учётные записи для демонстрации

| Логин | Пароль | Роль |
| --- | --- | --- |
| `admin` | `admin123` | администратор: может всё |
| `student` | `student123` | только просмотр: сервер отвечает 403 на любые изменения |

## Проверки

```powershell
cd backend
python -m pytest -q      # 9 автотестов API: CRUD, конфликты, 401/403, валидация
```

## Структура

```
SLAT/
├── backend/
│   ├── app/
│   │   ├── main.py             точка входа FastAPI
│   │   ├── database.py         подключение к SQLite
│   │   ├── models.py           таблицы (ORM)
│   │   ├── schemas.py          формат JSON для API
│   │   ├── auth.py             пароли, токены, проверка прав
│   │   ├── schedule_service.py сборка недели с заменами
│   │   ├── seed.py             тестовые данные
│   │   └── routers/            эндпоинты: groups, teachers, subjects, classrooms, lessons, changes, schedule, auth
│   └── tests/test_api.py
├── frontend/
│   └── src/
│       ├── main.jsx, App.jsx   запуск и маршруты
│       ├── api/api.js          все запросы к серверу
│       ├── styles/tokens.css   дизайн-токены (те же, что в Figma)
│       ├── components/         ui, layout, schedule
│       └── pages/              страницы и админ-панель
└── figma/                      скрипты, которыми собран макет
```
