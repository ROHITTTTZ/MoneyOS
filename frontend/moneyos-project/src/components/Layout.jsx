import { Link, useLocation } from "react-router-dom"
import { supabase } from "../supabaseClient"

const navItems = [
  { path: "/", label: "Dashboard" },
  { path: "/upload", label: "Upload" },
  { path: "/transactions", label: "Transactions" },
  { path: "/goals", label: "Goals" },
  { path: "/copilot", label: "AI Copilot" },
]

export default function Layout({ children }) {
  const { pathname } = useLocation()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-8 py-4 flex items-center gap-8">
        <span className="font-bold text-gray-900 text-lg">MoneyOS</span>
        <div className="flex gap-6">
          {navItems.map(item => (
            <Link key={item.path} to={item.path}
              className={`text-sm ${pathname===item.path?"text-blue-600 font-medium":"text-gray-500 hover:text-gray-900"}`}>
              {item.label}
            </Link>
          ))}
        </div>
        <button onClick={() => supabase.auth.signOut()}
          className="ml-auto text-sm text-gray-400 hover:text-red-500">Sign out</button>
      </nav>
      <main>{children}</main>
    </div>
  )
}
