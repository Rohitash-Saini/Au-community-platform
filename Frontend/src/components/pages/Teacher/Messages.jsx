import React, { useState, useEffect, useRef } from "react";
import API from "../../../api";
import "../../../styles/TeacherStyle/TeacherMessages.css";

const Messages = () => {
  const [conversations, setConversations] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileChat, setShowMobileChat] = useState(false);

  const chatEndRef = useRef(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await API.get("/users");
        const usersList = res.data?.users || res.data || [];
        const formatted = usersList.map((u, i) => ({
          id: u._id || `user_${i}`,
          name: u.name || "AU Community Member",
          role: u.role === "teacher" ? "Faculty" : "Student",
          avatar: u.name ? u.name.substring(0, 2).toUpperCase() : "AU",
          isGroup: false,
          unread: 0,
          online: true,
          messages: [],
        }));
        setConversations(formatted);
        if (formatted.length > 0) {
          setActiveChatId(formatted[0].id);
        }
      } catch (err) {
        console.error("Error fetching users for chat:", err);
      }
    };
    fetchUsers();
  }, []);

  const activeChat = conversations.find((c) => c.id === activeChatId) || conversations[0];

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChat?.messages]);

  const handleSelectChat = (id) => {
    setActiveChatId(id);
    setShowMobileChat(true);
    // Clear unread
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c))
    );
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChat) return;

    const newMsg = {
      id: `msg_${Date.now()}`,
      sender: "You",
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isSelf: true,
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeChat.id
          ? { ...c, messages: [...c.messages, newMsg] }
          : c
      )
    );

    setInputText("");
  };

  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="tm-messages-page">
      <div className={`tm-messages-container ${showMobileChat ? "mobile-chat-open" : ""}`}>
        {/* ================= LEFT SIDEBAR - CONVERSATIONS LIST ================= */}
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
            {filteredConversations.length > 0 ? (
              filteredConversations.map((chat) => {
                const lastMsg = chat.messages[chat.messages.length - 1];
                const isActive = chat.id === activeChatId;

                return (
                  <button
                    key={chat.id}
                    type="button"
                    className={`tm-conversation-item ${isActive ? "active" : ""}`}
                    onClick={() => handleSelectChat(chat.id)}
                  >
                    <div className="tm-avatar-wrapper">
                      <span className={`tm-avatar ${chat.isGroup ? "is-group" : ""}`}>
                        {chat.avatar}
                      </span>
                      {chat.online && <span className="tm-online-dot" />}
                    </div>

                    <div className="tm-chat-meta">
                      <div className="tm-chat-name-row">
                        <strong className="tm-chat-name">{chat.name}</strong>
                        {lastMsg && <span className="tm-chat-time">{lastMsg.time}</span>}
                      </div>

                      <div className="tm-chat-preview-row">
                        <span className="tm-chat-preview">
                          {lastMsg ? `${lastMsg.isSelf ? "You: " : ""}${lastMsg.text}` : "No messages yet"}
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

                <div className="tm-avatar-wrapper">
                  <span className={`tm-avatar ${activeChat.isGroup ? "is-group" : ""}`}>
                    {activeChat.avatar}
                  </span>
                  {activeChat.online && <span className="tm-online-dot" />}
                </div>

                <div className="tm-header-info">
                  <h3>{activeChat.name}</h3>
                  <span className="tm-header-role">
                    {activeChat.role} {activeChat.online && "• Active Now"}
                  </span>
                </div>

                <div className="tm-header-actions">
                  <button type="button" title="Call" className="tm-icon-btn">
                    <i className="fas fa-phone-alt" />
                  </button>
                  <button type="button" title="Video Call" className="tm-icon-btn">
                    <i className="fas fa-video" />
                  </button>
                  <button type="button" title="Info" className="tm-icon-btn">
                    <i className="fas fa-info-circle" />
                  </button>
                </div>
              </div>

              {/* CHAT MESSAGES BODY */}
              <div className="tm-chat-body">
                <div className="tm-date-divider">
                  <span>Today</span>
                </div>

                {activeChat.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`tm-message-bubble-row ${msg.isSelf ? "sent" : "received"}`}
                  >
                    {!msg.isSelf && activeChat.isGroup && (
                      <span className="tm-sender-name">{msg.sender}</span>
                    )}

                    <div className="tm-bubble">
                      <p>{msg.text}</p>
                      <span className="tm-msg-time">{msg.time}</span>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* CHAT INPUT AREA */}
              <form className="tm-chat-input-container" onSubmit={handleSendMessage}>
                <button type="button" className="tm-attach-btn" title="Attach file">
                  <i className="fas fa-paperclip" />
                </button>

                <input
                  type="text"
                  placeholder={`Message ${activeChat.name}...`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />

                <button
                  type="submit"
                  className="tm-send-btn"
                  disabled={!inputText.trim()}
                >
                  <span>Send</span>
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
    </div>
  );
};

export default Messages;
