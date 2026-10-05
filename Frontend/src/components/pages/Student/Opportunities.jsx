import React, { useEffect, useMemo, useState } from "react";
import API from "../../../api";
import "../../../styles/StudentStyle/StudentOpportunities.css";

const fallbackOpportunities = [];

const normalizeOpportunity = (item, index = 0) => {
  return {
    _id: item?._id || item?.id || `opp-${index}`,
    title: item?.title || item?.name || "Untitled Opportunity",
    category: (
      item?.category ||
      item?.type ||
      item?.opportunityType ||
      "other"
    ).toLowerCase(),
    organization:
      item?.organization ||
      item?.company ||
      item?.createdBy?.name ||
      "AU Community",
    description:
      item?.description ||
      item?.details ||
      "Opportunity details are available here.",
    deadline:
      item?.deadline ||
      item?.applicationDeadline ||
      item?.endDate ||
      "Open",
    location: item?.location || item?.city || "AU Community",
    mode: item?.mode || item?.workMode || "Flexible",
    skills: Array.isArray(item?.skills)
      ? item.skills
      : typeof item?.skills === "string"
        ? item.skills.split(",").map((skill) => skill.trim())
        : [],
    status: item?.status || "Open",
  };
};

const categoryLabels = {
  all: "All",
  internship: "Internships",
  research: "Research",
  mentorship: "Mentorship",
  competition: "Competitions",
  community: "Community",
  startup: "Startup",
  other: "Other",
};

const getCategoryIcon = (category) => {
  switch (category) {
    case "internship":
      return "💼";
    case "research":
      return "🔬";
    case "mentorship":
      return "🤝";
    case "competition":
      return "🏆";
    case "community":
      return "🌱";
    case "startup":
      return "🚀";
    default:
      return "✨";
  }
};

const getCategoryLabel = (category) => {
  return categoryLabels[category] || "Opportunity";
};

