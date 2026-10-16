/*
  Работа с localStorage — памятью браузера.
  Здесь хранятся: токен администратора, последняя группа и тема.
  try/catch нужен, потому что в приватном режиме localStorage может быть недоступен.
*/

function read(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key, value) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // ничего страшного — просто не запомним
  }
}

export const getToken = () => read('slot:token')
export const saveToken = (token) => write('slot:token', token)
export const clearToken = () => write('slot:token', null)

export const getLastGroupId = () => read('slot:lastGroup')
export const saveLastGroupId = (id) => write('slot:lastGroup', String(id))

export const getSavedTheme = () => read('slot:theme')
export const saveTheme = (theme) => write('slot:theme', theme)
