const { WebSocketServer } = require('ws');
const Message = require('../models/Message');
const { checkAccess, trackMessage } = require('../middleware/accessControl');

const clients = new Map();

const initWebSocket = (server) => {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    console.log('Naya connection aya');

    ws.on('message', async (data) => {
      try {
        const parsed = JSON.parse(data);
        const { type, email, username, text, room } = parsed;

        // JOIN
        if (type === 'join') {
          const access = checkAccess(email);

          if (!access.allowed) {
            ws.send(JSON.stringify({
              type: 'error',
              message: access.reason
            }));
            ws.close();
            return;
          }

          clients.set(ws, { email, username, room, isAdmin: access.isAdmin });
          console.log(`${username} (${email}) joined room: ${room}`);
          broadcastOnlineUsers(wss, room);
          return;
        }

        // MESSAGE
        if (type === 'message') {
          const clientInfo = clients.get(ws);
          if (!clientInfo) return;

          const result = trackMessage(clientInfo.email);

          if (!result.canSend) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Aap lock ho gaye hain. Aur message nahi bhej sakte.'
            }));
            return;
          }

          const saved = await Message.create({
            username: clientInfo.username,
            text,
            room
          });

          const messageData = JSON.stringify({
            type: 'message',
            _id: saved._id,
            username: clientInfo.username,
            text,
            room,
            createdAt: saved.createdAt,
          });

          // Us room ke saare users ko bhejo
          wss.clients.forEach((client) => {
            const info = clients.get(client);
            if (client.readyState === 1 && info?.room === room) {
              client.send(messageData);
            }
          });

          // Agar ab lock hua toh notify karo
          if (result.nowLocked) {
            ws.send(JSON.stringify({
              type: 'error',
              message: '⚠️ Aapke 2 messages ho gaye. Ab aap lock hain.'
            }));
          }
        }

      } catch (err) {
        console.error('WebSocket error:', err.message);
      }
    });

    ws.on('close', () => {
      const userInfo = clients.get(ws);
      if (userInfo) {
        console.log(`${userInfo.username} disconnect`);
        clients.delete(ws);
        broadcastOnlineUsers(wss, userInfo.room);
      }
    });
  });

  console.log('WebSocket server ready!');
};

const broadcastOnlineUsers = (wss, room) => {
  const onlineUsers = [];
  clients.forEach((info) => {
    if (info.room === room) onlineUsers.push(info.username);
  });

  const data = JSON.stringify({ type: 'onlineUsers', users: onlineUsers });

  wss.clients.forEach((client) => {
    const info = clients.get(client);
    if (client.readyState === 1 && info?.room === room) {
      client.send(data);
    }
  });
};

module.exports = { initWebSocket };