import React, { useEffect, useMemo, useState } from "react";
import API from "../../../api";
import "../../../styles/StudentStyle/StudentNotifications.css";

const fallbackNotifications = [
  {
    id: "notification-1",
    type: "connection",
    title: "New connection request",
    message: "Aarav Sharma wants to connect with you.",
    time: "10 minutes ago",
    read: false,
  },
  {
    id: "notification-2",
    type: "event",
    title: "Upcoming event reminder",
    message: "Annual Innovation Summit 2026 is coming up soon.",
    time: "1 hour ago",
    read: false,
  },
  {
    id: "notification-3",
    type: "opportunity",
    title: "New opportunity available",
    message: "A new student developer opportunity has been posted.",
    time: "3 hours ago",
    read: false,
  },
  {
    id: "notification-4",
    type: "like",
    title: "Someone liked your post",
    message: "Your recent community post received a new like.",
    time: "Yesterday",
    read: true,
  },
  {
    id: "notification-5",
    type: "comment",
    title: "New comment on your post",
    message: "Ananya Verma commented on your recent post.",
    time: "Yesterday",
    read: true,
  },
  {
    id: "notification-6",
    type: "profile",
    title: "Profile update completed",
    message: "Your student profile has been updated successfully.",
    time: "2 days ago",
    read: true,
  },
];

const normalizeNotification = (item, index) => {
  return {
    id: item?._id || item?.id || `notification-${index}`,
    type: item?.type || item?.category || "general",
    title: item?.title || item?.heading || "New notification",
    message:
      item?.message ||
      item?.description ||
      item?.content ||
      "You have a new notification.",
    time:
      item?.time ||
      item?.createdAt ||
      item?.date ||
      "Recently",
    read: Boolean(item?.read || item?.isRead),
    avatar: item?.avatar || item?.user?.avatar || "",
    userName:
      item?.userName ||
      item?.user?.name ||
      item?.sender?.name ||
      "",
  };
};

const getNotificationIcon = (type) => {
  switch (type) {
    case "connection":
      return "fas fa-user-plus";
    case "event":
      return "fas fa-calendar-check";
    case "opportunity":
      return "fas fa-briefcase";
    case "like":
      return "fas fa-heart";
    case "comment":
      return "fas fa-comment";
    case "message":
      return "fas fa-envelope";
    case "profile":
      return "fas fa-user-circle";
    case "announcement":
      return "fas fa-bullhorn";
    default:
      return "fas fa-bell";
  }
};

const getNotificationClass = (type) => {
  switch (type) {
    case "connection":
      return "student-notification-type-connection";
    case "event":
      return "student-notification-type-event";
    case "opportunity":
      return "student-notification-type-opportunity";
    case "like":
      return "student-notification-type-like";
    case "comment":
      return "student-notification-type-comment";
    case "message":
      return "student-notification-type-message";
    case "profile":
      return "student-notification-type-profile";
    case "announcement":
      return "student-notification-type-announcement";
    default:
      return "student-notification-type-general";
  }
};

