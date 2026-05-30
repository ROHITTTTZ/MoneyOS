import { BrowserRouter, Routes, Route } from "react-router-dom"
import { useAuth } from "./hooks/useAuth"
import { supabase } from "./supabaseClient"
import AuthPage from "./pages/AuthPage"
import DashboardPage from "./pages/DashboardPage"
import UploadPage from "./pages/UploadPage"
import TransactionsPage from "./pages/TransactionsPage"
import Layout from "./components/Layout"
import CopilotPage from "./pages/CopilotPage"
import GoalsPage from "./pages/GoalsPage"

function App() {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (!user) return <AuthPage />

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/copilot" element={<CopilotPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
export default App
