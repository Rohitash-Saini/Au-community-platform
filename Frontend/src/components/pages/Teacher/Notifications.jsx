import React, { useEffect, useMemo, useState } from "react";
import API from "../../../api";
import "../../../styles/TeacherStyle/TeacherNotifications.css";


const FALLBACK_NOTIFICATIONS = [
  {
    _id: "notification-1",
    type: "connection",
    title: "New connection request",
    message:
      "You have received a new connection request from a community member.",
    time: "10 minutes ago",
    read: false,
    icon: "fa-solid fa-user-plus",
  },
  {
    _id: "notification-2",
    type: "event",
    title: "Upcoming event reminder",
    message:
      "Faculty Research Meet 2026 is coming up soon. Don't forget to register.",
    time: "1 hour ago",
    read: false,
    icon: "fa-solid fa-calendar-days",
  },
  {
    _id: "notification-3",
    type: "opportunity",
    title: "New opportunity available",
    message:
      "A new research collaboration opportunity has been posted for faculty members.",
    time: "3 hours ago",
    read: false,
    icon: "fa-solid fa-briefcase",
  },
  {
    _id: "notification-4",
    type: "like",
    title: "Someone liked your post",
    message:
      "Your recent community post received a new like.",
    time: "Yesterday",
    read: true,
    icon: "fa-solid fa-heart",
  },
  {
    _id: "notification-5",
    type: "comment",
    title: "New comment on your post",
    message:
      "Someone commented on a post you shared with the community.",
    time: "Yesterday",
    read: true,
    icon: "fa-solid fa-comment",
  },
  {
    _id: "notification-6",
    type: "system",
    title: "Profile update completed",
    message:
      "Your teacher profile information has been successfully updated.",
    time: "2 days ago",
    read: true,
    icon: "fa-solid fa-circle-check",
  },
];


const normalizeNotification = (item, index) => {
  const type =
    item?.type ||
    item?.notificationType ||
    item?.category ||
    "system";

  return {
    _id:
      item?._id ||
      item?.id ||
      `notification-${index}`,

    type,

    title:
      item?.title ||
      item?.subject ||
      item?.heading ||
      "New notification",

    message:
      item?.message ||
      item?.description ||
      item?.text ||
      "You have a new notification.",

    time:
      item?.time ||
      item?.createdAt ||
      item?.timestamp ||
      "Recently",

    read:
      Boolean(
        item?.read ??
        item?.isRead ??
        false
      ),

    icon:
      item?.icon ||
      getNotificationIcon(type),
  };
};


const getNotificationIcon = (type) => {
  const value =
    `${type || ""}`.toLowerCase();

  if (
    value.includes("connection") ||
    value.includes("friend")
  ) {
    return "fa-solid fa-user-plus";
  }

  if (
    value.includes("event") ||
    value.includes("calendar")
  ) {
    return "fa-solid fa-calendar-days";
  }

  if (
    value.includes("opportunity") ||
    value.includes("job")
  ) {
    return "fa-solid fa-briefcase";
  }

  if (
    value.includes("like") ||
    value.includes("reaction")
  ) {
    return "fa-solid fa-heart";
  }

  if (
    value.includes("comment") ||
    value.includes("message")
  ) {
    return "fa-solid fa-comment";
  }

  return "fa-solid fa-bell";
};


