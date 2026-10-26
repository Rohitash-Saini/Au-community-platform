const Message = require("../models/message");
const User = require("../models/user");
const { sendRealtimeMessage } = require("../websocket");

/**
 * GET /api/messages/:userId
 * Fetch full conversation history between current user and target user
 */
const getConversation = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { userId: targetUserId } = req.params;

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: "Target user ID is required",
      });
    }

    // Fetch messages in chronological order
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, recipient: targetUserId },
        { sender: targetUserId, recipient: currentUserId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("sender", "name profilePicture role")
      .populate("recipient", "name profilePicture role");

    // Automatically mark unread messages sent by target user as read
    await Message.updateMany(
      {
        sender: targetUserId,
        recipient: currentUserId,
        read: false,
      },
      {
        $set: { read: true, readAt: new Date() },
      }
    );

    return res.status(200).json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error) {
    console.error("Get conversation error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve conversation",
      error: error.message,
    });
  }
};

/**
 * POST /api/messages
 * Send a message via REST API (also dispatches via WebSocket if recipient is online)
 */
const sendMessage = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const recipientId =
      req.body.recipientId || req.body.receiverId || req.body.to;
    const content =
      req.body.content || req.body.message || req.body.text;

    if (!recipientId) {
      return res.status(400).json({
        success: false,
        message: "Recipient ID is required",
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message content cannot be empty",
      });
    }

    if (String(currentUserId) === String(recipientId)) {
      return res.status(400).json({
        success: false,
        message: "You cannot message yourself",
      });
    }

    // Verify recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: "Recipient not found",
      });
    }

    const newMessage = await Message.create({
      sender: currentUserId,
      recipient: recipientId,
      content: content.trim(),
    });

    const populated = await Message.findById(newMessage._id)
      .populate("sender", "name profilePicture role")
      .populate("recipient", "name profilePicture role");

    // Real-time dispatch via WebSocket
    try {
      sendRealtimeMessage(populated);
    } catch (wsErr) {
      console.warn("WebSocket notification error:", wsErr.message);
    }

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: populated,
    });
  } catch (error) {
    console.error("Send message error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: error.message,
    });
  }
};

/**
 * GET /api/messages/conversations
 * Get recent conversations list with last message and unread count
 */
const getConversationsList = async (req, res) => {
  try {
    const currentUserId = req.user.userId;

    // Find all messages involving current user, sorted newest first
    const allMessages = await Message.find({
      $or: [{ sender: currentUserId }, { recipient: currentUserId }],
    })
      .sort({ createdAt: -1 })
      .populate("sender", "name profilePicture role bio batchNumber")
      .populate("recipient", "name profilePicture role bio batchNumber");

    const conversationsMap = new Map();

    for (const msg of allMessages) {
      const isSender = String(msg.sender?._id || msg.sender) === String(currentUserId);
      const partner = isSender ? msg.recipient : msg.sender;

      if (!partner || !partner._id) continue;

      const partnerId = String(partner._id);

      if (!conversationsMap.has(partnerId)) {
        conversationsMap.set(partnerId, {
          user: partner,
          lastMessage: {
            text: msg.content,
            time: msg.createdAt,
            isSelf: isSender,
          },
          unreadCount: 0,
        });
      }

      // Count unread if current user is recipient and message is unread
      if (!isSender && !msg.read) {
        const item = conversationsMap.get(partnerId);
        item.unreadCount += 1;
      }
    }

    const conversations = Array.from(conversationsMap.values());

    return res.status(200).json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error("Get conversations list error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve conversations list",
      error: error.message,
    });
  }
};

/**
 * PUT /api/messages/:userId/read
 * Mark all messages from a user as read
 */
const markAsRead = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { userId: targetUserId } = req.params;

    await Message.updateMany(
      {
        sender: targetUserId,
        recipient: currentUserId,
        read: false,
      },
      {
        $set: { read: true, readAt: new Date() },
      }
    );

    return res.status(200).json({
      success: true,
      message: "Messages marked as read",
    });
  } catch (error) {
    console.error("Mark as read error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to mark messages as read",
      error: error.message,
    });
  }
};

module.exports = {
  getConversation,
  sendMessage,
  getConversationsList,
  markAsRead,
};