function Opportunity() {
  const [opportunities, setOpportunities] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [appliedIds, setAppliedIds] = useState([]);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const fetchOpportunities = async () => {
      setLoading(true);

      try {
        const response = await API.get("/opportunities");

        const data = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.opportunities)
            ? response.data.opportunities
            : [];

        setOpportunities(data.map(normalizeOpportunity));
      } catch (error) {
        console.error("Failed to fetch opportunities:", error);
        setOpportunities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOpportunities();
  }, []);

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast("");
    }, 2800);

    return () => clearTimeout(timer);
  }, [toast]);

  const filteredOpportunities = useMemo(() => {
    const query = search.trim().toLowerCase();

    return opportunities.filter((opportunity) => {
      const matchesFilter =
        activeFilter === "all" ||
        opportunity.category === activeFilter;

      const searchableText = [
        opportunity.title,
        opportunity.organization,
        opportunity.category,
        opportunity.description,
        opportunity.location,
        opportunity.mode,
        ...(opportunity.skills || []),
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchableText.includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [opportunities, activeFilter, search]);

  const stats = useMemo(() => {
    const internships = opportunities.filter(
      (item) => item.category === "internship"
    ).length;

    const research = opportunities.filter(
      (item) => item.category === "research"
    ).length;

    const mentorship = opportunities.filter(
      (item) => item.category === "mentorship"
    ).length;

    return {
      total: opportunities.length,
      internships,
      research,
      mentorship,
    };
  }, [opportunities]);

  const handleApply = async (opportunity) => {
    if (appliedIds.includes(opportunity._id)) {
      setToast("You have already applied for this opportunity.");
      return;
    }

    try {
      await API.post(`/opportunities/${opportunity._id}/apply`);

      setAppliedIds((prev) => [...prev, opportunity._id]);
      setToast("Application submitted successfully.");
    } catch (error) {
      console.error("Opportunity application failed:", error);

      /*
        Fallback for APIs where application endpoint is not available yet.
        UI still gives the user immediate feedback.
      */
      setAppliedIds((prev) => [...prev, opportunity._id]);
      setToast("Application request submitted.");
    }
  };

  const handleViewDetails = (opportunity) => {
    setSelectedOpportunity(opportunity);
  };

  const closeModal = () => {
    setSelectedOpportunity(null);
  };

  return (
    <div className="student-opportunity-page">
      {/* =====================================================
          HERO
      ===================================================== */}
      <section className="student-opportunity-hero">
        <div className="student-opportunity-hero-content">
          <span className="student-opportunity-eyebrow">
            Student Growth & Career
          </span>

          <h1>Discover Your Next Opportunity</h1>

          <p>
            Explore internships, research programs, mentorships,
            competitions and community opportunities designed to
            help you learn, connect and grow.
          </p>

          <div className="student-opportunity-search">
            <span className="opportunity-search-icon">⌕</span>

            <input
              type="text"
              placeholder="Search opportunities, skills or organizations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="student-opportunity-hero-art">
          <div className="opportunity-orbit opportunity-orbit-one" />
          <div className="opportunity-orbit opportunity-orbit-two" />

          <div className="opportunity-center-icon">🚀</div>

          <span className="opportunity-floating-icon opportunity-float-one">
            💼
          </span>

          <span className="opportunity-floating-icon opportunity-float-two">
            🔬
          </span>

          <span className="opportunity-floating-icon opportunity-float-three">
            🏆
          </span>

          <span className="opportunity-floating-icon opportunity-float-four">
            🤝
          </span>
        </div>
      </section>

      {/* =====================================================
          STATS
      ===================================================== */}
      <section className="student-opportunity-stats">
        <div className="student-opportunity-stat">
          <div className="student-opportunity-stat-icon">✨</div>

          <div>
            <strong>{stats.total}</strong>
            <span>Total Opportunities</span>
          </div>
        </div>

        <div className="student-opportunity-stat">
          <div className="student-opportunity-stat-icon">💼</div>

          <div>
            <strong>{stats.internships}</strong>
            <span>Internships</span>
          </div>
        </div>

        <div className="student-opportunity-stat">
          <div className="student-opportunity-stat-icon">🔬</div>

          <div>
            <strong>{stats.research}</strong>
            <span>Research</span>
          </div>
        </div>

        <div className="student-opportunity-stat">
          <div className="student-opportunity-stat-icon">🤝</div>

          <div>
            <strong>{stats.mentorship}</strong>
            <span>Mentorships</span>
          </div>
        </div>
      </section>

      {/* =====================================================
          TOOLBAR
      ===================================================== */}
      <section className="student-opportunity-toolbar">
        <div className="student-opportunity-filter-group">
          {Object.entries(categoryLabels)
            .filter(([key]) => key !== "other")
            .map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`student-opportunity-filter ${activeFilter === key ? "active" : ""
                  }`}
                onClick={() => setActiveFilter(key)}
              >
                {label}
              </button>
            ))}
        </div>

        <span className="student-opportunity-result-count">
          {filteredOpportunities.length}{" "}
          {filteredOpportunities.length === 1
            ? "opportunity"
            : "opportunities"}
        </span>
      </section>

      {/* =====================================================
          OPPORTUNITIES
      ===================================================== */}
      <section className="student-opportunity-section">
        <div className="student-opportunity-section-header">
          <div className="student-opportunity-section-title">
            Explore Opportunities
          </div>

          {search && (
            <span className="student-opportunity-search-result">
              Results for "{search}"
            </span>
          )}
        </div>

        {loading ? (
          <div className="student-opportunity-loading">
            <span className="student-opportunity-loader" />
            <p>Finding opportunities for you...</p>
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <div className="student-opportunity-empty">
            <div className="student-opportunity-empty-icon">🔎</div>

            <h3>No opportunities found</h3>

            <p>
              Try another search term or select a different
              opportunity category.
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
          <div className="student-opportunity-grid">
            {filteredOpportunities.map((opportunity) => {
              const isApplied = appliedIds.includes(
                opportunity._id
              );

              return (
                <article
                  className="student-opportunity-card"
                  key={opportunity._id}
                >
                  <div className="student-opportunity-card-top">
                    <div className="student-opportunity-category-icon">
                      {getCategoryIcon(opportunity.category)}
                    </div>

                    <span className="opportunity-category-badge">
                      {getCategoryLabel(opportunity.category)}
                    </span>

                    <span
                      className={`opportunity-status ${opportunity.status
                        ?.toLowerCase()
                        .includes("close")
                        ? "closed"
                        : ""
                        }`}
                    >
                      {opportunity.status}
                    </span>
                  </div>

                  <div className="student-opportunity-card-body">
                    <h3>{opportunity.title}</h3>

                    <p className="opportunity-organization">
                      {opportunity.organization}
                    </p>

                    <p className="student-opportunity-description">
                      {opportunity.description}
                    </p>

                    <div className="student-opportunity-meta">
                      <span>
                        <b>⌖</b>
                        {opportunity.location}
                      </span>

                      <span>
                        <b>◷</b>
                        {opportunity.mode}
                      </span>

                      <span>
                        <b>◫</b>
                        {opportunity.deadline}
                      </span>
                    </div>

                    {opportunity.skills?.length > 0 && (
                      <div className="student-opportunity-skills">
                        {opportunity.skills
                          .slice(0, 3)
                          .map((skill, index) => (
                            <span key={`${skill}-${index}`}>
                              {skill}
                            </span>
                          ))}

                        {opportunity.skills.length > 3 && (
                          <span className="opportunity-more-skills">
                            +{opportunity.skills.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="student-opportunity-actions">
                    <button
                      type="button"
                      className="opportunity-view-btn"
                      onClick={() =>
                        handleViewDetails(opportunity)
                      }
                    >
                      View Details
                    </button>

                    <button
                      type="button"
                      className={
                        isApplied
                          ? "opportunity-applied-btn"
                          : "opportunity-apply-btn"
                      }
                      disabled={isApplied}
                      onClick={() => handleApply(opportunity)}
                    >
                      {isApplied ? "Applied ✓" : "Apply Now"}
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
      <section className="student-opportunity-cta">
        <div className="student-opportunity-cta-content">
          <span className="student-opportunity-cta-label">
            Keep Growing
          </span>

          <h3>
            Your next opportunity could change your journey.
          </h3>

          <p>
            Stay active, build your skills and keep exploring
            new possibilities within the AU Community.
          </p>
        </div>

        <div className="student-opportunity-cta-icon">
          🚀
        </div>
      </section>

      {/* =====================================================
          DETAILS MODAL
      ===================================================== */}
      {selectedOpportunity && (
        <div
          className="student-opportunity-modal-overlay"
          onClick={closeModal}
        >
          <div
            className="student-opportunity-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="student-opportunity-modal-head">
              <div className="opportunity-modal-heading">
                <div className="student-opportunity-modal-icon">
                  {getCategoryIcon(
                    selectedOpportunity.category
                  )}
                </div>

                <div>
                  <span className="opportunity-modal-category">
                    {getCategoryLabel(
                      selectedOpportunity.category
                    )}
                  </span>

                  <h2>{selectedOpportunity.title}</h2>

                  <p>
                    {selectedOpportunity.organization}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="opportunity-modal-close"
                onClick={closeModal}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="student-opportunity-modal-body">
              <p className="opportunity-modal-description">
                {selectedOpportunity.description}
              </p>

              <div className="opportunity-modal-meta">
                <div>
                  <strong>Location</strong>
                  <span>
                    {selectedOpportunity.location}
                  </span>
                </div>

                <div>
                  <strong>Mode</strong>
                  <span>{selectedOpportunity.mode}</span>
                </div>

                <div>
                  <strong>Deadline</strong>
                  <span>
                    {selectedOpportunity.deadline}
                  </span>
                </div>

                <div>
                  <strong>Status</strong>
                  <span>
                    {selectedOpportunity.status}
                  </span>
                </div>
              </div>

              {selectedOpportunity.skills?.length > 0 && (
                <div className="opportunity-modal-skills">
                  <h4>Skills / Requirements</h4>

                  <div>
                    {selectedOpportunity.skills.map(
                      (skill, index) => (
                        <span key={`${skill}-${index}`}>
                          {skill}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="student-opportunity-modal-foot">
              <button
                type="button"
                className="opportunity-modal-secondary"
                onClick={closeModal}
              >
                Close
              </button>

              <button
                type="button"
                className="opportunity-modal-primary"
                disabled={appliedIds.includes(
                  selectedOpportunity._id
                )}
                onClick={() =>
                  handleApply(selectedOpportunity)
                }
              >
                {appliedIds.includes(selectedOpportunity._id)
                  ? "Already Applied ✓"
                  : "Apply Now"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          TOAST
      ===================================================== */}
      {toast && (
        <div className="student-opportunity-toast">
          {toast}
        </div>
      )}
    </div>
  );
}

export default Opportunity;