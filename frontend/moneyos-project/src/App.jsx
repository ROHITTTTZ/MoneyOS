import { useAuth } from "./hooks/useAuth"
import AuthPage from "./pages/AuthPage"

function App() {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (!user) return <AuthPage />

  return (
    <div className="min-h-screen bg-gray-50">
      <p className="p-8 text-gray-600">Logged in as {user.email}</p>
      <button onClick={() => supabase.auth.signOut()} className="ml-8 text-sm text-red-500">Sign Out</button>
    </div>
  )
}

export default App
