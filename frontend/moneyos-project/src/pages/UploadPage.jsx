import { useState } from "react"
import { supabase } from "../supabaseClient"

export default function UploadPage() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState("")

  function handleFileChange(e) {
    const selected = e.target.files[0]
    const allowed = ["application/pdf", "text/csv", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]
    if (!allowed.includes(selected.type)) {
      setError("Only PDF, CSV, and XLSX files are allowed.")
      return
    }
    setFile(selected)
    setError("")
  }

  async function handleUpload() {
    if (!file) return
    setLoading(true)
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData.session.access_token

    const formData = new FormData()
    formData.append("file", file)

    const res = await fetch("http://localhost:8000/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })
    const data = await res.json()
    if (!res.ok) setError(data.detail || "Upload failed")
    else setResult(data)
    setLoading(false)
  }

  return (
    <div className="max-w-xl mx-auto mt-12 p-8 bg-white rounded-xl shadow-sm">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Upload Bank Statement</h2>
      <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center mb-4">
        <input type="file" accept=".pdf,.csv,.xlsx" onChange={handleFileChange}
          className="w-full text-sm text-gray-500" />
        <p className="text-xs text-gray-400 mt-2">PDF, CSV, or Excel (.xlsx)</p>
      </div>
      {file && <p className="text-sm text-gray-600 mb-4">Selected: {file.name}</p>}
      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
      <button onClick={handleUpload} disabled={!file || loading}
        className="w-full bg-blue-600 text-white rounded-lg px-4 py-3 text-sm font-medium disabled:opacity-50">
        {loading ? "Parsing..." : "Upload & Parse"}
      </button>
      {result && (
        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <p className="text-green-700 font-medium">✓ {result.inserted} transactions imported</p>
        </div>
      )}
    </div>
  )
}
