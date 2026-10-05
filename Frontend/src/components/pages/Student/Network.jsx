import React, { useEffect, useMemo, useState } from "react";
import API from "../../../api";
import "../../../styles/StudentStyle/StudentNetwork.css";

const fallbackMembers = [];

const normalizeMember = (member, index = 0) => {
  const name =
    member?.name ||
    member?.fullName ||
    member?.username ||
    "AU Community Member";

  const role =
    member?.role ||
    member?.userRole ||
    member?.accountType ||
    "student";

  const skills = Array.isArray(member?.skills)
    ? member.skills
    : typeof member?.skills === "string"
      ? member.skills
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
      : [];

  return {
    ...member,

    _id: member?._id || member?.id || `member-${index}`,

    name,

    role: String(role).toLowerCase(),

    department:
      member?.department ||
      member?.course ||
      member?.program ||
      "AU Community",

    batch:
      member?.batch ||
      member?.batchNumber ||
      member?.year ||
      "",

    designation:
      member?.designation ||
      "",

    bio:
      member?.bio ||
      member?.about ||
      "AU Community member",

    skills,

    location:
      member?.location ||
      member?.city ||
      "",

    avatar:
      member?.avatar ||
      name
        .split(" ")
        .slice(0, 2)
        .map((word) => word.charAt(0))
        .join("")
        .toUpperCase(),

    connected:
      Boolean(
        member?.connected ||
        member?.isConnected ||
        member?.connectionStatus === "connected"
      ),
  };
};

