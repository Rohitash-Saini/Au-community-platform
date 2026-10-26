import React, { useEffect, useMemo, useState } from "react";
import API from "../../../api";
import ExpandableText from "../../common/ExpandableText";
import "../../../styles/TeacherStyle/TeacherEvents.css";


const FALLBACK_EVENTS = [];


const normalizeEvent = (item, index) => {
  return {
    _id:
      item?._id ||
      item?.id ||
      `event-${index}`,

    title:
      item?.title ||
      item?.name ||
      item?.eventName ||
      "Untitled Event",

    description:
      item?.description ||
      item?.details ||
      item?.summary ||
      "Join the AU Community for this upcoming event.",

    date:
      item?.date ||
      item?.eventDate ||
      item?.startDate ||
      "Date TBA",

    time:
      item?.time ||
      item?.eventTime ||
      item?.startTime ||
      "Time TBA",

    location:
      item?.location ||
      item?.venue ||
      item?.place ||
      "Location TBA",

    type:
      item?.type ||
      item?.category ||
      item?.eventType ||
      "Event",

    organizer:
      item?.organizer ||
      item?.organization ||
      item?.createdBy?.name ||
      "AU Community",

    attendees:
      item?.attendees ||
      item?.attendeeCount ||
      item?.participants ||
      0,

    status:
      item?.status ||
      "Upcoming",

    icon:
      item?.icon ||
      "fa-solid fa-calendar-days",

    featured:
      Boolean(item?.featured),

    image:
      item?.image ||
      item?.coverImage ||
      item?.banner ||
      "",
  };
};


const getEventCategory = (event) => {
  const type = `${event.type || ""}`.toLowerCase();

  if (type.includes("academic")) return "academic";
  if (type.includes("conference")) return "conference";
  if (type.includes("workshop")) return "workshop";
  if (type.includes("community")) return "community";
  if (type.includes("network")) return "networking";
  if (type.includes("social")) return "social";

  return "other";
};


