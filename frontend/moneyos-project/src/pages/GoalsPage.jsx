import { useState, useEffect } from "react"
import { supabase } from "../supabaseClient"

export default function GoalsPage() {
  const [goals, setGoals] = useState([])
  const [form, setForm] = useState({ name: "", target_amount: "", deadline: "" })
  const [loading, setLoading] = useState(false)

  async function getToken() {
    const { data } = await supabase.auth.getSession()
    return data.session.access_token
  }

  async function fetchGoals() {
    const token = await getToken()
    const res = await fetch("http://localhost:8000/goals", {
      headers: { Authorization: `Bearer ${token}` }
    })
    setGoals(await res.json())
  }

  useEffect(() => { fetchGoals() }, [])

  async function createGoal() {
    setLoading(true)
    const token = await getToken()
    await fetch("http://localhost:8000/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...form, target_amount: parseFloat(form.target_amount) })
    })
    setForm({ name: "", target_amount: "", deadline: "" })
    await fetchGoals()
    setLoading(false)
  }

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Financial Goals</h2>

      {/* Create Goal Form */}
      <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
        <h3 className="font-medium text-gray-700 mb-4">New Goal</h3>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <input placeholder="Goal name (e.g. Buy laptop)" value={form.name}
            onChange={e => setForm({...form, name: e.target.value})}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm col-span-3 md:col-span-1" />
          <input placeholder="Target amount (₹)" type="number" value={form.target_amount}
            onChange={e => setForm({...form, target_amount: e.target.value})}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          <input type="date" value={form.deadline}
            onChange={e => setForm({...form, deadline: e.target.value})}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <button onClick={createGoal} disabled={loading || !form.name || !form.target_amount}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm disabled:opacity-50">
          Add Goal
        </button>
      </div>

      {/* Goals List */}
      <div className="space-y-4">
        {goals.map(g => (
          <div key={g.id} className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-medium text-gray-900">{g.name}</h3>
                <p className="text-sm text-gray-500">Target: ₹{g.target_amount.toLocaleString()} by {g.deadline}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${g.on_track?"bg-green-50 text-green-600":"bg-red-50 text-red-500"}`}>
                {g.on_track ? "On track" : "Behind"}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{width:`${Math.min(g.progress_pct,100)}%`}}></div>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>₹{g.current_amount.toLocaleString()} saved</span>
              <span>Need ₹{g.monthly_needed.toLocaleString()}/month</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
