import { useState, useEffect } from "react"
import { supabase } from "../supabaseClient"
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

const COLORS = ["#3B82F6","#10B981","#F59E0B","#EF4444","#8B5CF6","#06B6D4","#F97316","#EC4899"]

export default function DashboardPage() {
  const [summary, setSummary] = useState(null)
  const [categories, setCategories] = useState([])
  const [health, setHealth] = useState(null)
  const [month, setMonth] = useState(new Date().toISOString().slice(0,7))

  useEffect(() => {
    async function load() {
      const { data: s } = await supabase.auth.getSession()
      const token = s.session.access_token
      const headers = { Authorization: `Bearer ${token}` }
      const base = "http://localhost:8000"

      const [sum, cats, h] = await Promise.all([
        fetch(`${base}/dashboard/summary?month=${month}`, {headers}).then(r=>r.json()),
        fetch(`${base}/dashboard/categories?month=${month}`, {headers}).then(r=>r.json()),
        fetch(`${base}/dashboard/health_score`, {headers}).then(r=>r.json()),
      ])
      setSummary(sum); setCategories(cats); setHealth(h)
    }
    load()
  }, [month])

  if (!summary) return <p className="p-8 text-gray-400">Loading...</p>

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <input type="month" value={month} onChange={e => setMonth(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          {label:"Income", value:`₹${summary.income.toLocaleString()}`, color:"text-green-600"},
          {label:"Expenses", value:`₹${summary.expenses.toLocaleString()}`, color:"text-red-500"},
          {label:"Savings", value:`₹${summary.savings.toLocaleString()}`, color:"text-blue-600"},
          {label:"Savings Rate", value:`${summary.savings_rate}%`, color:"text-purple-600"},
        ].map(card => (
          <div key={card.label} className="bg-white rounded-xl p-5 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">{card.label}</p>
            <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Category Pie */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-medium text-gray-900 mb-4">Spending by Category</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={categories} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={90} label={({category})=>category}>
                {categories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Health Score */}
        {health && (
          <div className="bg-white rounded-xl p-6 shadow-sm flex flex-col items-center justify-center">
            <h3 className="font-medium text-gray-900 mb-4 self-start">Financial Health Score</h3>
            <div className={`text-6xl font-bold mb-2 ${health.score>=70?"text-green-500":health.score>=40?"text-amber-500":"text-red-500"}`}>
              {health.score}
            </div>
            <p className="text-gray-500">{health.label}</p>
            <div className="w-full bg-gray-100 rounded-full h-2 mt-4">
              <div className="bg-blue-500 h-2 rounded-full transition-all" style={{width:`${health.score}%`}}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
