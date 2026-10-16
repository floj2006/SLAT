/*
  Все запросы к backend собраны в одном файле.
  Компоненты не пишут fetch сами — они вызывают функции отсюда,
  например: const groups = await getGroups()
*/
import { getToken, clearToken } from '../utils/storage.js'

// Общая функция: отправляет запрос и возвращает JSON или бросает ошибку
async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let response
  try {
    response = await fetch(path, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    })
  } catch {
    // fetch падает, когда до сервера вообще не достучаться
    throw new Error('Нет связи с сервером. Проверьте интернет и попробуйте ещё раз.')
  }

  // 204 No Content — ответа нет (так отвечает DELETE)
  if (response.status === 204) {
    return null
  }

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    if (response.status === 401) {
      clearToken()
    }
    throw new Error(readError(data, response.status))
  }
  return data
}

// FastAPI возвращает ошибки в поле detail: строкой (наши сообщения) или списком (проверка полей)
function readError(data, status) {
  if (data && typeof data.detail === 'string') return data.detail
  if (status === 422) return 'Некоторые поля заполнены неверно. Проверьте форму и попробуйте ещё раз.'
  return `Что-то пошло не так на сервере (код ${status}). Попробуйте ещё раз через минуту.`
}

// Собирает строку параметров: { group_id: 1 } → '?group_id=1'
function toQuery(params) {
  const clean = Object.entries(params).filter(([, value]) => value !== '' && value != null)
  if (clean.length === 0) return ''
  return '?' + new URLSearchParams(clean).toString()
}

/* ---------- Расписание и поиск ---------- */

export function getGroupSchedule(groupId, weekStart) {
  return request(`/api/groups/${groupId}/schedule${toQuery({ week_start: weekStart })}`)
}

export function getTeacherSchedule(teacherId, weekStart) {
  return request(`/api/teachers/${teacherId}/schedule${toQuery({ week_start: weekStart })}`)
}

export function search(text) {
  return request(`/api/search${toQuery({ q: text })}`)
}

export function getChanges(filters = {}) {
  return request(`/api/changes${toQuery(filters)}`)
}

/* ---------- Справочники ---------- */
// resource — это 'groups', 'teachers', 'subjects' или 'classrooms'

export function getList(resource) {
  return request(`/api/${resource}`)
}

export function getItem(resource, id) {
  return request(`/api/${resource}/${id}`)
}

export function createItem(resource, data) {
  return request(`/api/${resource}`, { method: 'POST', body: data })
}

export function updateItem(resource, id, data) {
  return request(`/api/${resource}/${id}`, { method: 'PUT', body: data })
}

export function deleteItem(resource, id) {
  return request(`/api/${resource}/${id}`, { method: 'DELETE' })
}

export const getGroups = () => getList('groups')
export const getTeachers = () => getList('teachers')

/* ---------- Занятия ---------- */

export function getLessons(filters = {}) {
  return request(`/api/lessons${toQuery(filters)}`)
}

/* ---------- Авторизация ---------- */

export function login(username, password) {
  return request('/api/auth/login', { method: 'POST', body: { username, password } })
}

export function getMe() {
  return request('/api/auth/me')
}

export function logout() {
  return request('/api/auth/logout', { method: 'POST' })
}
