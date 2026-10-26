import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import API from "../../../api";
import UserProfileModal from "../../common/UserProfileModal";
import "../../../styles/StudentStyle/StudentMessages.css";

const normalizeUser = (user, index = 0, lastMsgInfo = null, isOnline = false) => {
  const name =
    user?.name ||
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
    "AU Community Member";

  const avatar =
    user?.avatar ||
    user?.profilePicture ||
    user?.photo ||
    name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const formattedTime = lastMsgInfo?.time
    ? new Date(lastMsgInfo.time).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : user?.time || "";

  return {
    _id: String(user?._id || user?.id || `user-${index}`),
    name,
    role: user?.role === "teacher" ? "Faculty" : user?.role || "Student",
    designation:
      user?.designation ||
      user?.batchNumber ||
      user?.course ||
      user?.department ||
      (user?.role === "teacher" ? "Faculty Member" : "Student"),
    department:
      user?.department ||
      user?.branch ||
      user?.faculty ||
      "AU Community",
    avatar,
    lastMessage:
      lastMsgInfo?.text ||
      user?.lastMessage ||
      user?.latestMessage?.text ||
      "Start a conversation",
    time: formattedTime,
    unreadCount: lastMsgInfo?.unreadCount || 0,
    online: Boolean(isOnline || user?.online || user?.isOnline),
    rawUser: user,
  };
};

