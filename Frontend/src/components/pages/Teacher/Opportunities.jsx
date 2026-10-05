import React, { useEffect, useMemo, useState } from "react";
import API from "../../../api";
import "../../../styles/TeacherStyle/TeacherOpportunities.css";


const FALLBACK_OPPORTUNITIES = [];


const normalizeOpportunity = (item, index) => {
  return {
    _id: item?._id || item?.id || `opportunity-${index}`,
    title:
      item?.title ||
      item?.name ||
      item?.opportunityTitle ||
      "Untitled Opportunity",

    provider:
      item?.provider ||
      item?.organization ||
      item?.company ||
      item?.createdBy?.name ||
      "AU Community",

    type:
      item?.type ||
      item?.category ||
      item?.opportunityType ||
      "Opportunity",

    description:
      item?.description ||
      item?.details ||
      item?.summary ||
      "Explore this opportunity and become part of the AU Community.",

    deadline:
      item?.deadline ||
      item?.applicationDeadline ||
      item?.lastDate ||
      "Open",

    location:
      item?.location ||
      item?.city ||
      "Not specified",

    mode:
      item?.mode ||
      item?.workMode ||
      item?.format ||
      "Flexible",

    status:
      item?.status ||
      "Open",

    icon:
      item?.icon ||
      "fa-solid fa-briefcase",

    tags:
      Array.isArray(item?.tags)
        ? item.tags
        : Array.isArray(item?.skills)
          ? item.skills
          : [],

    featured: Boolean(item?.featured),
  };
};


const getOpportunityCategory = (opportunity) => {
  const value = `${opportunity.type || ""}`.toLowerCase();

  if (value.includes("research")) return "research";
  if (value.includes("workshop")) return "workshop";
  if (value.includes("training")) return "workshop";
  if (value.includes("mentor")) return "mentorship";
  if (value.includes("competition")) return "competition";
  if (value.includes("community")) return "community";
  if (value.includes("exchange")) return "exchange";

  return "other";
};