const TeacherNotifications = () => {
  const [notifications, setNotifications] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [activeFilter, setActiveFilter] =
    useState("all");

  const [toast, setToast] =
    useState("");


  /* =====================================================
     FETCH NOTIFICATIONS
     ===================================================== */

  useEffect(() => {
    fetchNotifications();
  }, []);


  const fetchNotifications = async () => {
    setLoading(true);

    try {
      const response =
        await API.get("/notifications");

      const data =
        response?.data?.notifications ||
        response?.data?.data ||
        response?.data ||
        [];

      if (
        Array.isArray(data) &&
        data.length > 0
      ) {
        setNotifications(
          data.map((item, index) =>
            normalizeNotification(
              item,
              index
            )
          )
        );
      } else {
        setNotifications(
          FALLBACK_NOTIFICATIONS
        );
      }
    } catch (error) {
      console.error(
        "Failed to fetch notifications:",
        error
      );

      setNotifications(
        FALLBACK_NOTIFICATIONS
      );
    } finally {
      setLoading(false);
    }
  };


  /* =====================================================
     TOAST
     ===================================================== */

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [toast]);


  /* =====================================================
     FILTERS
     ===================================================== */

  const filteredNotifications =
    useMemo(() => {
      if (activeFilter === "unread") {
        return notifications.filter(
          (notification) =>
            !notification.read
        );
      }

      if (activeFilter === "read") {
        return notifications.filter(
          (notification) =>
            notification.read
        );
      }

      return notifications;
    }, [
      notifications,
      activeFilter,
    ]);


  /* =====================================================
     COUNTS
     ===================================================== */

  const unreadCount =
    notifications.filter(
      (notification) =>
        !notification.read
    ).length;

  const readCount =
    notifications.filter(
      (notification) =>
        notification.read
    ).length;


  /* =====================================================
     MARK ONE AS READ
     ===================================================== */

  const markAsRead = async (
    notificationId
  ) => {
    setNotifications((previous) =>
      previous.map((notification) =>
        notification._id ===
          notificationId
          ? {
            ...notification,
            read: true,
          }
          : notification
      )
    );

    try {
      await API.patch(
        `/notifications/${notificationId}/read`
      );
    } catch (error) {
      /*
       * UI state is already updated.
       * Backend support can be added later
       * without breaking the notification screen.
       */
      console.warn(
        "Notification read API unavailable:",
        error
      );
    }
  };


  /* =====================================================
     MARK ALL AS READ
     ===================================================== */

  const markAllAsRead = async () => {
    setNotifications((previous) =>
      previous.map((notification) => ({
        ...notification,
        read: true,
      }))
    );

    setToast(
      "All notifications marked as read."
    );

    try {
      await API.patch(
        "/notifications/read-all"
      );
    } catch (error) {
      console.warn(
        "Mark all notifications API unavailable:",
        error
      );
    }
  };


  /* =====================================================
     DELETE NOTIFICATION
     ===================================================== */

  const deleteNotification = async (
    notificationId
  ) => {
    setNotifications((previous) =>
      previous.filter(
        (notification) =>
          notification._id !==
          notificationId
      )
    );

    setToast(
      "Notification removed."
    );

    try {
      await API.delete(
        `/notifications/${notificationId}`
      );
    } catch (error) {
      console.warn(
        "Delete notification API unavailable:",
        error
      );
    }
  };


  /* =====================================================
     CLEAR ALL
     ===================================================== */

  const clearAll = async () => {
    setNotifications([]);

    setToast(
      "All notifications cleared."
    );

    try {
      await API.delete(
        "/notifications"
      );
    } catch (error) {
      console.warn(
        "Clear notifications API unavailable:",
        error
      );
    }
  };


  /* =====================================================
     FILTER BUTTONS
     ===================================================== */

  const filters = [
    {
      key: "all",
      label: "All",
      count: notifications.length,
      icon: "fa-solid fa-layer-group",
    },
    {
      key: "unread",
      label: "Unread",
      count: unreadCount,
      icon: "fa-solid fa-envelope",
    },
    {
      key: "read",
      label: "Read",
      count: readCount,
      icon: "fa-solid fa-envelope-open",
    },
  ];


  return (
    <div className="notifications-page">

      {/* =================================================
          HERO
      ================================================= */}

      <section className="notifications-hero">

        <div className="notifications-hero-content">

          <div className="notifications-eyebrow">
            AU Community
          </div>

          <h1>
            Stay in the
            <br />
            <span>loop.</span>
          </h1>

          <p>
            Keep track of connections, events,
            opportunities and activity across
            your AU Community network.
          </p>

        </div>


        <div className="notifications-hero-art">

          <div className="notifications-art-ring one" />

          <div className="notifications-art-ring two" />

          <div className="notifications-art-center">

            <i className="fa-solid fa-bell" />

            {unreadCount > 0 && (
              <span>
                {unreadCount}
              </span>
            )}

          </div>

        </div>

      </section>


      {/* =================================================
          STATS
      ================================================= */}

      <section className="notifications-stats">

        <div className="notifications-stat-card">

          <div className="notifications-stat-icon">
            <i className="fa-solid fa-bell" />
          </div>

          <div>
            <strong>
              {notifications.length}
            </strong>

            <span>
              Total Notifications
            </span>
          </div>

        </div>


        <div className="notifications-stat-card unread-stat">

          <div className="notifications-stat-icon">
            <i className="fa-solid fa-envelope" />
          </div>

          <div>
            <strong>
              {unreadCount}
            </strong>

            <span>
              Unread
            </span>
          </div>

        </div>


        <div className="notifications-stat-card">

          <div className="notifications-stat-icon">
            <i className="fa-solid fa-envelope-open" />
          </div>

          <div>
            <strong>
              {readCount}
            </strong>

            <span>
              Read
            </span>
          </div>

        </div>


        <div className="notifications-stat-card">

          <div className="notifications-stat-icon">
            <i className="fa-solid fa-circle-check" />
          </div>

          <div>
            <strong>
              {unreadCount === 0
                ? "Done"
                : "Active"}
            </strong>

            <span>
              Notification Status
            </span>
          </div>

        </div>

      </section>


      {/* =================================================
          TOOLBAR
      ================================================= */}

      <section className="notifications-toolbar">

        <div className="notifications-toolbar-left">

          {filters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              className={`notifications-filter-btn ${activeFilter === filter.key
                ? "active"
                : ""
                }`}
              onClick={() =>
                setActiveFilter(
                  filter.key
                )
              }
            >

              <i
                className={
                  filter.icon
                }
              />

              <span>
                {filter.label}
              </span>

              <strong>
                {filter.count}
              </strong>

            </button>
          ))}

        </div>


        <div className="notifications-toolbar-actions">

          {unreadCount > 0 && (
            <button
              type="button"
              className="notifications-action-btn"
              onClick={
                markAllAsRead
              }
            >
              <i className="fa-solid fa-check-double" />

              Mark all read
            </button>
          )}


          {notifications.length > 0 && (
            <button
              type="button"
              className="notifications-clear-btn"
              onClick={clearAll}
            >
              <i className="fa-solid fa-trash" />

              Clear all
            </button>
          )}

        </div>

      </section>


      {/* =================================================
          NOTIFICATIONS LIST
      ================================================= */}

      <section className="notifications-section">

        <div className="notifications-section-header">

          <div>

            <span className="notifications-label">
              Your activity
            </span>

            <h2>
              Notifications
            </h2>

            <p>
              Important updates from your
              AU Community activity.
            </p>

          </div>


          <div className="notifications-result-count">
            {filteredNotifications.length}{" "}
            notifications
          </div>

        </div>


        {loading ? (
          <div className="notifications-empty">

            <div className="notifications-empty-icon">
              <i className="fa-solid fa-spinner fa-spin" />
            </div>

            <h3>
              Loading notifications...
            </h3>

            <p>
              Please wait while we fetch
              your latest updates.
            </p>

          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="notifications-empty">

            <div className="notifications-empty-icon">
              <i className="fa-solid fa-bell-slash" />
            </div>

            <h3>
              You're all caught up
            </h3>

            <p>
              There are no notifications
              in this section right now.
            </p>

            {activeFilter !== "all" && (
              <button
                type="button"
                className="notifications-reset-btn"
                onClick={() =>
                  setActiveFilter("all")
                }
              >
                <i className="fa-solid fa-layer-group" />
                View All
              </button>
            )}

          </div>
        ) : (
          <div className="notifications-list">

            {filteredNotifications.map(
              (notification) => (
                <article
                  key={notification._id}
                  className={`notification-item ${!notification.read
                    ? "unread"
                    : ""
                    }`}
                >

                  {/* Icon */}

                  <div
                    className={`notification-icon notification-type-${notification.type}`}
                  >
                    <i
                      className={
                        notification.icon ||
                        getNotificationIcon(
                          notification.type
                        )
                      }
                    />
                  </div>


                  {/* Content */}

                  <div className="notification-content">

                    <div className="notification-top">

                      <div className="notification-title-row">

                        <h3>
                          {notification.title}
                        </h3>

                        {!notification.read && (
                          <span className="notification-new">
                            NEW
                          </span>
                        )}

                      </div>

                      <span className="notification-time">
                        {notification.time}
                      </span>

                    </div>


                    <p>
                      {notification.message}
                    </p>


                    <div className="notification-actions">

                      {!notification.read && (
                        <button
                          type="button"
                          onClick={() =>
                            markAsRead(
                              notification._id
                            )
                          }
                        >
                          <i className="fa-solid fa-check" />
                          Mark as read
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          deleteNotification(
                            notification._id
                          )
                        }
                        className="notification-delete"
                      >
                        <i className="fa-solid fa-trash" />
                        Remove
                      </button>

                    </div>

                  </div>


                  {/* Unread indicator */}

                  {!notification.read && (
                    <span className="notification-unread-dot" />
                  )}

                </article>
              )
            )}

          </div>
        )}

      </section>


      {/* =================================================
          BOTTOM CTA
      ================================================= */}

      <section className="notifications-cta">

        <div className="notifications-cta-content">

          <span className="notifications-label">
            Stay connected
          </span>

          <h2>
            Don't miss what matters.
          </h2>

          <p>
            Keep your community activity
            up to date and never miss an
            important opportunity.
          </p>

        </div>


        <button
          type="button"
          className="notifications-cta-btn"
          onClick={() => {
            setActiveFilter("unread");
          }}
        >
          <i className="fa-solid fa-envelope" />
          View Unread
        </button>

      </section>


      {/* =================================================
          TOAST
      ================================================= */}

      {toast && (
        <div className="notifications-toast">

          <i className="fa-solid fa-circle-check" />

          <span>
            {toast}
          </span>

        </div>
      )}

    </div>
  );
};


export default TeacherNotifications;