function Message() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState("");
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [viewingProfileUser, setViewingProfileUser] = useState(null);

  const socketRef = useRef(null);
  const chatEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const partnerTypingTimeoutRef = useRef(null);

  // Current logged in user info
  const currentUser = useMemo(() => {
    try {
      const stored = localStorage.getItem("au_user");
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  }, []);

  const currentUserId = useMemo(() => {
    return String(currentUser?._id || currentUser?.id || "");
  }, [currentUser]);

  const token = localStorage.getItem("au_token");

  // Smooth scroll to chat bottom
  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isPartnerTyping, scrollToBottom]);

  // Fetch conversations and all users
  const loadConversationsAndUsers = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, convosRes] = await Promise.allSettled([
        API.get("/users"),
        API.get("/messages/conversations"),
      ]);

      const rawUsers =
        usersRes.status === "fulfilled"
          ? Array.isArray(usersRes.value?.data)
            ? usersRes.value.data
            : usersRes.value?.data?.users || []
          : [];

      const rawConvos =
        convosRes.status === "fulfilled"
          ? convosRes.value?.data?.conversations || []
          : [];

      // Map conversation info by partner ID
      const convosMap = new Map();
      rawConvos.forEach((item) => {
        const partnerId = String(item.user?._id || item.user?.id || "");
        if (partnerId) {
          convosMap.set(partnerId, {
            text: item.lastMessage?.text || "",
            time: item.lastMessage?.time || "",
            unreadCount: item.unreadCount || 0,
            user: item.user,
          });
        }
      });

      // Filter out self
      const otherUsers = rawUsers.filter(
        (u) => String(u._id || u.id) !== currentUserId
      );

      // Prioritize users with existing conversations first
      const normalizedList = otherUsers.map((u, idx) => {
        const uid = String(u._id || u.id);
        const lastMsgInfo = convosMap.get(uid);
        const isOnline = onlineUserIds.has(uid);
        return normalizeUser(u, idx, lastMsgInfo, isOnline);
      });

      // Sort: users with conversations first (newest timestamp first), then others
      normalizedList.sort((a, b) => {
        const hasA = convosMap.has(a._id);
        const hasB = convosMap.has(b._id);
        if (hasA && !hasB) return -1;
        if (!hasA && hasB) return 1;
        return 0;
      });

      setUsers(normalizedList);

      // Set initial selected user if none selected
      setSelectedUser((prev) => {
        if (prev) {
          const updated = normalizedList.find((u) => u._id === prev._id);
          return updated || prev;
        }
        return normalizedList[0] || null;
      });
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, onlineUserIds]);

  useEffect(() => {
    loadConversationsAndUsers();
  }, [loadConversationsAndUsers]);

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!selectedUser?._id) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      setMessagesLoading(true);
      setIsPartnerTyping(false);
      try {
        const response = await API.get(`/messages/${selectedUser._id}`);
        const list = Array.isArray(response?.data?.messages)
          ? response.data.messages
          : Array.isArray(response?.data)
          ? response.data
          : [];

        const formatted = list.map((msg, index) => {
          const senderId = String(msg.sender?._id || msg.sender);
          const isMe = senderId === currentUserId;
          return {
            id: msg._id || msg.id || `msg-${index}`,
            sender: isMe ? "me" : "other",
            text: msg.content || msg.message || "",
            time: msg.createdAt
              ? new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "",
          };
        });

        setMessages(formatted);

        // Clear unread badge in sidebar
        setUsers((prev) =>
          prev.map((u) =>
            u._id === selectedUser._id ? { ...u, unreadCount: 0 } : u
          )
        );
      } catch (error) {
        console.error("Failed to fetch messages for user:", error);
        setMessages([]);
      } finally {
        setMessagesLoading(false);
      }
    };

    fetchMessages();
  }, [selectedUser?._id, currentUserId]);

  // Setup WebSocket connection for real-time messaging
  useEffect(() => {
    if (!token) return;

    let socket = null;
    let reconnectTimeout = null;
    let isComponentMounted = true;

    const connectWebSocket = () => {
      try {
        const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsHost = window.location.hostname || "localhost";
        const wsPort = "5000"; // backend port
        const wsUrl = `${wsProtocol}//${wsHost}:${wsPort}/?token=${encodeURIComponent(token)}`;

        socket = new WebSocket(wsUrl);
        socketRef.current = socket;

        socket.onopen = () => {
          console.log("WebSocket connected successfully for messaging");
          // Heartbeat ping
          socket.send(JSON.stringify({ type: "GET_ONLINE_USERS" }));
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === "ONLINE_USERS") {
              const idsSet = new Set((data.users || []).map(String));
              setOnlineUserIds(idsSet);
              setUsers((prev) =>
                prev.map((u) => ({
                  ...u,
                  online: idsSet.has(u._id),
                }))
              );
              setSelectedUser((prev) =>
                prev ? { ...prev, online: idsSet.has(prev._id) } : prev
              );
            }

            if (data.type === "NEW_MESSAGE") {
              const msg = data.message;
              const senderId = String(msg.sender?._id || msg.sender);
              const recipientId = String(msg.recipient?._id || msg.recipient);

              // Update conversation preview in sidebar
              const partnerId = senderId === currentUserId ? recipientId : senderId;
              const timeStr = new Date(msg.createdAt || Date.now()).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });

              setUsers((prev) => {
                const partnerUser = prev.find((u) => u._id === partnerId);
                const updatedList = prev.map((u) => {
                  if (u._id === partnerId) {
                    return {
                      ...u,
                      lastMessage: msg.content,
                      time: timeStr,
                      unreadCount:
                        selectedUser?._id === partnerId
                          ? 0
                          : (u.unreadCount || 0) + 1,
                    };
                  }
                  return u;
                });

                // Move conversation to top
                if (partnerUser) {
                  return [
                    updatedList.find((u) => u._id === partnerId),
                    ...updatedList.filter((u) => u._id !== partnerId),
                  ];
                }
                return updatedList;
              });

              // If currently in conversation with this sender:
              if (selectedUser?._id === senderId || selectedUser?._id === partnerId) {
                const formattedNewMsg = {
                  id: msg._id || `msg-${Date.now()}`,
                  sender: senderId === currentUserId ? "me" : "other",
                  text: msg.content,
                  time: timeStr,
                };

                setMessages((prev) => [...prev, formattedNewMsg]);
                setIsPartnerTyping(false);

                // Auto mark as read
                if (senderId !== currentUserId) {
                  socket.send(
                    JSON.stringify({
                      type: "MARK_READ",
                      senderId,
                    })
                  );
                }
              }
            }

            if (data.type === "USER_TYPING") {
              const { senderId, isTyping } = data;
              if (selectedUser?._id === String(senderId)) {
                setIsPartnerTyping(Boolean(isTyping));

                if (partnerTypingTimeoutRef.current) {
                  clearTimeout(partnerTypingTimeoutRef.current);
                }

                if (isTyping) {
                  partnerTypingTimeoutRef.current = setTimeout(() => {
                    setIsPartnerTyping(false);
                  }, 3000);
                }
              }
            }
          } catch (parseErr) {
            console.error("WebSocket message parse error:", parseErr);
          }
        };

        socket.onclose = () => {
          if (isComponentMounted) {
            reconnectTimeout = setTimeout(connectWebSocket, 4000);
          }
        };

        socket.onerror = (err) => {
          console.warn("WebSocket connection warning:", err);
        };
      } catch (err) {
        console.error("Failed to establish WebSocket:", err);
      }
    };

    connectWebSocket();

    // Heartbeat ping interval
    const pingInterval = setInterval(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: "PING" }));
      }
    }, 25000);

    return () => {
      isComponentMounted = false;
      clearInterval(pingInterval);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [token, currentUserId, selectedUser?._id]);

  // Handle typing notification to partner
  const handleTextChange = (e) => {
    const val = e.target.value;
    setMessageText(val);

    if (
      socketRef.current?.readyState === WebSocket.OPEN &&
      selectedUser?._id
    ) {
      socketRef.current.send(
        JSON.stringify({
          type: "TYPING",
          recipientId: selectedUser._id,
          isTyping: true,
        })
      );

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(
            JSON.stringify({
              type: "TYPING",
              recipientId: selectedUser._id,
              isTyping: false,
            })
          );
        }
      }, 1500);
    }
  };

  // Toast auto-clear
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast("");
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Filter users by search
  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;

    return users.filter((user) => {
      return [
        user.name,
        user.role,
        user.designation,
        user.department,
        user.lastMessage,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [users, search]);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setMobileChatOpen(true);
  };

  const handleBackToUsers = () => {
    setMobileChatOpen(false);
  };

  // Send message handler
  const handleSendMessage = async () => {
    const text = messageText.trim();
    if (!text || !selectedUser?._id || sending) return;

    const timeStr = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const localMsg = {
      id: `local-${Date.now()}`,
      sender: "me",
      text,
      time: timeStr,
    };

    // Optimistic UI update
    setMessages((prev) => [...prev, localMsg]);
    setMessageText("");
    setSending(true);

    // Stop typing indicator
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "TYPING",
          recipientId: selectedUser._id,
          isTyping: false,
        })
      );
    }

    // Update last message in sidebar immediately
    setUsers((prev) => {
      const updated = prev.map((u) =>
        u._id === selectedUser._id
          ? { ...u, lastMessage: text, time: timeStr }
          : u
      );
      const activeItem = updated.find((u) => u._id === selectedUser._id);
      return [
        activeItem,
        ...updated.filter((u) => u._id !== selectedUser._id),
      ];
    });

    try {
      // If WebSocket is open, send through WebSocket
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: "SEND_MESSAGE",
            recipientId: selectedUser._id,
            content: text,
          })
        );
      } else {
        // Fallback to REST API
        await API.post("/messages", {
          recipientId: selectedUser._id,
          content: text,
        });
      }
    } catch (error) {
      console.error("Message send error:", error);
      setToast("Failed to send message over network.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="student-message-page">
      {/* ================= HEADER ================= */}
      <div className="student-message-header">
        <div>
          <span className="student-message-eyebrow">AU Community</span>
          <h1>Messages</h1>
          <p>Connect, collaborate and chat in real-time with your AU Community.</p>
        </div>

        <div className="student-message-header-icon">💬</div>
      </div>

      {/* ================= CHAT CONTAINER ================= */}
      <div
        className={`student-message-container ${
          mobileChatOpen ? "mobile-chat-active" : ""
        }`}
      >
        {/* ================= SIDEBAR ================= */}
        <aside className="student-message-sidebar">
          <div className="student-message-sidebar-head">
            <div>
              <h2>Conversations</h2>
              <span>{users.length} community members</span>
            </div>

            <div className="student-message-count">{users.length}</div>
          </div>

          <div className="student-message-search">
            <span>⌕</span>
            <input
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="student-message-user-list">
            {loading ? (
              <div className="student-message-loading-list">
                <span className="student-message-loader" />
                <p>Loading conversations...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="student-message-no-users">
                <div>🔎</div>
                <p>No conversations found.</p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <button
                  type="button"
                  key={user._id}
                  className={`student-message-user ${
                    selectedUser?._id === user._id ? "active" : ""
                  }`}
                  onClick={() => handleSelectUser(user)}
                >
                  <div className="student-message-avatar-wrap">
                    <div className="student-message-avatar">
                      {user.avatar?.length > 3 ? (
                        <img src={user.avatar} alt={user.name} />
                      ) : (
                        user.avatar
                      )}
                    </div>
                    {user.online && <span className="student-message-online" />}
                  </div>

                  <div className="student-message-user-info">
                    <div className="student-message-user-top">
                      <strong>{user.name}</strong>
                      <span>{user.time}</span>
                    </div>

                    <div className="student-message-user-role">
                      {user.designation}
                    </div>

                    <p>{user.lastMessage}</p>
                  </div>

                  {user.unreadCount > 0 && (
                    <span
                      style={{
                        backgroundColor: "var(--sm-orange)",
                        color: "#ffffff",
                        fontSize: "10px",
                        fontWeight: "800",
                        padding: "2px 7px",
                        borderRadius: "10px",
                        alignSelf: "center",
                      }}
                    >
                      {user.unreadCount}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </aside>

        {/* ================= CHAT AREA ================= */}
        <main className="student-message-chat">
          {!selectedUser ? (
            <div className="student-message-empty-chat">
              <div className="student-message-empty-icon">💬</div>
              <h2>Select a conversation</h2>
              <p>Choose someone from your community to start messaging.</p>
            </div>
          ) : (
            <>
              {/* CHAT HEADER */}
              <header className="student-message-chat-head">
                <button
                  type="button"
                  className="student-message-mobile-back"
                  onClick={handleBackToUsers}
                >
                  ←
                </button>

                <div
                  className="student-message-chat-profile"
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    setViewingProfileUser(selectedUser.rawUser || selectedUser)
                  }
                  title="View Profile"
                >
                  <div className="student-message-avatar-wrap">
                    <div className="student-message-avatar large">
                      {selectedUser.avatar?.length > 3 ? (
                        <img
                          src={selectedUser.avatar}
                          alt={selectedUser.name}
                        />
                      ) : (
                        selectedUser.avatar
                      )}
                    </div>
                    {selectedUser.online && (
                      <span className="student-message-online" />
                    )}
                  </div>

                  <div>
                    <h2>{selectedUser.name}</h2>
                    <p>
                      {isPartnerTyping ? (
                        <span style={{ color: "var(--sm-orange)", fontWeight: "700" }}>
                          Typing...
                        </span>
                      ) : selectedUser.online ? (
                        "Online now"
                      ) : (
                        selectedUser.designation
                      )}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="student-message-chat-more"
                  title="View Profile"
                  onClick={() =>
                    setViewingProfileUser(selectedUser.rawUser || selectedUser)
                  }
                >
                  ⋮
                </button>
              </header>

              {/* CHAT BODY */}
              <div className="student-message-chat-body">
                <div className="student-message-date-divider">
                  <span>Conversation</span>
                </div>

                {messagesLoading ? (
                  <div className="student-message-chat-loading">
                    <span className="student-message-loader" />
                    <p>Loading messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="student-message-no-messages">
                    <div>👋</div>
                    <h3>Start the conversation</h3>
                    <p>Send a message to {selectedUser.name}.</p>
                  </div>
                ) : (
                  <div className="student-message-list">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`student-message-row ${
                          message.sender === "me" ? "mine" : "theirs"
                        }`}
                      >
                        <div className="student-message-bubble">
                          <p>{message.text}</p>
                          <span>{message.time}</span>
                        </div>
                      </div>
                    ))}
                    {isPartnerTyping && (
                      <div className="student-message-row theirs">
                        <div
                          className="student-message-bubble"
                          style={{
                            fontStyle: "italic",
                            color: "var(--sm-muted)",
                            backgroundColor: "rgba(185, 180, 234, 0.15)",
                          }}
                        >
                          <p>{selectedUser.name} is typing...</p>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                )}
              </div>

              {/* CHAT COMPOSER */}
              <footer className="student-message-composer">
                <button
                  type="button"
                  className="student-message-attach"
                  title="Attach file"
                  onClick={() => setToast("File attachment feature coming soon.")}
                >
                  +
                </button>

                <textarea
                  value={messageText}
                  onChange={handleTextChange}
                  onKeyDown={handleKeyDown}
                  placeholder={`Message ${selectedUser.name}...`}
                  rows={1}
                />

                <button
                  type="button"
                  className="student-message-send"
                  disabled={!messageText.trim() || sending}
                  onClick={handleSendMessage}
                >
                  {sending ? "..." : "➤"}
                </button>
              </footer>
            </>
          )}
        </main>
      </div>

      {/* Profile Modal */}
      {viewingProfileUser && (
        <UserProfileModal
          user={viewingProfileUser}
          userId={viewingProfileUser._id || viewingProfileUser.id}
          onClose={() => setViewingProfileUser(null)}
        />
      )}

      {/* Toast Notification */}
      {toast && <div className="student-message-toast">{toast}</div>}
    </div>
  );
}

export default Message;