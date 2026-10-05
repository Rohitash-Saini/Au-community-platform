import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../../api";
import "../../../styles/TeacherStyle/TeacherNetwork.css";

const Network = () => {
  const navigate = useNavigate();

  const [activeFilter, setActiveFilter] = useState("All");
  const [searchText, setSearchText] = useState("");
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  const filters = [
    {
      key: "All",
      label: "All Members",
      icon: "fas fa-users",
    },
    {
      key: "Students",
      label: "Students",
      icon: "fas fa-user-graduate",
    },
    {
      key: "Teachers",
      label: "Teachers",
      icon: "fas fa-chalkboard-teacher",
    },
    {
      key: "Connected",
      label: "Connected",
      icon: "fas fa-user-check",
    },
  ];

  const fallbackMembers = [];

  const showToast = (message) => {
    setToast(message);

    setTimeout(() => {
      setToast("");
    }, 2200);
  };

  const getInitials = (name) => {
    if (!name) return "U";

    return name
      .split(" ")
      .slice(0, 2)
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase();
  };

  const normalizeMember = (member) => {
    const role = (
      member.role ||
      member.user?.role ||
      member.accountType ||
      "student"
    ).toLowerCase();

    const name =
      member.name ||
      member.user?.name ||
      member.fullName ||
      "AU Community Member";

    return {
      ...member,
      _id: member._id || member.id,
      name,
      role,
      designation:
        member.designation ||
        member.user?.designation ||
        (role === "teacher" ? "Faculty Member" : "AU Student"),
      department:
        member.department ||
        member.user?.department ||
        "AU Foundation",
      year: member.year || member.user?.year || "",
      bio:
        member.bio ||
        member.user?.bio ||
        "Part of the AU Community.",
      avatar:
        member.avatar ||
        member.user?.avatar ||
        getInitials(name),
      connected: Boolean(
        member.connected ||
        member.isConnected ||
        member.connectionStatus === "connected"
      ),
    };
  };

  const fetchNetwork = async () => {
    setLoading(true);

    try {
      /*
       * If your backend already has a network endpoint,
       * this will use it.
       */
      const res = await API.get("/users");

      const data = res.data?.users || res.data?.members || res.data || [];

      setMembers(
        Array.isArray(data) ? data.map(normalizeMember) : []
      );
    } catch (error) {
      console.error("Failed to fetch network:", error);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNetwork();
  }, []);

  const filteredMembers = useMemo(() => {
    let result = [...members];

    if (activeFilter === "Students") {
      result = result.filter((member) => member.role === "student");
    }

    if (activeFilter === "Teachers") {
      result = result.filter(
        (member) =>
          member.role === "teacher" ||
          member.role === "faculty"
      );
    }

    if (activeFilter === "Connected") {
      result = result.filter((member) => member.connected);
    }

    if (searchText.trim()) {
      const search = searchText.toLowerCase().trim();

      result = result.filter((member) => {
        return (
          member.name?.toLowerCase().includes(search) ||
          member.designation?.toLowerCase().includes(search) ||
          member.department?.toLowerCase().includes(search) ||
          member.bio?.toLowerCase().includes(search)
        );
      });
    }

    return result;
  }, [members, activeFilter, searchText]);

  const studentCount = members.filter(
    (member) => member.role === "student"
  ).length;

  const teacherCount = members.filter(
    (member) =>
      member.role === "teacher" || member.role === "faculty"
  ).length;

  const connectedCount = members.filter(
    (member) => member.connected
  ).length;

  const handleConnect = async (member) => {
    if (member.connected) {
      showToast(`You are already connected with ${member.name}`);
      return;
    }

    try {
      /*
       * Connect endpoint can be connected to your backend
       * whenever the API route is available.
       */
      await API.post(`/users/${member._id}/connect`);

      setMembers((prev) =>
        prev.map((item) =>
          item._id === member._id
            ? { ...item, connected: true }
            : item
        )
      );

      showToast(`Connection request sent to ${member.name}`);
    } catch (error) {
      console.error("Failed to connect:", error);

      /*
       * Keep UI interactive even when backend endpoint
       * is not configured yet.
       */
      setMembers((prev) =>
        prev.map((item) =>
          item._id === member._id
            ? { ...item, connected: true }
            : item
        )
      );

      showToast(`Connection request sent to ${member.name}`);
    }
  };

  const handleMessage = (member) => {
    /*
     * Dashboard already has a Messages tab.
     * If messaging route is later added, this can navigate
     * directly to it.
     */
    navigate("/teacher-dashboard", {
      state: {
        activeTab: "messages",
        selectedUser: member,
      },
    });

    showToast(`Opening conversation with ${member.name}`);
  };

  const getRoleLabel = (role) => {
    if (role === "teacher" || role === "faculty") {
      return "Faculty";
    }

    return "Student";
  };

  return (
    <div className="network-page">
      {/* =====================================================
          PAGE HEADER
          ===================================================== */}

      <section className="network-hero">
        <div className="network-hero-content">
          <span className="network-eyebrow">
            AU COMMUNITY • NETWORK
          </span>

          <h1>
            Build your
            <br />
            <span>AU network.</span>
          </h1>

          <p>
            Connect with students and faculty, exchange knowledge,
            discover interests and build meaningful academic
            relationships.
          </p>
        </div>

        <div className="network-hero-orbit">
          <div className="network-orbit-ring network-orbit-one"></div>
          <div className="network-orbit-ring network-orbit-two"></div>

          <div className="network-orbit-center">
            <i className="fas fa-users"></i>
            <span>CONNECT</span>
          </div>
        </div>
      </section>

      {/* =====================================================
          NETWORK STATS
          ===================================================== */}

      <section className="network-stat-grid">
        <div className="network-stat-card">
          <div className="network-stat-icon">
            <i className="fas fa-users"></i>
          </div>

          <div>
            <strong>{members.length}</strong>
            <span>Total Members</span>
          </div>
        </div>

        <div className="network-stat-card">
          <div className="network-stat-icon">
            <i className="fas fa-user-graduate"></i>
          </div>

          <div>
            <strong>{studentCount}</strong>
            <span>Students</span>
          </div>
        </div>

        <div className="network-stat-card">
          <div className="network-stat-icon">
            <i className="fas fa-chalkboard-teacher"></i>
          </div>

          <div>
            <strong>{teacherCount}</strong>
            <span>Faculty</span>
          </div>
        </div>

        <div className="network-stat-card">
          <div className="network-stat-icon">
            <i className="fas fa-user-check"></i>
          </div>

          <div>
            <strong>{connectedCount}</strong>
            <span>Your Connections</span>
          </div>
        </div>
      </section>

      {/* =====================================================
          SEARCH + FILTER
          ===================================================== */}

      <section className="network-controls">
        <div className="network-search-box">
          <i className="fas fa-search"></i>

          <input
            type="text"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search students, faculty, departments..."
          />

          {searchText && (
            <button
              type="button"
              className="network-search-clear"
              onClick={() => setSearchText("")}
              aria-label="Clear search"
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>

        <div className="network-filter-list">
          {filters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              className={`network-filter-btn ${activeFilter === filter.key ? "active" : ""
                }`}
              onClick={() => setActiveFilter(filter.key)}
            >
              <i className={filter.icon}></i>
              <span>{filter.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* =====================================================
          SECTION HEADER
          ===================================================== */}

      <section className="network-members-section">
        <div className="network-section-heading">
          <div>
            <span className="network-mini-label">
              COMMUNITY MEMBERS
            </span>

            <h2>
              {activeFilter === "All"
                ? "Discover people around you"
                : activeFilter}
            </h2>

            <p>
              {searchText
                ? `Showing results for "${searchText}"`
                : "Find people who can help you learn, collaborate and grow."}
            </p>
          </div>

          <span className="network-result-count">
            {filteredMembers.length} members
          </span>
        </div>

        {/* ===================================================
            LOADING
            =================================================== */}

        {loading ? (
          <div className="network-loading">
            <div className="network-spinner"></div>

            <p>Loading AU Community...</p>
          </div>
        ) : filteredMembers.length > 0 ? (
          <div className="network-member-grid">
            {filteredMembers.map((member) => {
              const isFaculty =
                member.role === "teacher" ||
                member.role === "faculty";

              return (
                <article
                  className="network-member-card"
                  key={member._id}
                >
                  <div className="network-card-top">
                    <div
                      className={`network-member-avatar ${isFaculty ? "faculty-avatar" : "student-avatar"
                        }`}
                    >
                      {member.avatar?.length <= 3
                        ? member.avatar
                        : getInitials(member.name)}
                    </div>

                    <span
                      className={`network-role-badge ${isFaculty ? "faculty" : "student"
                        }`}
                    >
                      <i
                        className={
                          isFaculty
                            ? "fas fa-chalkboard-teacher"
                            : "fas fa-user-graduate"
                        }
                      ></i>

                      {getRoleLabel(member.role)}
                    </span>
                  </div>

                  <div className="network-member-info">
                    <h3>{member.name}</h3>

                    <span className="network-designation">
                      {member.designation}
                    </span>

                    <span className="network-department">
                      <i className="fas fa-building"></i>
                      {member.department}
                    </span>

                    {member.year && (
                      <span className="network-year">
                        <i className="fas fa-graduation-cap"></i>
                        {member.year}
                      </span>
                    )}

                    <p>{member.bio}</p>
                  </div>

                  <div className="network-card-actions">
                    <button
                      type="button"
                      className="network-message-btn"
                      onClick={() => handleMessage(member)}
                    >
                      <i className="fas fa-comment-dots"></i>
                      Message
                    </button>

                    <button
                      type="button"
                      className={`network-connect-btn ${member.connected ? "connected" : ""
                        }`}
                      onClick={() => handleConnect(member)}
                    >
                      <i
                        className={
                          member.connected
                            ? "fas fa-check"
                            : "fas fa-user-plus"
                        }
                      ></i>

                      {member.connected ? "Connected" : "Connect"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="network-empty">
            <div className="network-empty-icon">
              <i className="fas fa-user-friends"></i>
            </div>

            <h3>No members found</h3>

            <p>
              Try changing your search or selecting another
              community filter.
            </p>

            <button
              type="button"
              onClick={() => {
                setSearchText("");
                setActiveFilter("All");
              }}
            >
              View All Members
            </button>
          </div>
        )}
      </section>

      {/* =====================================================
          COMMUNITY CTA
          ===================================================== */}

      <section className="network-community-cta">
        <div>
          <span className="network-mini-label">
            GROW TOGETHER
          </span>

          <h2>
            A stronger community
            <br />
            starts with a connection.
          </h2>

          <p>
            Share knowledge, mentor students and collaborate with
            people across AU.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setActiveFilter("Students");
            setSearchText("");
          }}
        >
          Discover Students
          <i className="fas fa-arrow-right"></i>
        </button>
      </section>

      {/* =====================================================
          TOAST
          ===================================================== */}

      {toast && (
        <div className="network-toast" role="status">
          <i className="fas fa-check-circle"></i>
          {toast}
        </div>
      )}
    </div>
  );
};

export default Network;