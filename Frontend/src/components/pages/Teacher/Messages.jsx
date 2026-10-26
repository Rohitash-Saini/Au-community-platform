import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import API from "../../../api";
import UserProfileModal from "../../common/UserProfileModal";
import "../../../styles/TeacherStyle/TeacherMessages.css";

const Messages = () => {
  const [conversations, setConversations] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [viewingProfileUser, setViewingProfileUser] = useState(null);
  const [toast, setToast] = useState("");

  const chatEndRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const partnerTypingTimeoutRef = useRef(null);

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

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isPartnerTyping, scrollToBottom]);

  // Load conversations and community members
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

      const convosMap = new Map();
      rawConvos.forEach((item) => {
        const partnerId = String(item.user?._id || item.user?.id || "");
        if (partnerId) {
          convosMap.set(partnerId, {
            text: item.lastMessage?.text || "",
            time: item.lastMessage?.time
              ? new Date(item.lastMessage.time).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
              : "",
            unreadCount: item.unreadCount || 0,
            user: item.user,
          });
        }
      });

      const otherUsers = rawUsers.filter(
        (u) => String(u._id || u.id) !== currentUserId
      );

      const formatted = otherUsers.map((u, i) => {
        const uid = String(u._id || u.id);
        const lastMsg = convosMap.get(uid);
        const isOnline = onlineUserIds.has(uid);

        return {
          id: uid,
          name: u.name || "AU Community Member",
          role: u.role === "teacher" ? "Faculty" : "Student",
          avatar: u.profilePicture || (u.name ? u.name.substring(0, 2).toUpperCase() : "AU"),
          isGroup: false,
          unread: lastMsg?.unreadCount || 0,
          online: Boolean(isOnline || u.online || u.isOnline),
          lastMessageText: lastMsg?.text || "Start a conversation",
          lastMessageTime: lastMsg?.time || "",
          rawUser: u,
        };
      });

      // Sort existing convos to the top
      formatted.sort((a, b) => {
        const hasA = convosMap.has(a.id);
        const hasB = convosMap.has(b.id);
        if (hasA && !hasB) return -1;
        if (!hasA && hasB) return 1;
        return 0;
      });

      setConversations(formatted);

      setActiveChatId((prev) => {
        if (prev) {
          const found = formatted.find((c) => c.id === prev);
          return found ? prev : formatted[0]?.id || null;
        }
        return formatted[0]?.id || null;
      });
    } catch (err) {
      console.error("Error fetching users for chat:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, onlineUserIds]);

  useEffect(() => {
    loadConversationsAndUsers();
  }, [loadConversationsAndUsers]);

  // Load active chat messages
  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      setMessagesLoading(true);
      setIsPartnerTyping(false);
      try {
        const res = await API.get(`/messages/${activeChatId}`);
        const list = Array.isArray(res?.data?.messages)
          ? res.data.messages
          : Array.isArray(res?.data)
            ? res.data
            : [];

        const formatted = list.map((msg, index) => {
          const senderId = String(msg.sender?._id || msg.sender);
          const isSelf = senderId === currentUserId;

          return {
            id: msg._id || msg.id || `msg_${index}`,
            sender: isSelf ? "You" : msg.sender?.name || "Member",
            text: msg.content || msg.message || "",
            time: msg.createdAt
              ? new Date(msg.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
              : "",
            isSelf,
          };
        });

        setMessages(formatted);

        // Mark as read in list
        setConversations((prev) =>
          prev.map((c) => (c.id === activeChatId ? { ...c, unread: 0 } : c))
        );
      } catch (err) {
        console.error("Error loading chat messages:", err);
        setMessages([]);
      } finally {
        setMessagesLoading(false);
      }
    };

    fetchMessages();
  }, [activeChatId, currentUserId]);

  // WebSocket for Realtime
  useEffect(() => {
    if (!token) return;

    let socket = null;
    let reconnectTimeout = null;
    let isMounted = true;

    const connectWs = () => {
      try {
        const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsHost = window.location.hostname || "localhost";
        const wsPort = "5000";
        const wsUrl = `${wsProtocol}//${wsHost}:${wsPort}/?token=${encodeURIComponent(token)}`;

        socket = new WebSocket(wsUrl);
        socketRef.current = socket;

        socket.onopen = () => {
          socket.send(JSON.stringify({ type: "GET_ONLINE_USERS" }));
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === "ONLINE_USERS") {
              const ids = new Set((data.users || []).map(String));
              setOnlineUserIds(ids);
              setConversations((prev) =>
                prev.map((c) => ({
                  ...c,
                  online: ids.has(c.id),
                }))
              );
            }

            if (data.type === "NEW_MESSAGE") {
              const msg = data.message;
              const senderId = String(msg.sender?._id || msg.sender);
              const recipientId = String(msg.recipient?._id || msg.recipient);
              const partnerId = senderId === currentUserId ? recipientId : senderId;

              const timeStr = new Date(msg.createdAt || Date.now()).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });

              setConversations((prev) => {
                const partnerChat = prev.find((c) => c.id === partnerId);
                const updatedList = prev.map((c) => {
                  if (c.id === partnerId) {
                    return {
                      ...c,
                      lastMessageText: msg.content,
                      lastMessageTime: timeStr,
                      unread: activeChatId === partnerId ? 0 : (c.unread || 0) + 1,
                    };
                  }
                  return c;
                });

                if (partnerChat) {
                  return [
                    updatedList.find((c) => c.id === partnerId),
                    ...updatedList.filter((c) => c.id !== partnerId),
                  ];
                }
                return updatedList;
              });

              if (activeChatId === senderId || activeChatId === partnerId) {
                const newMsg = {
                  id: msg._id || `msg_${Date.now()}`,
                  sender: senderId === currentUserId ? "You" : msg.sender?.name || "Member",
                  text: msg.content,
                  time: timeStr,
                  isSelf: senderId === currentUserId,
                };

                setMessages((prev) => [...prev, newMsg]);
                setIsPartnerTyping(false);

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
              if (activeChatId === String(senderId)) {
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
          } catch (e) {
            console.error("Teacher WebSocket message parsing error:", e);
          }
        };

        socket.onclose = () => {
          if (isMounted) {
            reconnectTimeout = setTimeout(connectWs, 4000);
          }
        };
      } catch (err) {
        console.error("Teacher WebSocket connection error:", err);
      }
    };

    connectWs();

    const pingTimer = setInterval(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: "PING" }));
      }
    }, 25000);

    return () => {
      isMounted = false;
      clearInterval(pingTimer);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socketRef.current) socketRef.current.close();
    };
  }, [token, currentUserId, activeChatId]);

  const activeChat = conversations.find((c) => c.id === activeChatId) || conversations[0];

  const handleSelectChat = (id) => {
    setActiveChatId(id);
    setShowMobileChat(true);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c))
    );
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputText(val);

    if (socketRef.current?.readyState === WebSocket.OPEN && activeChatId) {
      socketRef.current.send(
        JSON.stringify({
          type: "TYPING",
          recipientId: activeChatId,
          isTyping: true,
        })
      );

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = setTimeout(() => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(
            JSON.stringify({
              type: "TYPING",
              recipientId: activeChatId,
              isTyping: false,
            })
          );
        }
      }, 1500);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || !activeChatId || sending) return;

    const timeStr = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const localMsg = {
      id: `msg_${Date.now()}`,
      sender: "You",
      text,
      time: timeStr,
      isSelf: true,
    };

    setMessages((prev) => [...prev, localMsg]);
    setInputText("");
    setSending(true);

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "TYPING",
          recipientId: activeChatId,
          isTyping: false,
        })
      );
    }

    setConversations((prev) => {
      const updated = prev.map((c) =>
        c.id === activeChatId
          ? { ...c, lastMessageText: text, lastMessageTime: timeStr }
          : c
      );
      const active = updated.find((c) => c.id === activeChatId);
      return [active, ...updated.filter((c) => c.id !== activeChatId)];
    });

    try {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: "SEND_MESSAGE",
            recipientId: activeChatId,
            content: text,
          })
        );
      } else {
        await API.post("/messages", {
          recipientId: activeChatId,
          content: text,
        });
      }
    } catch (err) {
      console.error("Teacher message send error:", err);
      setToast("Failed to send message over network.");
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="tm-messages-page">
      <div
        className={`tm-messages-container ${showMobileChat ? "mobile-chat-open" : ""
          }`}
      >
        {/* ================= LEFT SIDEBAR ================= */}
        <aside className="tm-sidebar">
          <div className="tm-sidebar-header">
            <div className="tm-header-title">
              <h2>Messaging</h2>
              <span className="tm-badge">{conversations.length} Active</span>
            </div>

            <div className="tm-search-box">
              <i className="fas fa-search" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="tm-search-clear"
                  onClick={() => setSearchQuery("")}
                >
                  <i className="fas fa-times" />
                </button>
              )}
            </div>
          </div>

          <div className="tm-conversations-list">
            {loading ? (
              <div
                style={{
                  padding: "30px 20px",
                  textAlign: "center",
                  color: "var(--tm-muted)",
                }}
              >
                <i className="fas fa-spinner fa-spin" style={{ fontSize: "20px" }} />
                <p style={{ marginTop: "10px", fontSize: "12px" }}>
                  Loading conversations...
                </p>
              </div>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((chat) => {
                const isActive = chat.id === activeChatId;

                return (
                  <button
                    key={chat.id}
                    type="button"
                    className={`tm-conversation-item ${isActive ? "active" : ""}`}
                    onClick={() => handleSelectChat(chat.id)}
                  >
                    <div className="tm-avatar-wrapper">
                      <span
                        className={`tm-avatar ${chat.isGroup ? "is-group" : ""}`}
                      >
                        {chat.avatar?.length > 3 ? (
                          <img
                            src={chat.avatar}
                            alt={chat.name}
                            style={{
                              width: "100%",
                              height: "100%",
                              borderRadius: "50%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          chat.avatar
                        )}
                      </span>
                      {chat.online && <span className="tm-online-dot" />}
                    </div>

                    <div className="tm-chat-meta">
                      <div className="tm-chat-name-row">
                        <strong className="tm-chat-name">{chat.name}</strong>
                        {chat.lastMessageTime && (
                          <span className="tm-chat-time">
                            {chat.lastMessageTime}
                          </span>
                        )}
                      </div>

                      <div className="tm-chat-preview-row">
                        <span className="tm-chat-preview">
                          {chat.lastMessageText}
                        </span>
                        {chat.unread > 0 && (
                          <span className="tm-unread-count">{chat.unread}</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="tm-empty-search">
                <i className="fas fa-comment-slash" />
                <p>No conversations found</p>
              </div>
            )}
          </div>
        </aside>

        {/* ================= RIGHT CHAT WINDOW ================= */}
        <section className="tm-chat-window">
          {activeChat ? (
            <>
              {/* CHAT HEADER */}
              <div className="tm-chat-header">
                <button
                  type="button"
                  className="tm-mobile-back"
                  onClick={() => setShowMobileChat(false)}
                >
                  <i className="fas fa-arrow-left" />
                </button>

                <div
                  className="tm-avatar-wrapper"
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    setViewingProfileUser(activeChat.rawUser || activeChat)
                  }
                  title="View Profile"
                >
                  <span
                    className={`tm-avatar ${activeChat.isGroup ? "is-group" : ""}`}
                  >
                    {activeChat.avatar?.length > 3 ? (
                      <img
                        src={activeChat.avatar}
                        alt={activeChat.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          borderRadius: "50%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      activeChat.avatar
                    )}
                  </span>
                  {activeChat.online && <span className="tm-online-dot" />}
                </div>

                <div
                  className="tm-header-info"
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    setViewingProfileUser(activeChat.rawUser || activeChat)
                  }
                  title="View Profile"
                >
                  <h3>{activeChat.name}</h3>
                  <span className="tm-header-role">
                    {isPartnerTyping ? (
                      <strong style={{ color: "var(--tm-orange)" }}>
                        Typing...
                      </strong>
                    ) : (
                      <>
                        {activeChat.role}{" "}
                        {activeChat.online && "• Active Now"}
                      </>
                    )}
                  </span>
                </div>

                <div className="tm-header-actions">
                  <button
                    type="button"
                    title="View Profile"
                    className="tm-icon-btn"
                    onClick={() =>
                      setViewingProfileUser(activeChat.rawUser || activeChat)
                    }
                  >
                    <i className="fas fa-user" />
                  </button>
                  <button
                    type="button"
                    title="Call"
                    className="tm-icon-btn"
                    onClick={() => setToast("Audio call feature coming soon.")}
                  >
                    <i className="fas fa-phone-alt" />
                  </button>
                  <button
                    type="button"
                    title="Video Call"
                    className="tm-icon-btn"
                    onClick={() => setToast("Video call feature coming soon.")}
                  >
                    <i className="fas fa-video" />
                  </button>
                </div>
              </div>

              {/* CHAT MESSAGES BODY */}
              <div className="tm-chat-body">
                <div className="tm-date-divider">
                  <span>Conversation</span>
                </div>

                {messagesLoading ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "40px",
                      color: "var(--tm-muted)",
                    }}
                  >
                    <i
                      className="fas fa-spinner fa-spin"
                      style={{ fontSize: "24px" }}
                    />
                    <p style={{ marginTop: "12px", fontSize: "12px" }}>
                      Loading messages...
                    </p>
                  </div>
                ) : messages.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "50px 20px",
                      color: "var(--tm-muted)",
                    }}
                  >
                    <i
                      className="fas fa-comments"
                      style={{ fontSize: "40px", marginBottom: "14px", opacity: 0.4 }}
                    />
                    <h4>Start the conversation</h4>
                    <p style={{ fontSize: "12px", marginTop: "6px" }}>
                      Send a message to {activeChat.name}.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`tm-message-bubble-row ${msg.isSelf ? "sent" : "received"
                        }`}
                    >
                      {!msg.isSelf && activeChat.isGroup && (
                        <span className="tm-sender-name">{msg.sender}</span>
                      )}

                      <div className="tm-bubble">
                        <p>{msg.text}</p>
                        <span className="tm-msg-time">{msg.time}</span>
                      </div>
                    </div>
                  ))
                )}

                {isPartnerTyping && (
                  <div className="tm-message-bubble-row received">
                    <div
                      className="tm-bubble"
                      style={{
                        fontStyle: "italic",
                        backgroundColor: "#eeeaf7",
                        color: "var(--tm-muted)",
                      }}
                    >
                      <p>{activeChat.name} is typing...</p>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* CHAT INPUT AREA */}
              <form
                className="tm-chat-input-container"
                onSubmit={handleSendMessage}
              >
                <button
                  type="button"
                  className="tm-attach-btn"
                  title="Attach file"
                  onClick={() => setToast("File attachment coming soon.")}
                >
                  <i className="fas fa-paperclip" />
                </button>

                <input
                  type="text"
                  placeholder={`Message ${activeChat.name}...`}
                  value={inputText}
                  onChange={handleInputChange}
                />

                <button
                  type="submit"
                  className="tm-send-btn"
                  disabled={!inputText.trim() || sending}
                >
                  <span>{sending ? "..." : "Send"}</span>
                  <i className="fas fa-paper-plane" />
                </button>
              </form>
            </>
          ) : (
            <div className="tm-no-chat-selected">
              <i className="fas fa-comments" />
              <h3>Select a conversation</h3>
              <p>Choose a student or colleague from the list to start messaging.</p>
            </div>
          )}
        </section>
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
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            backgroundColor: "#1b1740",
            color: "#ffffff",
            padding: "12px 20px",
            borderRadius: "10px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            zIndex: 9999,
            fontSize: "13px",
            fontWeight: "500",
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
};

export default Messages;