const TeacherOpportunities = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [toast, setToast] = useState("");
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);

  useEffect(() => {
    fetchOpportunities();
  }, []);


  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [toast]);


  const fetchOpportunities = async () => {
    setLoading(true);

    try {
      /*
       * Main API
       */
      const response = await API.get("/opportunities");

      const data =
        response?.data?.opportunities ||
        response?.data?.data ||
        response?.data ||
        [];

      setOpportunities(
        Array.isArray(data) ? data.map((item, index) => normalizeOpportunity(item, index)) : []
      );
    } catch (error) {
      console.error(
        "Failed to fetch opportunities:",
        error
      );
      setOpportunities([]);
    } finally {
      setLoading(false);
    }
  };


  const filteredOpportunities = useMemo(() => {
    const query = search.trim().toLowerCase();

    return opportunities.filter((opportunity) => {
      const category =
        getOpportunityCategory(opportunity);

      const matchesFilter =
        activeFilter === "all" ||
        category === activeFilter;

      if (!matchesFilter) return false;

      if (!query) return true;

      const searchableText = [
        opportunity.title,
        opportunity.provider,
        opportunity.type,
        opportunity.description,
        opportunity.location,
        opportunity.mode,
        ...(opportunity.tags || []),
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [opportunities, activeFilter, search]);


  const stats = useMemo(() => {
    const research = opportunities.filter(
      (item) =>
        getOpportunityCategory(item) === "research"
    ).length;

    const mentorship = opportunities.filter(
      (item) =>
        getOpportunityCategory(item) === "mentorship"
    ).length;

    const community = opportunities.filter(
      (item) =>
        getOpportunityCategory(item) === "community"
    ).length;

    return {
      total: opportunities.length,
      research,
      mentorship,
      community,
    };
  }, [opportunities]);


  const filters = [
    {
      key: "all",
      label: "All",
      icon: "fa-solid fa-grid-2",
    },
    {
      key: "research",
      label: "Research",
      icon: "fa-solid fa-flask",
    },
    {
      key: "workshop",
      label: "Workshops",
      icon: "fa-solid fa-chalkboard-user",
    },
    {
      key: "mentorship",
      label: "Mentorship",
      icon: "fa-solid fa-handshake",
    },
    {
      key: "competition",
      label: "Competitions",
      icon: "fa-solid fa-trophy",
    },
    {
      key: "community",
      label: "Community",
      icon: "fa-solid fa-users",
    },
  ];


  const handleViewOpportunity = (opportunity) => {
    setSelectedOpportunity(opportunity);

    /*
     * If later your backend provides an application/details
     * route, this is the place to navigate to it.
     */
  };


  const handleApply = (opportunity) => {
    setToast(
      `Application started for "${opportunity.title}".`
    );

    setSelectedOpportunity(null);
  };


  const clearSearch = () => {
    setSearch("");
  };


  return (
    <div className="opportunities-page">

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="opportunities-hero">
        <div className="opportunities-hero-content">

          <div className="opportunities-eyebrow">
            Faculty Opportunities
          </div>

          <h1>
            Discover your next
            <br />
            <span>opportunity.</span>
          </h1>

          <p>
            Explore research, mentorship, academic,
            community and professional opportunities
            available across the AU Community.
          </p>

        </div>


        <div className="opportunities-hero-art">
          <div className="opportunities-art-ring one" />
          <div className="opportunities-art-ring two" />

          <div className="opportunities-art-center">
            <i className="fa-solid fa-briefcase" />
            <span>GROW</span>
          </div>
        </div>
      </section>


      {/* =====================================================
          STATS
      ===================================================== */}

      <section className="opportunities-stats">

        <div className="opportunities-stat-card">
          <div className="opportunities-stat-icon">
            <i className="fa-solid fa-layer-group" />
          </div>

          <div>
            <strong>{stats.total}</strong>
            <span>Total Opportunities</span>
          </div>
        </div>


        <div className="opportunities-stat-card">
          <div className="opportunities-stat-icon">
            <i className="fa-solid fa-flask" />
          </div>

          <div>
            <strong>{stats.research}</strong>
            <span>Research</span>
          </div>
        </div>


        <div className="opportunities-stat-card">
          <div className="opportunities-stat-icon">
            <i className="fa-solid fa-handshake" />
          </div>

          <div>
            <strong>{stats.mentorship}</strong>
            <span>Mentorship</span>
          </div>
        </div>


        <div className="opportunities-stat-card">
          <div className="opportunities-stat-icon">
            <i className="fa-solid fa-users" />
          </div>

          <div>
            <strong>{stats.community}</strong>
            <span>Community</span>
          </div>
        </div>

      </section>


      {/* =====================================================
          SEARCH + FILTER
      ===================================================== */}

      <section className="opportunities-toolbar">

        <div className="opportunities-search">
          <i className="fa-solid fa-magnifying-glass" />

          <input
            type="text"
            placeholder="Search opportunities, skills, organizations..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

          {search && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Clear search"
              className="network-search-clear"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          )}
        </div>


        <div className="opportunities-filters">
          {filters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              className={`opportunities-filter-btn ${activeFilter === filter.key
                ? "active"
                : ""
                }`}
              onClick={() =>
                setActiveFilter(filter.key)
              }
            >
              <i className={filter.icon} />
              <span>{filter.label}</span>
            </button>
          ))}
        </div>

      </section>


      {/* =====================================================
          OPPORTUNITIES
      ===================================================== */}

      <section className="opportunities-section">

        <div className="opportunities-section-header">

          <div>
            <span className="opportunities-label">
              Explore
            </span>

            <h2>
              Opportunities for you
            </h2>

            <p>
              Find meaningful ways to learn,
              collaborate and contribute.
            </p>
          </div>


          <div className="opportunities-result-count">
            {filteredOpportunities.length} results
          </div>

        </div>


        {loading ? (
          <div className="opportunities-empty">
            <div className="opportunities-empty-icon">
              <i className="fa-solid fa-spinner fa-spin" />
            </div>

            <h3>
              Loading opportunities...
            </h3>

            <p>
              Please wait while we find the latest
              opportunities for you.
            </p>
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <div className="opportunities-empty">

            <div className="opportunities-empty-icon">
              <i className="fa-solid fa-magnifying-glass" />
            </div>

            <h3>
              No opportunities found
            </h3>

            <p>
              Try changing your search or selecting
              another category.
            </p>

            <button
              type="button"
              className="opportunities-filter-btn active"
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
          <div className="opportunities-grid">

            {filteredOpportunities.map(
              (opportunity) => (
                <article
                  key={opportunity._id}
                  className={`opportunity-card ${opportunity.featured
                    ? "featured"
                    : ""
                    }`}
                >

                  {/* Card Top */}
                  <div className="opportunity-card-top">

                    <span className="opportunity-type">
                      <i className="fa-solid fa-tag" />
                      {opportunity.type}
                    </span>

                    <span className="opportunity-status">
                      {opportunity.status}
                    </span>

                  </div>


                  {/* Icon */}
                  <div className="opportunity-icon">
                    <i
                      className={
                        opportunity.icon ||
                        "fa-solid fa-briefcase"
                      }
                    />
                  </div>


                  {/* Content */}
                  <h3>
                    {opportunity.title}
                  </h3>

                  <span className="opportunity-provider">
                    {opportunity.provider}
                  </span>

                  <p className="opportunity-card-description">
                    {opportunity.description}
                  </p>


                  {/* Meta */}
                  <div className="opportunity-meta">

                    <div className="opportunity-meta-item">
                      <i className="fa-solid fa-location-dot" />
                      <span>
                        {opportunity.location}
                      </span>
                    </div>

                    <div className="opportunity-meta-item">
                      <i className="fa-solid fa-laptop" />
                      <span>
                        {opportunity.mode}
                      </span>
                    </div>

                  </div>


                  {/* Tags */}
                  {opportunity.tags?.length > 0 && (
                    <div className="opportunity-tags">
                      {opportunity.tags
                        .slice(0, 3)
                        .map((tag, index) => (
                          <span
                            className="opportunity-tag"
                            key={`${tag}-${index}`}
                          >
                            {tag}
                          </span>
                        ))}
                    </div>
                  )}


                  {/* Footer */}
                  <div className="opportunity-card-footer">

                    <span className="opportunity-deadline">
                      Deadline:{" "}
                      <strong>
                        {opportunity.deadline}
                      </strong>
                    </span>

                    <button
                      type="button"
                      className="opportunity-view-btn"
                      onClick={() =>
                        handleViewOpportunity(
                          opportunity
                        )
                      }
                    >
                      View Details
                      <i className="fa-solid fa-arrow-right" />
                    </button>

                  </div>

                </article>
              )
            )}

          </div>
        )}

      </section>


      {/* =====================================================
          CTA
      ===================================================== */}

      <section className="opportunities-cta">

        <div className="opportunities-cta-content">

          <span className="opportunities-label">
            Make an impact
          </span>

          <h2>
            Your experience can create
            <br />
            someone's next opportunity.
          </h2>

          <p>
            Mentor, collaborate, research and
            contribute to the AU Community.
          </p>

        </div>


        <button
          type="button"
          className="opportunities-cta-btn"
          onClick={() => {
            setToast(
              "Thank you for contributing to the AU Community."
            );
          }}
        >
          <i className="fa-solid fa-arrow-right" />
          Get Involved
        </button>

      </section>


      {/* =====================================================
          DETAILS MODAL
      ===================================================== */}

      {selectedOpportunity && (
        <div
          className="opportunity-modal-overlay"
          onClick={() =>
            setSelectedOpportunity(null)
          }
        >
          <div
            className="opportunity-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              type="button"
              className="opportunity-modal-close"
              onClick={() =>
                setSelectedOpportunity(null)
              }
              aria-label="Close"
            >
              <i className="fa-solid fa-xmark" />
            </button>


            <div className="opportunity-modal-icon">
              <i
                className={
                  selectedOpportunity.icon ||
                  "fa-solid fa-briefcase"
                }
              />
            </div>


            <span className="opportunity-type">
              {selectedOpportunity.type}
            </span>


            <h2>
              {selectedOpportunity.title}
            </h2>


            <span className="opportunity-provider">
              {selectedOpportunity.provider}
            </span>


            <p className="opportunity-modal-description">
              {selectedOpportunity.description}
            </p>


            <div className="opportunity-modal-meta">

              <div>
                <i className="fa-solid fa-location-dot" />
                <span>
                  {selectedOpportunity.location}
                </span>
              </div>

              <div>
                <i className="fa-solid fa-laptop" />
                <span>
                  {selectedOpportunity.mode}
                </span>
              </div>

              <div>
                <i className="fa-solid fa-calendar-days" />
                <span>
                  {selectedOpportunity.deadline}
                </span>
              </div>

            </div>


            {selectedOpportunity.tags?.length > 0 && (
              <div className="opportunity-tags">
                {selectedOpportunity.tags.map(
                  (tag, index) => (
                    <span
                      className="opportunity-tag"
                      key={`${tag}-${index}`}
                    >
                      {tag}
                    </span>
                  )
                )}
              </div>
            )}


            <div className="opportunity-modal-actions">

              <button
                type="button"
                className="opportunity-modal-secondary"
                onClick={() =>
                  setSelectedOpportunity(null)
                }
              >
                Close
              </button>

              <button
                type="button"
                className="opportunity-modal-primary"
                onClick={() =>
                  handleApply(
                    selectedOpportunity
                  )
                }
              >
                <i className="fa-solid fa-paper-plane" />
                Apply / Connect
              </button>

            </div>

          </div>
        </div>
      )}


      {/* =====================================================
          TOAST
      ===================================================== */}

      {toast && (
        <div className="opportunities-toast">
          <i className="fa-solid fa-circle-check" />
          <span>{toast}</span>
        </div>
      )}

    </div>
  );
};


export default TeacherOpportunities;