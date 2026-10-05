import React, { useEffect, useMemo, useState } from "react";
import API from "../../../api";
import "../../../styles/StudentStyle/StudentMessages.css";

const fallbackUsers = [];

const fallbackMessages = {
  "user-1": [
    {
      id: "m1",
      sender: "other",
      text: "Hey! Are you joining the innovation event?",
      time: "10:38 AM",
    },
    {
      id: "m2",
      sender: "me",
      text: "Yes, definitely. I am planning to participate.",
      time: "10:40 AM",
    },
    {
      id: "m3",
      sender: "other",
      text: "Great! We should work on an idea together.",
      time: "10:42 AM",
    },
  ],
  "user-2": [
    {
      id: "m4",
      sender: "other",
      text: "I shared the project details with you.",
      time: "9:35 AM",
    },
  ],
  "user-3": [
    {
      id: "m5",
      sender: "other",
      text: "Let's discuss the hackathon idea.",
      time: "Yesterday",
    },
  ],
  "user-4": [
    {
      id: "m6",
      sender: "other",
      text: "Thanks for your help!",
      time: "Yesterday",
    },
  ],
  "user-5": [
    {
      id: "m7",
      sender: "other",
      text: "Please check the research opportunity.",
      time: "Mon",
    },
  ],
};

const normalizeUser = (user, index = 0) => {
  const name =
    user?.name ||
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
    "Community Member";

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

  return {
    _id: user?._id || user?.id || `user-${index}`,
    name,
    role: user?.role || "Student",
    designation:
      user?.designation ||
      user?.course ||
      user?.program ||
      "AU Community Member",
    department:
      user?.department ||
      user?.branch ||
      user?.faculty ||
      "AU Community",
    avatar,
    lastMessage:
      user?.lastMessage ||
      user?.latestMessage?.text ||
      "Start a conversation",
    time:
      user?.time ||
      user?.lastMessageTime ||
      "",
    online: Boolean(user?.online || user?.isOnline),
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

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);

      try {
        const response = await API.get("/users");

        const data = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.users)
            ? response.data.users
            : [];

        const normalized = data.map(normalizeUser);
        setUsers(normalized);

        if (normalized.length > 0) {
          setSelectedUser(normalized[0]);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
        setUsers([]);
        setSelectedUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    if (!selectedUser) return;

    const fetchMessages = async () => {
      setMessagesLoading(true);

      try {
        const response = await API.get(
          `/messages/${selectedUser._id}`
        );

        const data = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.messages)
            ? response.data.messages
            : [];

        if (data.length > 0) {
          setMessages(
            data.map((message, index) => ({
              id: message?._id || message?.id || `message-${index}`,
              sender:
                message?.sender === "me" ||
                  message?.senderId === "me"
                  ? "me"
                  : "other",
              text:
                message?.text ||
                message?.content ||
                message?.message ||
                "",
              time:
                message?.time ||
                message?.createdAt ||
                "",
            }))
          );
        } else {
          setMessages(
            fallbackMessages[selectedUser._id] || []
          );
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);

        setMessages(
          fallbackMessages[selectedUser._id] || []
        );
      } finally {
        setMessagesLoading(false);
      }
    };

    fetchMessages();
  }, [selectedUser]);

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast("");
    }, 2600);

    return () => clearTimeout(timer);
  }, [toast]);

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

  const handleSendMessage = async () => {
    const text = messageText.trim();

    if (!text || !selectedUser || sending) {
      return;
    }

    const newMessage = {
      id: `local-${Date.now()}`,
      sender: "me",
      text,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, newMessage]);
    setMessageText("");
    setSending(true);

    try {
      await API.post("/messages", {
        receiverId: selectedUser._id,
        recipientId: selectedUser._id,
        content: text,
        message: text,
      });
    } catch (error) {
      console.error("Message API error:", error);
      setToast("Message sent locally.");
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
      <div className="student-message-header">
        <div>
          <span className="student-message-eyebrow">
            AU Community
          </span>

          <h1>Messages</h1>

          <p>
            Connect, collaborate and stay in touch with your
            AU Community.
          </p>
        </div>

        <div className="student-message-header-icon">
          💬
        </div>
      </div>

      <div
        className={`student-message-container ${mobileChatOpen ? "mobile-chat-active" : ""
          }`}
      >
        {/* =====================================================
            CONVERSATION LIST
        ===================================================== */}
        <aside className="student-message-sidebar">
          <div className="student-message-sidebar-head">
            <div>
              <h2>Conversations</h2>
              <span>
                {users.length} community members
              </span>
            </div>

            <div className="student-message-count">
              {users.length}
            </div>
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
                  className={`student-message-user ${selectedUser?._id === user._id
                    ? "active"
                    : ""
                    }`}
                  onClick={() => handleSelectUser(user)}
                >
                  <div className="student-message-avatar-wrap">
                    <div className="student-message-avatar">
                      {user.avatar?.length > 3 ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                        />
                      ) : (
                        user.avatar
                      )}
                    </div>

                    {user.online && (
                      <span className="student-message-online" />
                    )}
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
                </button>
              ))
            )}
          </div>
        </aside>

        {/* =====================================================
            CHAT AREA
        ===================================================== */}
        <main className="student-message-chat">
          {!selectedUser ? (
            <div className="student-message-empty-chat">
              <div className="student-message-empty-icon">
                💬
              </div>

              <h2>Select a conversation</h2>

              <p>
                Choose someone from your community to start
                messaging.
              </p>
            </div>
          ) : (
            <>
              <header className="student-message-chat-head">
                <button
                  type="button"
                  className="student-message-mobile-back"
                  onClick={handleBackToUsers}
                >
                  ←
                </button>

                <div className="student-message-chat-profile">
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
                      {selectedUser.online
                        ? "Online now"
                        : selectedUser.designation}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="student-message-chat-more"
                  onClick={() =>
                    setToast(
                      `${selectedUser.name}'s profile is available through Network.`
                    )
                  }
                >
                  ⋮
                </button>
              </header>

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

                    <p>
                      Send a message to {selectedUser.name}.
                    </p>
                  </div>
                ) : (
                  <div className="student-message-list">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`student-message-row ${message.sender === "me"
                          ? "mine"
                          : "theirs"
                          }`}
                      >
                        <div className="student-message-bubble">
                          <p>{message.text}</p>

                          <span>
                            {message.time}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <footer className="student-message-composer">
                <button
                  type="button"
                  className="student-message-attach"
                  onClick={() =>
                    setToast("Attachment feature coming soon.")
                  }
                >
                  +
                </button>

                <textarea
                  value={messageText}
                  onChange={(e) =>
                    setMessageText(e.target.value)
                  }
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

      {toast && (
        <div className="student-message-toast">
          {toast}
        </div>
      )}
    </div>
  );
}

export default Message;