const Network = () => {
  const [members, setMembers] = useState([]);

  const [activeFilter, setActiveFilter] = useState("all");

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [toast, setToast] = useState("");

  const [selectedMember, setSelectedMember] = useState(null);

  const [showDetails, setShowDetails] = useState(false);

  const [connectingId, setConnectingId] = useState(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);

      const response = await API.get("/users");

      const data =
        response?.data?.users ||
        response?.data?.members ||
        response?.data ||
        [];

      setMembers(
        Array.isArray(data) ? data.map(normalizeMember) : []
      );
    } catch (error) {
      console.log("Failed to fetch network members:", error);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message) => {
    setToast(message);

    setTimeout(() => {
      setToast("");
    }, 2400);
  };

  const handleConnect = async (member) => {
    if (!member?._id || connectingId) return;

    try {
      setConnectingId(member._id);

      try {
        await API.post(`/users/${member._id}/connect`);
      } catch (error) {
        console.log(
          "Connection API unavailable, updating UI locally."
        );
      }

      setMembers((prev) =>
        prev.map((item) =>
          item._id === member._id
            ? {
              ...item,
              connected: true,
            }
            : item
        )
      );

      showToast(`Connection request sent to ${member.name}`);
    } finally {
      setConnectingId(null);
    }
  };

  const handleDisconnect = async (member) => {
    if (!member?._id || connectingId) return;

    try {
      setConnectingId(member._id);

      try {
        await API.post(`/users/${member._id}/disconnect`);
      } catch (error) {
        console.log(
          "Disconnect API unavailable, updating UI locally."
        );
      }

      setMembers((prev) =>
        prev.map((item) =>
          item._id === member._id
            ? {
              ...item,
              connected: false,
            }
            : item
        )
      );

      showToast(`Removed ${member.name} from your network`);
    } finally {
      setConnectingId(null);
    }
  };

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return members.filter((member) => {
      const matchesSearch =
        !query ||
        member.name.toLowerCase().includes(query) ||
        member.department.toLowerCase().includes(query) ||
        member.role.toLowerCase().includes(query) ||
        member.skills.some((skill) =>
          String(skill).toLowerCase().includes(query)
        );

      let matchesFilter = true;

      if (activeFilter === "students") {
        matchesFilter = member.role === "student";
      }

      if (activeFilter === "teachers") {
        matchesFilter =
          member.role === "teacher" ||
          member.role === "faculty";
      }

      if (activeFilter === "connected") {
        matchesFilter = member.connected;
      }

      return matchesSearch && matchesFilter;
    });
  }, [members, search, activeFilter]);

  const totalMembers = members.length;

  const studentCount = members.filter(
    (member) => member.role === "student"
  ).length;

  const teacherCount = members.filter(
    (member) =>
      member.role === "teacher" ||
      member.role === "faculty"
  ).length;

  const connectedCount = members.filter(
    (member) => member.connected
  ).length;

  const getRoleLabel = (role) => {
    if (role === "teacher" || role === "faculty") {
      return "Faculty";
    }

    return "Student";
  };

  const openDetails = (member) => {
    setSelectedMember(member);
    setShowDetails(true);
  };

  const closeDetails = () => {
    setShowDetails(false);
    setSelectedMember(null);
  };

  return (
    <div className="student-network-page">

      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="student-network-hero">

        <div className="student-network-hero-content">

          <span className="student-network-eyebrow">
            <i className="fas fa-users"></i>
            AU Community Network
          </span>

          <h1>
            Meet your
            <span> community.</span>
          </h1>

          <p>
            Discover students, faculty members and talented
            people across the AU Community. Connect, collaborate
            and grow together.
          </p>

          <div className="student-network-search">

            <i className="fas fa-search"></i>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search people, departments or skills..."
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <i className="fas fa-times"></i>
              </button>
            )}

          </div>

        </div>


        <div className="student-network-hero-art">

          <div className="network-orbit network-orbit-one"></div>

          <div className="network-orbit network-orbit-two"></div>

          <div className="network-orbit network-orbit-three"></div>

          <div className="network-center-icon">
            <i className="fas fa-user-friends"></i>

            <span>{totalMembers}</span>
          </div>

          <span className="network-floating-icon network-float-one">
            <i className="fas fa-user"></i>
          </span>

          <span className="network-floating-icon network-float-two">
            <i className="fas fa-graduation-cap"></i>
          </span>

          <span className="network-floating-icon network-float-three">
            <i className="fas fa-lightbulb"></i>
          </span>

        </div>

      </section>


      {/* =====================================================
          STATS
      ====================================================== */}

      <section className="student-network-stats">

        <div className="student-network-stat">

          <div className="student-network-stat-icon">
            <i className="fas fa-users"></i>
          </div>

          <div>
            <strong>{totalMembers}</strong>
            <span>Community Members</span>
          </div>

        </div>


        <div className="student-network-stat">

          <div className="student-network-stat-icon">
            <i className="fas fa-user-graduate"></i>
          </div>

          <div>
            <strong>{studentCount}</strong>
            <span>Students</span>
          </div>

        </div>


        <div className="student-network-stat">

          <div className="student-network-stat-icon">
            <i className="fas fa-chalkboard-teacher"></i>
          </div>

          <div>
            <strong>{teacherCount}</strong>
            <span>Faculty</span>
          </div>

        </div>


        <div className="student-network-stat">

          <div className="student-network-stat-icon">
            <i className="fas fa-user-check"></i>
          </div>

          <div>
            <strong>{connectedCount}</strong>
            <span>Your Connections</span>
          </div>

        </div>

      </section>


      {/* =====================================================
          FILTERS
      ====================================================== */}

      <section className="student-network-toolbar">

        <div className="student-network-filter-group">

          <button
            type="button"
            className={
              activeFilter === "all"
                ? "student-network-filter active"
                : "student-network-filter"
            }
            onClick={() => setActiveFilter("all")}
          >
            <i className="fas fa-border-all"></i>
            All
          </button>


          <button
            type="button"
            className={
              activeFilter === "students"
                ? "student-network-filter active"
                : "student-network-filter"
            }
            onClick={() => setActiveFilter("students")}
          >
            <i className="fas fa-user-graduate"></i>
            Students
          </button>


          <button
            type="button"
            className={
              activeFilter === "teachers"
                ? "student-network-filter active"
                : "student-network-filter"
            }
            onClick={() => setActiveFilter("teachers")}
          >
            <i className="fas fa-chalkboard-teacher"></i>
            Faculty
          </button>


          <button
            type="button"
            className={
              activeFilter === "connected"
                ? "student-network-filter active"
                : "student-network-filter"
            }
            onClick={() => setActiveFilter("connected")}
          >
            <i className="fas fa-user-check"></i>
            Connected
          </button>

        </div>


        <span className="student-network-result-count">
          {filteredMembers.length}{" "}
          {filteredMembers.length === 1
            ? "member"
            : "members"}
        </span>

      </section>


      {/* =====================================================
          MEMBERS
      ====================================================== */}

      <section className="student-network-section">

        <div className="student-network-section-header">

          <div>
            <span className="student-network-section-label">
              Discover
            </span>

            <h2>People you can connect with</h2>

            <p>
              Build meaningful connections across the
              AU Community.
            </p>
          </div>

        </div>


        {loading ? (
          <div className="student-network-loading">

            <div className="student-network-loader"></div>

            <h3>Finding community members...</h3>

            <p>
              Please wait while we load the network.
            </p>

          </div>
        ) : filteredMembers.length > 0 ? (

          <div className="student-network-grid">

            {filteredMembers.map((member) => (

              <article
                className="student-network-card"
                key={member._id}
              >

                <div className="student-network-card-cover">

                  <span
                    className={
                      member.role === "teacher" ||
                        member.role === "faculty"
                        ? "network-role-badge faculty"
                        : "network-role-badge"
                    }
                  >
                    {getRoleLabel(member.role)}
                  </span>

                </div>


                <div className="student-network-card-body">

                  <div className="student-network-avatar-wrap">

                    <span
                      className={
                        member.role === "teacher" ||
                          member.role === "faculty"
                          ? "student-network-avatar faculty"
                          : "student-network-avatar"
                      }
                    >
                      {member.avatar}
                    </span>

                    {member.connected && (
                      <span className="network-connected-dot">
                        <i className="fas fa-check"></i>
                      </span>
                    )}

                  </div>


                  <div className="student-network-person">

                    <h3>{member.name}</h3>

                    {member.designation && (
                      <span className="network-designation">
                        {member.designation}
                      </span>
                    )}

                    <span className="network-department">
                      {member.department}
                    </span>

                    {member.batch && (
                      <span className="network-batch">
                        <i className="fas fa-layer-group"></i>
                        Batch {member.batch}
                      </span>
                    )}

                  </div>


                  <p className="student-network-bio">
                    {member.bio}
                  </p>


                  {member.skills?.length > 0 && (
                    <div className="student-network-skills">

                      {member.skills
                        .slice(0, 3)
                        .map((skill, index) => (
                          <span key={`${skill}-${index}`}>
                            {typeof skill === "string"
                              ? skill
                              : skill?.name || "Skill"}
                          </span>
                        ))}

                      {member.skills.length > 3 && (
                        <span className="network-more-skills">
                          +{member.skills.length - 3}
                        </span>
                      )}

                    </div>
                  )}


                  {member.location && (
                    <div className="student-network-location">

                      <i className="fas fa-map-marker-alt"></i>

                      <span>{member.location}</span>

                    </div>
                  )}


                  <div className="student-network-actions">

                    <button
                      type="button"
                      className="network-view-btn"
                      onClick={() => openDetails(member)}
                    >
                      <i className="fas fa-eye"></i>
                      View
                    </button>


                    {member.connected ? (
                      <button
                        type="button"
                        className="network-connected-btn"
                        onClick={() =>
                          handleDisconnect(member)
                        }
                        disabled={
                          connectingId === member._id
                        }
                      >
                        <i className="fas fa-check"></i>
                        Connected
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="network-connect-btn"
                        onClick={() =>
                          handleConnect(member)
                        }
                        disabled={
                          connectingId === member._id
                        }
                      >
                        {connectingId === member._id ? (
                          <>
                            <span className="network-button-loader"></span>
                            Sending...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-user-plus"></i>
                            Connect
                          </>
                        )}
                      </button>
                    )}

                  </div>

                </div>

              </article>

            ))}

          </div>

        ) : (

          <div className="student-network-empty">

            <div className="student-network-empty-icon">
              <i className="fas fa-user-friends"></i>
            </div>

            <h3>No members found</h3>

            <p>
              We couldn't find anyone matching your
              current search or filter.
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setActiveFilter("all");
              }}
            >
              <i className="fas fa-redo"></i>
              Reset Search
            </button>

          </div>

        )}

      </section>


      {/* =====================================================
          CTA
      ====================================================== */}

      <section className="student-network-cta">

        <div className="student-network-cta-content">

          <span className="student-network-cta-label">
            Build Together
          </span>

          <h2>
            Your next great collaboration
            <span> could start here.</span>
          </h2>

          <p>
            Connect with students and faculty who share
            your interests, skills and ambitions.
          </p>

        </div>


        <div className="student-network-cta-icon">
          <i className="fas fa-handshake"></i>
        </div>

      </section>


      {/* =====================================================
          DETAILS MODAL
      ====================================================== */}

      {showDetails && selectedMember && (

        <div
          className="student-network-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target.classList.contains(
                "student-network-modal-overlay"
              )
            ) {
              closeDetails();
            }
          }}
        >

          <div className="student-network-modal">

            <div className="student-network-modal-head">

              <div>
                <span className="student-network-section-label">
                  Community Member
                </span>

                <h2>Profile Details</h2>
              </div>

              <button
                type="button"
                onClick={closeDetails}
                aria-label="Close"
              >
                <i className="fas fa-times"></i>
              </button>

            </div>


            <div className="student-network-modal-body">

              <div className="network-modal-profile">

                <span
                  className={
                    selectedMember.role === "teacher" ||
                      selectedMember.role === "faculty"
                      ? "student-network-modal-avatar faculty"
                      : "student-network-modal-avatar"
                  }
                >
                  {selectedMember.avatar}
                </span>

                <div>
                  <h3>{selectedMember.name}</h3>

                  <span>
                    {getRoleLabel(selectedMember.role)}
                  </span>

                  <strong>
                    {selectedMember.department}
                  </strong>
                </div>

              </div>


              <div className="network-modal-info-grid">

                <div>
                  <small>Department</small>
                  <strong>
                    {selectedMember.department}
                  </strong>
                </div>

                <div>
                  <small>Location</small>
                  <strong>
                    {selectedMember.location || "Not added"}
                  </strong>
                </div>

                {selectedMember.batch && (
                  <div>
                    <small>Batch</small>
                    <strong>
                      {selectedMember.batch}
                    </strong>
                  </div>
                )}

                {selectedMember.designation && (
                  <div>
                    <small>Designation</small>
                    <strong>
                      {selectedMember.designation}
                    </strong>
                  </div>
                )}

              </div>


              <div className="network-modal-about">

                <span>About</span>

                <p>
                  {selectedMember.bio ||
                    "No introduction has been added yet."}
                </p>

              </div>


              {selectedMember.skills?.length > 0 && (

                <div className="network-modal-skills">

                  <span>Skills & Interests</span>

                  <div>

                    {selectedMember.skills.map(
                      (skill, index) => (
                        <span key={`${skill}-${index}`}>
                          {typeof skill === "string"
                            ? skill
                            : skill?.name || "Skill"}
                        </span>
                      )
                    )}

                  </div>

                </div>

              )}

            </div>


            <div className="student-network-modal-foot">

              <button
                type="button"
                className="network-modal-close"
                onClick={closeDetails}
              >
                Close
              </button>


              {selectedMember.connected ? (

                <button
                  type="button"
                  className="network-modal-connected"
                  onClick={() => {
                    handleDisconnect(selectedMember);
                    closeDetails();
                  }}
                >
                  <i className="fas fa-check"></i>
                  Connected
                </button>

              ) : (

                <button
                  type="button"
                  className="network-modal-connect"
                  onClick={() => {
                    handleConnect(selectedMember);
                    closeDetails();
                  }}
                >
                  <i className="fas fa-user-plus"></i>
                  Connect
                </button>

              )}

            </div>

          </div>

        </div>

      )}


      {/* =====================================================
          TOAST
      ====================================================== */}

      {toast && (

        <div className="student-network-toast">

          <i className="fas fa-check-circle"></i>

          <span>{toast}</span>

        </div>

      )}

    </div>
  );
};

export default Network;