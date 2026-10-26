const { server: WebSocketServer } = require("websocket");
const jwt = require("jsonwebtoken");
const url = require("url");
const Message = require("./models/message");
const User = require("./models/user");

// Map: userId -> Set of active connection objects
const userSockets = new Map();

function getOnlineUserIds() {
  return Array.from(userSockets.keys());
}

function isUserOnline(userId) {
  if (!userId) return false;
  const set = userSockets.get(String(userId));
  return Boolean(set && set.size > 0);
}

function sendToUser(userId, data) {
  const targetId = String(userId);
  const connections = userSockets.get(targetId);
  if (!connections || connections.size === 0) return false;

  const payload = JSON.stringify(data);
  connections.forEach((conn) => {
    try {
      if (conn.connected) {
        conn.sendUTF(payload);
      }
    } catch (err) {
      console.error(`Failed to send to user ${targetId}:`, err.message);
    }
  });
  return true;
}

function sendRealtimeMessage(messageDoc) {
  if (!messageDoc) return;
  const messageData = messageDoc.toObject ? messageDoc.toObject() : messageDoc;

  const recipientId = String(messageData.recipient?._id || messageData.recipient);
  const senderId = String(messageData.sender?._id || messageData.sender);

  // Deliver to recipient
  sendToUser(recipientId, {
    type: "NEW_MESSAGE",
    message: messageData,
  });

  // Also notify sender's other connected devices/tabs
  sendToUser(senderId, {
    type: "MESSAGE_SENT",
    message: messageData,
  });
}

function broadcastOnlineStatus() {
  const onlineList = getOnlineUserIds();
  const payload = JSON.stringify({
    type: "ONLINE_USERS",
    users: onlineList,
  });

  userSockets.forEach((connections) => {
    connections.forEach((conn) => {
      try {
        if (conn.connected) conn.sendUTF(payload);
      } catch (err) {
        // ignore
      }
    });
  });
}

function initWebSocketServer(httpServer) {
  const wsServer = new WebSocketServer({
    httpServer,
    autoAcceptConnections: false,
    maxReceivedFrameSize: 64 * 1024,
    maxReceivedMessageSize: 10 * 1024 * 1024,
  });

  wsServer.on("request", async (request) => {
    try {
      const parsedUrl = url.parse(request.httpRequest.url, true);
      let token = parsedUrl.query.token;

      let userId = null;

      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          userId = String(decoded.id || decoded.userId || decoded._id);
        } catch (err) {
          console.warn("WebSocket token verification failed from query:", err.message);
        }
      }

      // Accept connection
      const connection = request.accept(null, request.origin);

      // Handle unauthenticated until first AUTH message or accepted with userId
      if (userId) {
        registerUserConnection(userId, connection);
      }

      connection.on("message", async (data) => {
        if (data.type !== "utf8") return;

        let parsed;
        try {
          parsed = JSON.parse(data.utf8Data);
        } catch (err) {
          return;
        }

        const { type } = parsed;

        if (type === "PING") {
          connection.sendUTF(JSON.stringify({ type: "PONG" }));
          return;
        }

        if (type === "AUTH") {
          try {
            const decoded = jwt.verify(parsed.token, process.env.JWT_SECRET);
            userId = String(decoded.id || decoded.userId || decoded._id);
            registerUserConnection(userId, connection);
            connection.sendUTF(
              JSON.stringify({
                type: "AUTH_SUCCESS",
                userId,
                onlineUsers: getOnlineUserIds(),
              })
            );
          } catch (err) {
            connection.sendUTF(
              JSON.stringify({ type: "AUTH_ERROR", message: "Invalid token" })
            );
          }
          return;
        }

        if (!userId) {
          connection.sendUTF(
            JSON.stringify({
              type: "ERROR",
              message: "Unauthenticated WebSocket connection",
            })
          );
          return;
        }

        if (type === "GET_ONLINE_USERS") {
          connection.sendUTF(
            JSON.stringify({
              type: "ONLINE_USERS",
              users: getOnlineUserIds(),
            })
          );
          return;
        }

        if (type === "SEND_MESSAGE") {
          const { recipientId, content } = parsed;
          if (!recipientId || !content || !content.trim()) {
            connection.sendUTF(
              JSON.stringify({
                type: "ERROR",
                message: "recipientId and content are required",
              })
            );
            return;
          }

          try {
            const recipientExists = await User.findById(recipientId);
            if (!recipientExists) {
              connection.sendUTF(
                JSON.stringify({
                  type: "ERROR",
                  message: "Recipient not found",
                })
              );
              return;
            }

            const newMsg = await Message.create({
              sender: userId,
              recipient: recipientId,
              content: content.trim(),
            });

            const populated = await Message.findById(newMsg._id)
              .populate("sender", "name profilePicture role")
              .populate("recipient", "name profilePicture role");

            sendRealtimeMessage(populated);
          } catch (err) {
            console.error("WebSocket message creation error:", err.message);
            connection.sendUTF(
              JSON.stringify({
                type: "ERROR",
                message: "Failed to save message",
              })
            );
          }
          return;
        }

        if (type === "TYPING") {
          const { recipientId, isTyping } = parsed;
          if (recipientId) {
            sendToUser(recipientId, {
              type: "USER_TYPING",
              senderId: userId,
              isTyping: Boolean(isTyping),
            });
          }
          return;
        }

        if (type === "MARK_READ") {
          const { senderId } = parsed;
          if (senderId) {
            try {
              await Message.updateMany(
                { sender: senderId, recipient: userId, read: false },
                { $set: { read: true, readAt: new Date() } }
              );
              sendToUser(senderId, {
                type: "MESSAGES_READ",
                readBy: userId,
              });
            } catch (err) {
              console.error("Mark read error:", err.message);
            }
          }
          return;
        }
      });

      connection.on("close", () => {
        if (userId) {
          unregisterUserConnection(userId, connection);
        }
      });
    } catch (err) {
      console.error("WebSocket request handling error:", err);
      try {
        request.reject();
      } catch (e) {
        // ignore
      }
    }
  });

  console.log("WebSocket server initialized successfully");
  return wsServer;
}

function registerUserConnection(userId, connection) {
  const idStr = String(userId);
  if (!userSockets.has(idStr)) {
    userSockets.set(idStr, new Set());
  }
  userSockets.get(idStr).add(connection);
  broadcastOnlineStatus();
}

function unregisterUserConnection(userId, connection) {
  const idStr = String(userId);
  const userSet = userSockets.get(idStr);
  if (userSet) {
    userSet.delete(connection);
    if (userSet.size === 0) {
      userSockets.delete(idStr);
      broadcastOnlineStatus();
    }
  }
}

module.exports = {
  initWebSocketServer,
  sendRealtimeMessage,
  sendToUser,
  isUserOnline,
  getOnlineUserIds,
};
