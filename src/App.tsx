import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './AppShell'
import { DashboardPage } from './pages/Dashboard'
import { BoardPage } from './pages/Board'

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/b/:boardId" element={<BoardPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