const TeacherEvents = () => {
  const [events, setEvents] = useState([]);

  const [loading, setLoading] = useState(true);

  const [activeFilter, setActiveFilter] =
    useState("all");

  const [search, setSearch] = useState("");

  const [selectedEvent, setSelectedEvent] =
    useState(null);

  const [registeredEvents, setRegisteredEvents] =
    useState([]);

  const [toast, setToast] = useState("");


  /* =====================================================
     FETCH EVENTS
     ===================================================== */

  useEffect(() => {
    fetchEvents();
  }, []);


  const fetchEvents = async () => {
    setLoading(true);

    try {
      const response =
        await API.get("/events");

      const data =
        response?.data?.events ||
        response?.data?.data ||
        response?.data ||
        [];

      setEvents(
        Array.isArray(data) ? data.map((event, index) => normalizeEvent(event, index)) : []
      );
    } catch (error) {
      console.error(
        "Failed to fetch events:",
        error
      );
      setEvents([]);
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
     FILTER EVENTS
     ===================================================== */

  const filteredEvents = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return events.filter((event) => {
      const category =
        getEventCategory(event);

      const matchesFilter =
        activeFilter === "all" ||
        category === activeFilter;

      if (!matchesFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchableText = [
        event.title,
        event.description,
        event.location,
        event.type,
        event.organizer,
        event.status,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [
    events,
    activeFilter,
    search,
  ]);


  /* =====================================================
     STATS
     ===================================================== */

  const stats = useMemo(() => {
    const upcoming =
      events.filter(
        (event) =>
          `${event.status}`
            .toLowerCase()
            .includes("upcoming")
      ).length;

    const workshops =
      events.filter(
        (event) =>
          getEventCategory(event) ===
          "workshop"
      ).length;

    const community =
      events.filter(
        (event) =>
          getEventCategory(event) ===
          "community"
      ).length;

    const attendees = events.reduce(
      (total, event) =>
        total +
        Number(event.attendees || 0),
      0
    );

    return {
      total: events.length,
      upcoming,
      workshops,
      attendees,
      community,
    };
  }, [events]);


  /* =====================================================
     FILTERS
     ===================================================== */

  const filters = [
    {
      key: "all",
      label: "All Events",
      icon: "fa-solid fa-calendar-days",
    },
    {
      key: "academic",
      label: "Academic",
      icon: "fa-solid fa-graduation-cap",
    },
    {
      key: "conference",
      label: "Conference",
      icon: "fa-solid fa-microphone",
    },
    {
      key: "workshop",
      label: "Workshops",
      icon: "fa-solid fa-chalkboard-user",
    },
    {
      key: "community",
      label: "Community",
      icon: "fa-solid fa-users",
    },
    {
      key: "networking",
      label: "Networking",
      icon: "fa-solid fa-handshake",
    },
  ];


  /* =====================================================
     REGISTER
     ===================================================== */

  const handleRegister = (event) => {
    const alreadyRegistered =
      registeredEvents.includes(
        event._id
      );

    if (alreadyRegistered) {
      setToast(
        `You are already registered for "${event.title}".`
      );

      return;
    }

    setRegisteredEvents((previous) => [
      ...previous,
      event._id,
    ]);

    setToast(
      `Registration confirmed for "${event.title}".`
    );

    setSelectedEvent(null);
  };


  /* =====================================================
     SHARE
     ===================================================== */

  const handleShare = async (event) => {
    const shareText =
      `${event.title} - ${event.date} at ${event.location}`;

    try {
      if (
        navigator?.clipboard?.writeText
      ) {
        await navigator.clipboard.writeText(
          shareText
        );

        setToast(
          "Event details copied to clipboard."
        );
      } else {
        setToast(
          "Unable to copy event details."
        );
      }
    } catch (error) {
      console.error(
        "Share failed:",
        error
      );

      setToast(
        "Unable to share this event."
      );
    }
  };


  /* =====================================================
     CLEAR SEARCH
     ===================================================== */

  const clearSearch = () => {
    setSearch("");
  };


  return (
    <div className="events-page">

      {/* =================================================
          HERO
      ================================================= */}

      <section className="events-hero">

        <div className="events-hero-content">

          <div className="events-eyebrow">
            AU Community Events
          </div>

          <h1>
            Connect.
            <br />
            <span>Learn. Grow.</span>
          </h1>

          <p>
            Discover academic events, workshops,
            networking sessions and community
            experiences happening across the
            AU Community.
          </p>

        </div>


        <div className="events-hero-art">

          <div className="events-art-ring one" />

          <div className="events-art-ring two" />

          <div className="events-art-center">
            <i className="fa-solid fa-calendar-days" />
            <span>EVENTS</span>
          </div>

        </div>

      </section>


      {/* =================================================
          STATS
      ================================================= */}

      <section className="events-stats">

        <div className="events-stat-card">

          <div className="events-stat-icon">
            <i className="fa-solid fa-calendar-check" />
          </div>

          <div>
            <strong>
              {stats.total}
            </strong>

            <span>
              Total Events
            </span>
          </div>

        </div>


        <div className="events-stat-card">

          <div className="events-stat-icon">
            <i className="fa-solid fa-clock" />
          </div>

          <div>
            <strong>
              {stats.upcoming}
            </strong>

            <span>
              Upcoming
            </span>
          </div>

        </div>


        <div className="events-stat-card">

          <div className="events-stat-icon">
            <i className="fa-solid fa-chalkboard-user" />
          </div>

          <div>
            <strong>
              {stats.workshops}
            </strong>

            <span>
              Workshops
            </span>
          </div>

        </div>


        <div className="events-stat-card">

          <div className="events-stat-icon">
            <i className="fa-solid fa-users" />
          </div>

          <div>
            <strong>
              {stats.attendees}
            </strong>

            <span>
              Community Seats
            </span>
          </div>

        </div>

      </section>


      {/* =================================================
          TOOLBAR
      ================================================= */}

      <section className="events-toolbar">

        <div className="events-search">

          <i className="fa-solid fa-magnifying-glass" />

          <input
            type="text"
            placeholder="Search events, topics, locations..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

          {search && (
            <button
              type="button"
              className="events-search-clear"
              onClick={clearSearch}
              aria-label="Clear search"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          )}

        </div>


        <div className="events-filters">

          {filters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              className={`events-filter-btn ${activeFilter === filter.key
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
            </button>
          ))}

        </div>

      </section>


      {/* =================================================
          EVENT LIST
      ================================================= */}

      <section className="events-section">

        <div className="events-section-header">

          <div>

            <span className="events-label">
              What's happening
            </span>

            <h2>
              Upcoming events
            </h2>

            <p>
              Find events that match your
              interests and connect with the
              community.
            </p>

          </div>


          <div className="events-result-count">
            {filteredEvents.length} events
          </div>

        </div>


        {loading ? (
          <div className="events-empty">

            <div className="events-empty-icon">
              <i className="fa-solid fa-spinner fa-spin" />
            </div>

            <h3>
              Loading events...
            </h3>

            <p>
              Please wait while we fetch the
              latest AU Community events.
            </p>

          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="events-empty">

            <div className="events-empty-icon">
              <i className="fa-solid fa-calendar-xmark" />
            </div>

            <h3>
              No events found
            </h3>

            <p>
              Try changing your search or
              selecting another category.
            </p>

            <button
              type="button"
              className="events-reset-btn"
              onClick={() => {
                setSearch("");
                setActiveFilter("all");
              }}
            >
              <i className="fa-solid fa-rotate-left" />
              Reset Filters
            </button>

          </div>
        ) : (
          <div className="events-grid">

            {filteredEvents.map(
              (event) => {
                const isRegistered =
                  registeredEvents.includes(
                    event._id
                  );

                return (
                  <article
                    key={event._id}
                    className={`event-card ${event.featured
                      ? "featured"
                      : ""
                      }`}
                  >

                    {/* Card Top */}

                    <div className="event-card-top">

                      <span className="event-type">
                        <i className="fa-solid fa-tag" />
                        {event.type}
                      </span>

                      <span className="event-status">
                        {event.status}
                      </span>

                    </div>

                    {event.image && (
                      <div style={{ width: '100%', maxHeight: '220px', borderRadius: '10px', overflow: 'hidden', margin: '12px 0', backgroundColor: '#0f172a', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        {event.image.startsWith("data:video") || event.image.endsWith(".mp4") ? (
                          <video controls src={event.image} style={{ width: '100%', maxHeight: '220px', objectFit: 'contain' }} />
                        ) : (
                          <img src={event.image} alt={event.title} style={{ width: '100%', maxHeight: '220px', objectFit: 'contain' }} />
                        )}
                      </div>
                    )}

                    {/* Event Icon */}

                    {!event.image && (
                      <div className="event-icon">
                        <i
                          className={
                            event.icon ||
                            "fa-solid fa-calendar-days"
                          }
                        />
                      </div>
                    )}


                    {/* Content */}

                    <h3>
                      {event.title}
                    </h3>

                    <span className="event-organizer">
                      {event.organizer}
                    </span>

                    <div className="event-description" style={{ margin: "8px 0" }}>
                      <ExpandableText text={event.description} linesLimit={3} charLimit={160} />
                    </div>


                    {/* Event Details */}

                    <div className="event-meta">

                      <div className="event-meta-item">
                        <i className="fa-solid fa-calendar-days" />

                        <span>
                          {event.date}
                        </span>
                      </div>


                      <div className="event-meta-item">
                        <i className="fa-solid fa-clock" />

                        <span>
                          {event.time}
                        </span>
                      </div>


                      <div className="event-meta-item">
                        <i className="fa-solid fa-location-dot" />

                        <span>
                          {event.location}
                        </span>
                      </div>


                      <div className="event-meta-item">
                        <i className="fa-solid fa-users" />

                        <span>
                          {event.attendees} attendees
                        </span>
                      </div>

                    </div>


                    {/* Footer */}

                    <div className="event-card-footer">

                      <button
                        type="button"
                        className="event-share-btn"
                        onClick={() =>
                          handleShare(event)
                        }
                        aria-label="Share event"
                      >
                        <i className="fa-solid fa-share-nodes" />
                      </button>


                      <button
                        type="button"
                        className={`event-view-btn ${isRegistered
                          ? "registered"
                          : ""
                          }`}
                        onClick={() =>
                          setSelectedEvent(
                            event
                          )
                        }
                      >
                        {isRegistered
                          ? "Registered"
                          : "View Event"}

                        <i className="fa-solid fa-arrow-right" />
                      </button>

                    </div>

                  </article>
                );
              }
            )}

          </div>
        )}

      </section>


      {/* =================================================
          CTA
      ================================================= */}

      <section className="events-cta">

        <div className="events-cta-content">

          <span className="events-label">
            Be part of the community
          </span>

          <h2>
            Great things happen
            <br />
            when we connect.
          </h2>

          <p>
            Attend an event, meet new people,
            share your ideas and grow together.
          </p>

        </div>


        <button
          type="button"
          className="events-cta-btn"
          onClick={() => {
            setActiveFilter("all");
            setSearch("");

            window.scrollTo({
              top: 0,
              behavior: "smooth",
            });
          }}
        >
          <i className="fa-solid fa-calendar-days" />
          Explore Events
        </button>

      </section>


      {/* =================================================
          EVENT MODAL
      ================================================= */}

      {selectedEvent && (
        <div
          className="event-modal-overlay"
          onClick={() =>
            setSelectedEvent(null)
          }
        >

          <div
            className="event-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              type="button"
              className="event-modal-close"
              onClick={() =>
                setSelectedEvent(null)
              }
              aria-label="Close"
            >
              <i className="fa-solid fa-xmark" />
            </button>


            <div className="event-modal-icon">
              <i
                className={
                  selectedEvent.icon ||
                  "fa-solid fa-calendar-days"
                }
              />
            </div>


            <span className="event-type">
              {selectedEvent.type}
            </span>


            <h2>
              {selectedEvent.title}
            </h2>


            <span className="event-organizer">
              Organized by{" "}
              {selectedEvent.organizer}
            </span>


            <p className="event-modal-description">
              {selectedEvent.description}
            </p>


            <div className="event-modal-details">

              <div>
                <i className="fa-solid fa-calendar-days" />

                <span>
                  <strong>Date</strong>
                  {selectedEvent.date}
                </span>
              </div>


              <div>
                <i className="fa-solid fa-clock" />

                <span>
                  <strong>Time</strong>
                  {selectedEvent.time}
                </span>
              </div>


              <div>
                <i className="fa-solid fa-location-dot" />

                <span>
                  <strong>Location</strong>
                  {selectedEvent.location}
                </span>
              </div>


              <div>
                <i className="fa-solid fa-users" />

                <span>
                  <strong>Participants</strong>
                  {selectedEvent.attendees}
                </span>
              </div>

            </div>


            <div className="event-modal-actions">

              <button
                type="button"
                className="event-modal-secondary"
                onClick={() =>
                  handleShare(
                    selectedEvent
                  )
                }
              >
                <i className="fa-solid fa-share-nodes" />
                Share
              </button>


              <button
                type="button"
                className="event-modal-primary"
                onClick={() =>
                  handleRegister(
                    selectedEvent
                  )
                }
              >
                <i
                  className={
                    registeredEvents.includes(
                      selectedEvent._id
                    )
                      ? "fa-solid fa-circle-check"
                      : "fa-solid fa-calendar-check"
                  }
                />

                {registeredEvents.includes(
                  selectedEvent._id
                )
                  ? "Registered"
                  : "Register Now"}
              </button>

            </div>

          </div>

        </div>
      )}


      {/* =================================================
          TOAST
      ================================================= */}

      {toast && (
        <div className="events-toast">

          <i className="fa-solid fa-circle-check" />

          <span>
            {toast}
          </span>

        </div>
      )}

    </div>
  );
};


export default TeacherEvents;