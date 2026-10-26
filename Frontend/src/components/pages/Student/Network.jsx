import React, { useEffect, useMemo, useState } from "react";
import API from "../../../api";
import UserProfileModal from "../../common/UserProfileModal";
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

      const [usersRes, statusRes] = await Promise.allSettled([
        API.get("/users"),
        API.get("/connections/statuses"),
      ]);

      const data =
        usersRes.status === "fulfilled"
          ? usersRes.value?.data?.users || usersRes.value?.data || []
          : [];

      const connections =
        statusRes.status === "fulfilled"
          ? statusRes.value?.data?.connections || []
          : [];

      const connectionMap = {};
      connections.forEach((conn) => {
        const senderId = conn.sender?._id || conn.sender;
        const receiverId = conn.receiver?._id || conn.receiver;
        if (senderId) {
          connectionMap[senderId] = { status: conn.status, isSender: true, id: conn._id };
        }
        if (receiverId) {
          connectionMap[receiverId] = { status: conn.status, isSender: false, id: conn._id };
        }
      });

      const normalized = Array.isArray(data)
        ? data
          .filter((item) => (item?.role || item?.userRole || "").toLowerCase() !== "admin")
          .map((item, index) => {
            const memberObj = normalizeMember(item, index);
            const conn = connectionMap[memberObj._id];
            if (conn) {
              if (conn.status === "accepted") {
                memberObj.connectionState = "connected";
                memberObj.connected = true;
              } else if (conn.status === "pending") {
                memberObj.connectionState = conn.isSender ? "pending" : "incoming";
                memberObj.connected = false;
              } else {
                memberObj.connectionState = "none";
                memberObj.connected = false;
              }
              memberObj.connectionId = conn.id;
            } else {
              memberObj.connectionState = "none";
              memberObj.connected = false;
            }
            return memberObj;
          })
        : [];

      setMembers(normalized);
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
      const res = await API.post(`/connections/${member._id}`);
      const connectionId = res.data?.connection?._id;

      setMembers((prev) =>
        prev.map((item) =>
          item._id === member._id
            ? {
              ...item,
              connectionState: "pending",
              connectionId,
              connected: false,
            }
            : item
        )
      );

      showToast(`Connection request sent to ${member.name}`);
    } catch (error) {
      console.error("Connection request error:", error);
      showToast(error.response?.data?.message || "Could not send connection request");
    } finally {
      setConnectingId(null);
    }
  };

  const handleDisconnect = async (member) => {
    if (!member?._id || connectingId) return;

    try {
      setConnectingId(member._id);

      if (member.connectionId) {
        await API.delete(`/connections/${member.connectionId}`);
      }

      setMembers((prev) =>
        prev.map((item) =>
          item._id === member._id
            ? {
              ...item,
              connectionState: "none",
              connectionId: null,
              connected: false,
            }
            : item
        )
      );

      showToast(`Removed ${member.name} from your network`);
    } catch (error) {
      console.error("Disconnect error:", error);
      showToast("Could not disconnect");
    } finally {
      setConnectingId(null);
    }
  };

  const handleCancelConnection = async (member) => {
    if (!member?._id || connectingId) return;

    try {
      setConnectingId(member._id);

      if (member.connectionId) {
        await API.delete(`/connections/${member.connectionId}/cancel`);
      } else {
        const statusRes = await API.get("/connections/statuses");
        const connections = statusRes.data?.connections || [];
        const match = connections.find(
          (c) =>
            (c.receiver?._id === member._id || c.receiver === member._id || c.sender?._id === member._id || c.sender === member._id) &&
            c.status === "pending"
        );
        if (match) {
          await API.delete(`/connections/${match._id}/cancel`);
        }
      }

      setMembers((prev) =>
        prev.map((item) =>
          item._id === member._id
            ? {
              ...item,
              connectionState: "none",
              connectionId: null,
              connected: false,
            }
            : item
        )
      );

      showToast(`Cancelled connection request to ${member.name}`);
    } catch (error) {
      console.error("Cancel request error:", error);
      setMembers((prev) =>
        prev.map((item) =>
          item._id === member._id
            ? {
              ...item,
              connectionState: "none",
              connectionId: null,
              connected: false,
            }
            : item
        )
      );
      showToast(`Cancelled connection request to ${member.name}`);
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

                  <div className="student-network-avatar-wrap" style={{ cursor: "pointer" }} onClick={() => openDetails(member)}>

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

                    <h3 style={{ cursor: "pointer" }} onClick={() => openDetails(member)}>{member.name}</h3>

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
                      style={{
                        backgroundColor: "#f8fafc",
                        color: "#1e293b",
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        padding: "8px 16px",
                        fontWeight: "700",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px"
                      }}
                    >
                      <i className="fas fa-eye"></i>
                      View
                    </button>


                  {member.connectionState === "connected" || member.connected ? (
                    <button
                      type="button"
                      className="network-connected-btn"
                      onClick={() =>
                        handleDisconnect(member)
                      }
                      disabled={
                        connectingId === member._id
                      }
                      style={{
                        backgroundColor: "#dcfce7",
                        color: "#15803d",
                        border: "1px solid #bbf7d0",
                        borderRadius: "8px",
                        padding: "8px 16px",
                        fontWeight: "700",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px"
                      }}
                    >
                  <i className="fas fa-check"></i>
                  Connected
                </button>
                ) : member.connectionState === "pending" ? (
                <button
                  type="button"
                  className="network-pending-btn"
                  onClick={() =>
                    handleCancelConnection(member)
                  }
                  disabled={
                    connectingId === member._id
                  }
                  style={{
                    backgroundColor: "#f59e0b",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    fontWeight: "700",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    boxShadow: "0 4px 10px rgba(245, 158, 11, 0.25)"
                  }}
                  title="Click to cancel connection request"
                >
                <i className="fas fa-clock"></i>
                Pending
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
              style={{
                backgroundColor: "#ea580c",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "8px 16px",
                fontWeight: "700",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                boxShadow: "0 4px 12px rgba(234, 88, 12, 0.3)"
              }}
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

                </div >

              </article >

            ))}

          </div >

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

      </section >


{/* =====================================================
          CTA
      ====================================================== */}

  < section className = "student-network-cta" >

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

      </section >


{/* =====================================================
          DETAILS MODAL
      ====================================================== */}

{
  showDetails && selectedMember && (
    <UserProfileModal
      user={selectedMember}
      userId={selectedMember._id}
      onClose={closeDetails}
    />
  )
}


{/* =====================================================
          TOAST
      ====================================================== */}

{
  toast && (

    <div className="student-network-toast">

      <i className="fas fa-check-circle"></i>

      <span>{toast}</span>

    </div>

  )
}

    </div >
  );
};

export default Network;