const formatTime = (value) => {
  if (!value) return "Recently";

  if (
    typeof value === "string" &&
    !value.includes("T") &&
    !value.match(/^\d{4}-\d{2}-\d{2}/)
  ) {
    return value;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const now = new Date();
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  if (diff < 172800) return "Yesterday";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const Notification = () => {
  const [notifications, setNotifications] = useState(
    fallbackNotifications
  );
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast("");
    }, 2800);

    return () => clearTimeout(timer);
  }, [toast]);

  const fetchNotifications = async () => {
    setLoading(true);

    try {
      const response = await API.get("/notifications");

      const data = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.data?.notifications)
          ? response.data.notifications
          : Array.isArray(response?.data?.data)
            ? response.data.data
            : [];

      if (data.length > 0) {
        setNotifications(data.map(normalizeNotification));
      } else {
        setNotifications(fallbackNotifications);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      setNotifications(fallbackNotifications);
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

  const readCount = useMemo(
    () => notifications.filter((item) => item.read).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    if (activeFilter === "unread") {
      return notifications.filter((item) => !item.read);
    }

    if (activeFilter === "read") {
      return notifications.filter((item) => item.read);
    }

    return notifications;
  }, [notifications, activeFilter]);

  const markAsRead = async (notification) => {
    if (notification.read) return;

    setProcessingId(notification.id);

    try {
      if (!String(notification.id).startsWith("notification-")) {
        await API.patch(`/notifications/${notification.id}/read`);
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }

    setNotifications((prev) =>
      prev.map((item) =>
        item.id === notification.id
          ? { ...item, read: true }
          : item
      )
    );

    setProcessingId(null);
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;

    try {
      await API.patch("/notifications/read-all");
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }

    setNotifications((prev) =>
      prev.map((item) => ({
        ...item,
        read: true,
      }))
    );

    setToast("All notifications marked as read.");
  };

  const deleteNotification = async (notification) => {
    setProcessingId(notification.id);

    try {
      if (!String(notification.id).startsWith("notification-")) {
        await API.delete(`/notifications/${notification.id}`);
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }

    setNotifications((prev) =>
      prev.filter((item) => item.id !== notification.id)
    );

    setProcessingId(null);
    setToast("Notification removed.");
  };

  const clearAllNotifications = async () => {
    if (notifications.length === 0) return;

    try {
      await API.delete("/notifications");
    } catch (error) {
      console.error("Failed to clear notifications:", error);
    }

    setNotifications([]);
    setToast("All notifications cleared.");
  };

  return (
    <div className="student-notification-page">

      {/* =====================================================
          HERO
          ===================================================== */}
      <section className="student-notification-hero">
        <div className="student-notification-hero-content">
          <div className="student-notification-eyebrow">
            AU Community Updates
          </div>

          <h1>Notifications</h1>

          <p>
            Stay updated with your connections, events, opportunities,
            posts and everything happening around your AU community.
          </p>
        </div>

        <div className="student-notification-hero-art">
          <div className="notification-orbit notification-orbit-one" />
          <div className="notification-orbit notification-orbit-two" />

          <div className="notification-center-icon">
            <i className="fas fa-bell" />
          </div>

          <div className="notification-floating-icon notification-float-one">
            <i className="fas fa-calendar" />
          </div>

          <div className="notification-floating-icon notification-float-two">
            <i className="fas fa-users" />
          </div>

          <div className="notification-floating-icon notification-float-three">
            <i className="fas fa-heart" />
          </div>

          <div className="notification-floating-icon notification-float-four">
            <i className="fas fa-comment" />
          </div>
        </div>
      </section>

      {/* =====================================================
          STATS
          ===================================================== */}
      <section className="student-notification-stats">

        <div className="student-notification-stat">
          <div className="student-notification-stat-icon">
            <i className="fas fa-bell" />
          </div>

          <div>
            <strong>{notifications.length}</strong>
            <span>Total Notifications</span>
          </div>
        </div>

        <div className="student-notification-stat">
          <div className="student-notification-stat-icon">
            <i className="fas fa-envelope-open" />
          </div>

          <div>
            <strong>{unreadCount}</strong>
            <span>Unread</span>
          </div>
        </div>

        <div className="student-notification-stat">
          <div className="student-notification-stat-icon">
            <i className="fas fa-check-circle" />
          </div>

          <div>
            <strong>{readCount}</strong>
            <span>Read</span>
          </div>
        </div>

        <div className="student-notification-stat">
          <div className="student-notification-stat-icon">
            <i className="fas fa-bolt" />
          </div>

          <div>
            <strong>{unreadCount > 0 ? "New" : "All Clear"}</strong>
            <span>Current Status</span>
          </div>
        </div>

      </section>

      {/* =====================================================
          TOOLBAR
          ===================================================== */}
      <section className="student-notification-toolbar">

        <div className="student-notification-filter-group">
          <button
            type="button"
            className={`student-notification-filter ${activeFilter === "all" ? "active" : ""
              }`}
            onClick={() => setActiveFilter("all")}
          >
            All
            <span>{notifications.length}</span>
          </button>

          <button
            type="button"
            className={`student-notification-filter ${activeFilter === "unread" ? "active" : ""
              }`}
            onClick={() => setActiveFilter("unread")}
          >
            Unread
            <span>{unreadCount}</span>
          </button>

          <button
            type="button"
            className={`student-notification-filter ${activeFilter === "read" ? "active" : ""
              }`}
            onClick={() => setActiveFilter("read")}
          >
            Read
            <span>{readCount}</span>
          </button>
        </div>

        <div className="student-notification-toolbar-actions">
          <button
            type="button"
            className="notification-mark-all-btn"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            <i className="fas fa-check-double" />
            Mark all read
          </button>

          <button
            type="button"
            className="notification-clear-btn"
            onClick={clearAllNotifications}
            disabled={notifications.length === 0}
          >
            <i className="fas fa-trash-alt" />
            Clear all
          </button>
        </div>

      </section>

      {/* =====================================================
          NOTIFICATION LIST
          ===================================================== */}
      <section className="student-notification-section">

        <div className="student-notification-section-header">
          <div>
            <div className="student-notification-section-label">
              Your Activity
            </div>

            <h2 className="student-notification-section-title">
              Recent Notifications
            </h2>
          </div>

          <div className="student-notification-result-count">
            {filteredNotifications.length}{" "}
            {filteredNotifications.length === 1
              ? "notification"
              : "notifications"}
          </div>
        </div>

        {loading ? (
          <div className="student-notification-loading">
            <div className="student-notification-loader" />
            <span>Loading notifications...</span>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="student-notification-empty">
            <div className="student-notification-empty-icon">
              <i className="fas fa-bell-slash" />
            </div>

            <h3>
              {activeFilter === "unread"
                ? "You're all caught up!"
                : activeFilter === "read"
                  ? "No read notifications"
                  : "No notifications yet"}
            </h3>

            <p>
              {activeFilter === "unread"
                ? "There are no unread notifications waiting for you."
                : activeFilter === "read"
                  ? "Notifications you have already read will appear here."
                  : "When something important happens in the AU community, you'll see it here."}
            </p>
          </div>
        ) : (
          <div className="student-notification-list">
            {filteredNotifications.map((notification) => (
              <article
                key={notification.id}
                className={`student-notification-card ${notification.read ? "read" : "unread"
                  }`}
                onClick={() => markAsRead(notification)}
              >

                <div
                  className={`student-notification-icon ${getNotificationClass(
                    notification.type
                  )}`}
                >
                  <i
                    className={getNotificationIcon(
                      notification.type
                    )}
                  />
                </div>

                <div className="student-notification-content">

                  <div className="student-notification-top">
                    <div>
                      <h3>{notification.title}</h3>

                      {!notification.read && (
                        <span className="notification-new-badge">
                          New
                        </span>
                      )}
                    </div>

                    <span className="student-notification-time">
                      {formatTime(notification.time)}
                    </span>
                  </div>

                  <p>{notification.message}</p>

                  {notification.userName && (
                    <div className="student-notification-user">
                      <i className="fas fa-user" />
                      {notification.userName}
                    </div>
                  )}

                </div>

                <div className="student-notification-actions">

                  {!notification.read && (
                    <button
                      type="button"
                      className="notification-read-btn"
                      title="Mark as read"
                      disabled={processingId === notification.id}
                      onClick={(event) => {
                        event.stopPropagation();
                        markAsRead(notification);
                      }}
                    >
                      <i className="fas fa-check" />
                    </button>
                  )}

                  <button
                    type="button"
                    className="notification-delete-btn"
                    title="Delete notification"
                    disabled={processingId === notification.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      deleteNotification(notification);
                    }}
                  >
                    <i className="fas fa-trash-alt" />
                  </button>

                </div>

              </article>
            ))}
          </div>
        )}

      </section>

      {/* =====================================================
          CTA
          ===================================================== */}
      <section className="student-notification-cta">
        <div className="student-notification-cta-content">

          <div>
            <div className="student-notification-cta-label">
              Stay Connected
            </div>

            <h2>Don't miss what matters.</h2>

            <p>
              Keep exploring events, opportunities and connections
              across the AU Foundation Community.
            </p>
          </div>

          <div className="student-notification-cta-icon">
            <i className="fas fa-bell" />
          </div>

        </div>
      </section>

      {/* =====================================================
          TOAST
          ===================================================== */}
      {toast && (
        <div className="student-notification-toast">
          {toast}
        </div>
      )}

    </div>
  );
};

export default Notification;