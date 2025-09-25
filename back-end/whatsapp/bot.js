import makeWASocket, { useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys"
import express from "express"
import fs from "fs"
import path from "path"
import fetch from "node-fetch"

const sessions = {}       // active WhatsApp sessions
const sessionStatus = {}  // track QR / connection state

// 🔹 Start a bot for a given project_id
async function startBot(projectId) {
  const { state, saveCreds } = await useMultiFileAuthState(`session_auth_${projectId}`)

  const sock = makeWASocket({ auth: state })

  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      console.log(`📌 [${projectId}] QR generated`)
      sessionStatus[projectId] = { status: "qr", qr }
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
      console.log(`❌ [${projectId}] Connection closed. Reconnect:`, shouldReconnect)
      sessionStatus[projectId] = { status: "closed" }
      if (shouldReconnect) startBot(projectId)
    } else if (connection === "open") {
      console.log(`✅ [${projectId}] Bot connected as`, sock.user)
      sessionStatus[projectId] = { status: "connected", user: sock.user }
    }
  })

  sessions[projectId] = sock

  // ✅ Handle incoming messages
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0]
    if (!msg.key.fromMe && msg.message?.conversation) {
      const from = msg.key.remoteJid
      const text = msg.message.conversation

      try {
        // Send message data to your backend
        const response = await fetch("http://localhost:5000/api/qa/reply", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            project_id: projectId,
            message: msg   // the message content
          }),
        })

        const data = await response.json()
        console.log("✅ Backend replied:", data)

        // Optionally, send the backend’s reply back to WhatsApp user
        if (data.reply) {
          await sock.sendMessage(from, { text: data.reply })
        }
      } catch (err) {
        console.error("❌ Error sending to backend:", err)
      }
    }
  })
}

// 🔹 Send message via a specific bot
async function sendWhatsAppMessage(projectId, to, message) {
  const sock = sessions[projectId]
  if (!sock) throw new Error(`No bot found for project ${projectId}`)
  await sock.sendMessage(to, { text: message })
}

// 🔹 Logout and delete session
async function logoutBot(projectId) {
  const sock = sessions[projectId]
  if (sock) {
    try {
      await sock.logout()
    } catch (e) {
      console.warn(`⚠️ [${projectId}] Error during logout:`, e.message)
    }
    delete sessions[projectId]
    delete sessionStatus[projectId]

    // remove saved auth folder
    const folderPath = path.join(process.cwd(), `session_auth_${projectId}`)
    if (fs.existsSync(folderPath)) {
      fs.rmSync(folderPath, { recursive: true, force: true })
      console.log(`🗑️ [${projectId}] Auth files removed`)
    }
  }
}

async function stopBot(projectId) {
  const sock = sessions[projectId]
  if (sock) {
    try {
      await sock.ws.close()   // close WebSocket connection
      delete sessions[projectId]
      sessionStatus[projectId] = { ...sessionStatus[projectId], status: "stopped" }
      console.log(`⏹️ [${projectId}] Bot stopped (auth kept)`)
    } catch (e) {
      console.warn(`⚠️ [${projectId}] Error stopping bot:`, e.message)
    }
  }
}

// 🚀 Express API
const app = express()
app.use(express.json())

// API: start a bot
app.post("/start", async (req, res) => {
  try {
    const { project_id } = req.body

    if (!sessions[project_id]) {
      await startBot(project_id)
      // wait 1s so QR/connection event can be set
      setTimeout(() => {
        const status = sessionStatus[project_id]
        if (status?.status === "qr") {
          res.json({ success: true, message: "Scan QR", qr: status.qr })
        } else if (status?.status === "connected") {
          res.json({ success: true, message: "Bot connected", user: status.user })
        } else {
          res.json({ success: true, message: "Starting bot..." })
        }
      }, 1000)
    } else {
      const status = sessionStatus[project_id]
      if (status?.status === "qr") {
        res.json({ success: true, message: "Scan QR", qr: status.qr })
      } else if (status?.status === "connected") {
        res.json({ success: true, message: "Bot connected", user: status.user })
      } else {
        res.json({ success: true, message: "Bot running, status unknown" })
      }
    }
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// API: status a bot
app.post("/status", async (req, res) => {
  try {
    const { project_id } = req.body

    if (!sessionStatus[project_id]) {
      await startBot(project_id)

      // wait 1s so QR/connection event can be set
      setTimeout(() => {
        const status = sessionStatus[project_id]
        if (status?.status === "qr") {
          res.json({ success: true, message: "Scan QR", qr: status.qr })
        } else if (status?.status === "connected") {
          res.json({ success: true, message: "Bot connected", user: status.user })
        } else {
          res.json({ success: true, message: "Starting bot..." })
        }
      }, 1000)
    } else {
      const status = sessionStatus[project_id]
      console.log(status)
      if (status?.status === "qr") {
        res.json({ success: true, message: "Scan QR", qr: status.qr })
      } else if (status?.status === "connected") {
        res.json({ success: true, message: "Bot connected", user: status.user })
      } else if (status?.status === "closed") {
        res.json({ success: true, message: "Bot stopped", user: status.user })
      } else {
        res.json({ success: true, message: "Bot running, status unknown" })
      }
    }
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// API: send message
app.post("/send", async (req, res) => {
  try {
    const { project_id, to, message } = req.body
    await sendWhatsAppMessage(project_id, `${to}@s.whatsapp.net`, message)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// API: stop bot
app.post("/stop", async (req, res) => {
  try {
    const { project_id } = req.body
    if (!sessions[project_id]) {
      return res.status(400).json({ error: `No active bot for ${project_id}` })
    }
    await stopBot(project_id)
    res.json({ success: true, message: `Bot for ${project_id} stopped (auth kept)` })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// API: logout bot
app.post("/logout", async (req, res) => {
  try {
    const { project_id } = req.body
    if (!sessions[project_id]) {
      return res.status(400).json({ error: `No active bot for ${project_id}` })
    }
    await logoutBot(project_id)
    res.json({ success: true, message: `Bot for ${project_id} logged out` })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.listen(4000, () => {
  console.log("🌐 API server running at http://localhost:4000")
})
