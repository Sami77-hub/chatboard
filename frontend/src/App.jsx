import { useState, useEffect, useRef } from 'react'

const ROOMS = ['general', 'gaming', 'music', 'tech', 'random']
const WS_URL = 'ws://localhost:3000'

export default function App() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [room, setRoom] = useState('general')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [onlineUsers, setOnlineUsers] = useState([])
  const [error, setError] = useState('')
  const [locked, setLocked] = useState(false)
  const wsRef = useRef(null)
  const bottomRef = useRef(null)

  const handleLogin = (e) => {
    e.preventDefault()
    if (email.trim() && username.trim()) setLoggedIn(true)
  }

  useEffect(() => {
    if (!loggedIn) return

    fetch(`/api/messages/${room}`)
      .then((r) => r.json())
      .then(setMessages)
      .catch(console.error)

    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'join', email, username, room }))
    }

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data)
      if (data.type === 'message') {
        setMessages((prev) => [...prev, data])
      } else if (data.type === 'onlineUsers') {
        setOnlineUsers(data.users)
      } else if (data.type === 'error') {
        setError(data.message)
        if (data.message.includes('lock')) setLocked(true)
      }
    }

    ws.onclose = () => console.log('WebSocket disconnect')

    return () => ws.close()
  }, [loggedIn, room])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = (e) => {
    e.preventDefault()
    if (!input.trim() || !wsRef.current || locked) return
    wsRef.current.send(
      JSON.stringify({ type: 'message', email, username, text: input, room })
    )
    setInput('')
  }

  const changeRoom = (newRoom) => {
    setMessages([])
    setRoom(newRoom)
  }

  // ── LOGIN ──
  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-sm">
          <h1 className="text-3xl font-bold text-white text-center mb-2">
            💬 ChatBoard
          </h1>
          <p className="text-gray-400 text-center mb-6">Login karo</p>
          {error && (
            <p className="text-red-400 text-sm text-center mb-4 bg-red-900/30 py-2 px-3 rounded-lg">
              {error}
            </p>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              placeholder="Email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="text"
              placeholder="Username..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition"
            >
              Join Chat →
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ── CHAT ──
  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="w-56 bg-gray-800 flex flex-col p-4 gap-2">
        <h2 className="text-lg font-bold mb-2 text-indigo-400">💬 ChatBoard</h2>
        <p className="text-xs text-gray-400 mb-3">👤 {username}</p>

        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Rooms</p>
        {ROOMS.map((r) => (
          <button
            key={r}
            onClick={() => changeRoom(r)}
            className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
              room === r ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            # {r}
          </button>
        ))}

        <div className="mt-auto">
          <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
            Online ({onlineUsers.length})
          </p>
          {onlineUsers.map((u) => (
            <div key={u} className="flex items-center gap-2 text-sm text-gray-300 mb-1">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              {u}
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="px-6 py-4 bg-gray-800 border-b border-gray-700">
          <h3 className="font-bold text-lg"># {room}</h3>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {messages.length === 0 && (
            <p className="text-gray-500 text-center mt-10">
              Koi message nahi — pehla message bhejo! 👋
            </p>
          )}
          {messages.map((msg, i) => (
            <div key={msg._id || i} className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold shrink-0">
                {msg.username[0].toUpperCase()}
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-indigo-300 text-sm">{msg.username}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-gray-200 text-sm mt-0.5">{msg.text}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Error / Lock banner */}
        {error && (
          <div className="mx-6 mb-2 px-4 py-2 bg-red-900/40 border border-red-500 rounded-xl text-red-300 text-sm text-center">
            {error}
          </div>
        )}

        <form
          onSubmit={sendMessage}
          className="px-6 py-4 bg-gray-800 border-t border-gray-700 flex gap-3"
        >
          <input
            type="text"
            placeholder={locked ? '🔒 Aap lock hain...' : `#${room} mein message bhejo...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={locked}
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={locked}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}