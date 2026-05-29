import { useState, useEffect } from "react"
import { supabase } from "../supabaseClient"

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const CATEGORIES = ["Food","Travel","Shopping","Subscriptions","Bills","Entertainment","Health","Investment","Other"]

  async function updateCategory(id, newCategory) {
    await supabase.from("transactions").update({ category: newCategory }).eq("id", id)
    setTransactions(prev => prev.map(t => t.id === id ? {...t, category: newCategory} : t))
  }


  useEffect(() => {
    async function fetchTransactions() {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("transaction_date", { ascending: false })
        .limit(200)
      if (!error) setTransactions(data)
      setLoading(false)
    }
    fetchTransactions()
  }, [])

  const filtered = transactions.filter(t =>
    t.merchant.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <p className="p-8 text-gray-500">Loading...</p>

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Transactions</h2>
      <input type="text" placeholder="Search merchant..." value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm mb-4" />
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Merchant</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Category</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Amount</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{t.transaction_date}</td>
                <td className="px-4 py-3 text-gray-900">{t.merchant}</td>
                <td className="px-4 py-3">
                  <td className="px-4 py-3">
                  <select
                    value={t.category}
                    onChange={e => updateCategory(t.id, e.target.value)}
                    className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full border-0 cursor-pointer"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </td>

                </td>
                <td className={`px-4 py-3 text-right font-medium ${t.transaction_type === "credit" ? "text-green-600" : "text-red-500"}`}>
                  {t.transaction_type === "credit" ? "+" : "-"}₹{t.amount.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
