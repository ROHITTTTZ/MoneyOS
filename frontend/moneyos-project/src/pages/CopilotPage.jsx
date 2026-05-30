import { useState, useRef, useEffect } from "react"
import { supabase } from "../supabaseClient"

const SUGGESTIONS = [
  "Where am I overspending this month?",
  "What is my savings rate?",
  "Can I afford to spend ₹5000 more this month?",
  "Which category should I cut back on?",
  "Am I on track with my finances?",
]

export default function CopilotPage() {
  const [messages, setMessages] = useState([
    { role: "ai", text: "Hi! I'm your MoneyOS AI. Ask me anything about your finances." }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  async function sendMessage(text) {
    const msg = text || input
    if (!msg.trim()) return
    setMessages(prev => [...prev, { role: "user", text: msg }])
    setInput("")
    setLoading(true)

    const { data: s } = await supabase.auth.getSession()
    const token = s.session.access_token

    const res = await fetch("http://localhost:8000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message: msg })
    })
    const data = await res.json()
    setMessages(prev => [...prev, { role: "ai", text: data.answer }])
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto p-8 flex flex-col" style={{height:"calc(100vh - 60px)"}}>
      <h2 className="text-xl font-bold text-gray-900 mb-4">AI Copilot</h2>

      {/* Suggestions */}
      <div className="flex gap-2 flex-wrap mb-4">
        {SUGGESTIONS.map(s => (
          <button key={s} onClick={() => sendMessage(s)}
            className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full hover:bg-blue-100">
            {s}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-white rounded-xl shadow-sm p-4 mb-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role==="user"?"justify-end":"justify-start"}`}>
            <div className={`max-w-xs md:max-w-md px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              m.role==="user"?"bg-blue-600 text-white":"bg-gray-100 text-gray-800"
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-3 rounded-2xl text-gray-400 text-sm">Thinking...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key==="Enter" && sendMessage()}
          placeholder="Ask about your finances..."
          className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm" />
        <button onClick={() => sendMessage()}
          className="bg-blue-600 text-white px-5 py-3 rounded-xl text-sm font-medium">Send</button>
      </div>
    </div>
  )
}
