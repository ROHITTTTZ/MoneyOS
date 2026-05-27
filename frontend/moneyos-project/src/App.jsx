import { BrowserRouter, Routes, Route, Link } from "react-router-dom"
import { useAuth } from "./hooks/useAuth"
import { supabase } from "./supabaseClient"

import AuthPage from "./pages/AuthPage"
import UploadPage from "./pages/UploadPage"
import TransactionsPage from "./pages/TransactionsPage"

function App() {
  const { user, loading } = useAuth()

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    )

  if (!user) return <AuthPage />

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">

        {/* Navbar */}
        <nav className="bg-white border-b px-8 py-4 flex gap-6 items-center">

          <Link to="/" className="text-blue-600 font-medium">
            Upload
          </Link>

          <Link to="/transactions" className="text-gray-600">
            Transactions
          </Link>

          <button
            onClick={() => supabase.auth.signOut()}
            className="ml-auto text-red-500"
          >
            Sign Out
          </button>

        </nav>

        {/* Pages */}
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
        </Routes>

      </div>
    </BrowserRouter>
  )
}

export default App