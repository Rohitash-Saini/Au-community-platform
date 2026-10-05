import React, { useEffect, useMemo, useState } from "react";
import API from "../../../api";
import "../../../styles/StudentStyle/StudentEvents.css";

const fallbackEvents = [];

const normalizeEvent = (event, index = 0) => {
  return {
    _id:
      event?._id ||
      event?.id ||
      `event-${index}`,
    title:
      event?.title ||
      event?.name ||
      "Untitled Event",
    category: (
      event?.category ||
      event?.type ||
      "other"
    ).toLowerCase(),
    organizer:
      event?.organizer ||
      event?.organization ||
      event?.createdBy?.name ||
      "AU Community",
    description:
      event?.description ||
      event?.details ||
      "Event details are available here.",
    date:
      event?.date ||
      event?.eventDate ||
      "Date to be announced",
    time:
      event?.time ||
      event?.eventTime ||
      "Time to be announced",
    location:
      event?.location ||
      event?.venue ||
      event?.city ||
      "AU Community",
    mode:
      event?.mode ||
      event?.eventMode ||
      "On Campus",
    seats:
      event?.seats ||
      event?.capacity ||
      event?.availableSeats ||
      0,
    status:
      event?.status ||
      "Upcoming",
    image:
      event?.image ||
      event?.coverImage ||
      event?.banner ||
      "",
  };
};

const categoryLabels = {
  all: "All",
  technology: "Technology",
  conference: "Conference",
  career: "Career",
  workshop: "Workshop",
  networking: "Networking",
  competition: "Competitions",
  other: "Other",
};

const getCategoryIcon = (category) => {
  switch (category) {
    case "technology":
      return "💻";
    case "conference":
      return "🎤";
    case "career":
      return "💼";
    case "workshop":
      return "🛠️";
    case "networking":
      return "🤝";
    case "competition":
      return "🏆";
    default:
      return "📅";
  }
};

const getCategoryLabel = (category) => {
  return categoryLabels[category] || "Event";
};

