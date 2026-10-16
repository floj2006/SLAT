import { Route, Routes } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout.jsx'
import HomePage from './pages/HomePage.jsx'
import GroupSchedulePage from './pages/GroupSchedulePage.jsx'
import TeacherSchedulePage from './pages/TeacherSchedulePage.jsx'
import SearchPage from './pages/SearchPage.jsx'
import ChangesPage from './pages/ChangesPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import AdminPage from './pages/admin/AdminPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

// Карта сайта: какой адрес открывает какую страницу
function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/group/:groupId" element={<GroupSchedulePage />} />
        <Route path="/teacher/:teacherId" element={<TeacherSchedulePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/changes" element={<ChangesPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