function Event() {
  const [events, setEvents] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registeredIds, setRegisteredIds] = useState([]);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);

      try {
        const response = await API.get("/events");

        const data = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.events)
            ? response.data.events
            : [];

        setEvents(data.map(normalizeEvent));
      } catch (error) {
        console.error("Failed to fetch events:", error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast("");
    }, 2800);

    return () => clearTimeout(timer);
  }, [toast]);

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return events.filter((event) => {
      const matchesFilter =
        activeFilter === "all" ||
        event.category === activeFilter;

      const searchableText = [
        event.title,
        event.category,
        event.organizer,
        event.description,
        event.location,
        event.mode,
        event.date,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchableText.includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [events, activeFilter, search]);

  const stats = useMemo(() => {
    return {
      total: events.length,
      upcoming: events.filter(
        (event) =>
          event.status?.toLowerCase() === "upcoming"
      ).length,
      workshops: events.filter(
        (event) => event.category === "workshop"
      ).length,
      networking: events.filter(
        (event) => event.category === "networking"
      ).length,
    };
  }, [events]);

  const handleRegister = async (event) => {
    if (registeredIds.includes(event._id)) {
      setToast("You are already registered for this event.");
      return;
    }

    try {
      await API.post(`/events/${event._id}/register`);

      setRegisteredIds((prev) => [
        ...prev,
        event._id,
      ]);

      setToast("Event registration successful.");
    } catch (error) {
      console.error("Event registration failed:", error);

      /*
        Local fallback until registration API is connected.
      */
      setRegisteredIds((prev) => [
        ...prev,
        event._id,
      ]);

      setToast("Registration request submitted.");
    }
  };

  const handleShare = async (event) => {
    const shareText = `${event.title} - ${event.date} at ${event.location}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: event.title,
          text: shareText,
        });

        return;
      }

      await navigator.clipboard.writeText(shareText);
      setToast("Event details copied to clipboard.");
    } catch (error) {
      console.error("Share failed:", error);
      setToast("Unable to share this event.");
    }
  };

  return (
    <div className="student-event-page">
      {/* =====================================================
          HERO
      ===================================================== */}
      <section className="student-event-hero">
        <div className="student-event-hero-content">
          <span className="student-event-eyebrow">
            AU Community Events
          </span>

          <h1>Discover Events That Inspire You</h1>

          <p>
            Find workshops, conferences, networking sessions,
            competitions and community events happening across
            the AU Community.
          </p>

          <div className="student-event-search">
            <span className="event-search-icon">⌕</span>

            <input
              type="text"
              placeholder="Search events, categories or locations..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />
          </div>
        </div>

        <div className="student-event-hero-art">
          <div className="event-orbit event-orbit-one" />
          <div className="event-orbit event-orbit-two" />

          <div className="event-center-icon">
            📅
          </div>

          <span className="event-floating-icon event-float-one">
            🎤
          </span>

          <span className="event-floating-icon event-float-two">
            💻
          </span>

          <span className="event-floating-icon event-float-three">
            🏆
          </span>

          <span className="event-floating-icon event-float-four">
            🤝
          </span>
        </div>
      </section>

      {/* =====================================================
          STATS
      ===================================================== */}
      <section className="student-event-stats">
        <div className="student-event-stat">
          <div className="student-event-stat-icon">
            📅
          </div>

          <div>
            <strong>{stats.total}</strong>
            <span>Total Events</span>
          </div>
        </div>

        <div className="student-event-stat">
          <div className="student-event-stat-icon">
            🔔
          </div>

          <div>
            <strong>{stats.upcoming}</strong>
            <span>Upcoming</span>
          </div>
        </div>

        <div className="student-event-stat">
          <div className="student-event-stat-icon">
            🛠️
          </div>

          <div>
            <strong>{stats.workshops}</strong>
            <span>Workshops</span>
          </div>
        </div>

        <div className="student-event-stat">
          <div className="student-event-stat-icon">
            🤝
          </div>

          <div>
            <strong>{stats.networking}</strong>
            <span>Networking</span>
          </div>
        </div>
      </section>

      {/* =====================================================
          FILTER TOOLBAR
      ===================================================== */}
      <section className="student-event-toolbar">
        <div className="student-event-filter-group">
          {Object.entries(categoryLabels)
            .filter(([key]) => key !== "other")
            .map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`student-event-filter ${activeFilter === key
                  ? "active"
                  : ""
                  }`}
                onClick={() =>
                  setActiveFilter(key)
                }
              >
                {label}
              </button>
            ))}
        </div>

        <span className="student-event-result-count">
          {filteredEvents.length}{" "}
          {filteredEvents.length === 1
            ? "event"
            : "events"}
        </span>
      </section>

      {/* =====================================================
          EVENT SECTION
      ===================================================== */}
      <section className="student-event-section">
        <div className="student-event-section-header">
          <div className="student-event-section-title">
            Explore Events
          </div>

          {search && (
            <span className="student-event-search-result">
              Results for "{search}"
            </span>
          )}
        </div>

        {loading ? (
          <div className="student-event-loading">
            <span className="student-event-loader" />
            <p>Finding events for you...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="student-event-empty">
            <div className="student-event-empty-icon">
              🔎
            </div>

            <h3>No events found</h3>

            <p>
              Try another search term or select a
              different event category.
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setActiveFilter("all");
              }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="student-event-grid">
            {filteredEvents.map((event) => {
              const isRegistered =
                registeredIds.includes(event._id);

              return (
                <article
                  className="student-event-card"
                  key={event._id}
                >
                  {/* CARD TOP */}
                  <div className="student-event-card-top">
                    {event.image ? (
                      <img
                        src={event.image}
                        alt={event.title}
                        className="student-event-card-image"
                      />
                    ) : (
                      <div className="student-event-card-art">
                        <span>
                          {getCategoryIcon(
                            event.category
                          )}
                        </span>
                      </div>
                    )}

                    <span className="event-category-badge">
                      {getCategoryLabel(
                        event.category
                      )}
                    </span>

                    <span className="event-status">
                      {event.status}
                    </span>
                  </div>

                  {/* CARD BODY */}
                  <div className="student-event-card-body">
                    <h3>{event.title}</h3>

                    <p className="event-organizer">
                      {event.organizer}
                    </p>

                    <p className="student-event-description">
                      {event.description}
                    </p>

                    <div className="student-event-meta">
                      <span>
                        <b>◷</b>
                        {event.date}
                      </span>

                      <span>
                        <b>◴</b>
                        {event.time}
                      </span>

                      <span>
                        <b>⌖</b>
                        {event.location}
                      </span>

                      <span>
                        <b>◉</b>
                        {event.mode}
                      </span>
                    </div>

                    {event.seats > 0 && (
                      <div className="student-event-seats">
                        <span>Available seats</span>

                        <strong>
                          {event.seats}
                        </strong>
                      </div>
                    )}
                  </div>

                  {/* CARD ACTIONS */}
                  <div className="student-event-actions">
                    <button
                      type="button"
                      className="event-view-btn"
                      onClick={() =>
                        setSelectedEvent(event)
                      }
                    >
                      View Details
                    </button>

                    <button
                      type="button"
                      className={
                        isRegistered
                          ? "event-registered-btn"
                          : "event-register-btn"
                      }
                      disabled={isRegistered}
                      onClick={() =>
                        handleRegister(event)
                      }
                    >
                      {isRegistered
                        ? "Registered ✓"
                        : "Register"}
                    </button>

                    <button
                      type="button"
                      className="event-share-btn"
                      onClick={() =>
                        handleShare(event)
                      }
                      aria-label="Share event"
                    >
                      ↗
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* =====================================================
          CTA
      ===================================================== */}
      <section className="student-event-cta">
        <div className="student-event-cta-content">
          <span className="student-event-cta-label">
            Stay Connected
          </span>

          <h3>
            There is always something happening at AU.
          </h3>

          <p>
            Attend events, meet new people, learn new
            skills and become an active part of the
            community.
          </p>
        </div>

        <div className="student-event-cta-icon">
          🎉
        </div>
      </section>

      {/* =====================================================
          DETAILS MODAL
      ===================================================== */}
      {selectedEvent && (
        <div
          className="student-event-modal-overlay"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="student-event-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="student-event-modal-head">
              <div className="event-modal-heading">
                <div className="student-event-modal-icon">
                  {getCategoryIcon(
                    selectedEvent.category
                  )}
                </div>

                <div>
                  <span className="event-modal-category">
                    {getCategoryLabel(
                      selectedEvent.category
                    )}
                  </span>

                  <h2>{selectedEvent.title}</h2>

                  <p>
                    {selectedEvent.organizer}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="event-modal-close"
                onClick={() =>
                  setSelectedEvent(null)
                }
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="student-event-modal-body">
              <p className="event-modal-description">
                {selectedEvent.description}
              </p>

              <div className="event-modal-meta">
                <div>
                  <strong>Date</strong>
                  <span>
                    {selectedEvent.date}
                  </span>
                </div>

                <div>
                  <strong>Time</strong>
                  <span>
                    {selectedEvent.time}
                  </span>
                </div>

                <div>
                  <strong>Location</strong>
                  <span>
                    {selectedEvent.location}
                  </span>
                </div>

                <div>
                  <strong>Mode</strong>
                  <span>
                    {selectedEvent.mode}
                  </span>
                </div>

                <div>
                  <strong>Seats</strong>
                  <span>
                    {selectedEvent.seats > 0
                      ? selectedEvent.seats
                      : "Limited"}
                  </span>
                </div>

                <div>
                  <strong>Status</strong>
                  <span>
                    {selectedEvent.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="student-event-modal-foot">
              <button
                type="button"
                className="event-modal-secondary"
                onClick={() =>
                  handleShare(selectedEvent)
                }
              >
                Share Event
              </button>

              <button
                type="button"
                className={
                  registeredIds.includes(
                    selectedEvent._id
                  )
                    ? "event-modal-registered"
                    : "event-modal-primary"
                }
                disabled={registeredIds.includes(
                  selectedEvent._id
                )}
                onClick={() =>
                  handleRegister(selectedEvent)
                }
              >
                {registeredIds.includes(
                  selectedEvent._id
                )
                  ? "Registered ✓"
                  : "Register Now"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          TOAST
      ===================================================== */}
      {toast && (
        <div className="student-event-toast">
          {toast}
        </div>
      )}
    </div>
  );
}

export default Event;