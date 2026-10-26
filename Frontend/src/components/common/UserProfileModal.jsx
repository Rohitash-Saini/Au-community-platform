import React, { useState, useEffect } from "react";
import API from "../../api";

const UserProfileModal = ({ user: initialUser, userId, onClose }) => {
  const [profile, setProfile] = useState(initialUser || null);
  const [loading, setLoading] = useState(!initialUser && Boolean(userId));

  useEffect(() => {
    const targetId = userId || initialUser?._id || initialUser?.id;
    if (targetId) {
      fetchFullProfile(targetId);
    }
  }, [userId, initialUser]);

  const fetchFullProfile = async (id) => {
    try {
      setLoading(true);
      const res = await API.get(`/users/${id}`);
      if (res.data?.user) {
        setProfile((prev) => ({ ...prev, ...res.data.user }));
      }
    } catch (err) {
      console.error("Failed to fetch user profile details:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!initialUser && !userId && !profile) return null;

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .slice(0, 2)
      .map((w) => w.charAt(0))
      .join("")
      .toUpperCase();
  };

  const name = profile?.name || "AU Community Member";
  const role = (profile?.role || "student").toLowerCase();
  const roleLabel = role === "teacher" || role === "faculty" ? "Faculty Member" : "Student";
  const bio = profile?.bio || "No bio added yet.";
  const skills = Array.isArray(profile?.skills)
    ? profile.skills
    : typeof profile?.skills === "string"
      ? profile.skills.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(6px)",
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        animation: "fadeIn 0.2s ease-out"
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "520px",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.3)",
          position: "relative",
          animation: "slideUp 0.25s ease-out"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Cover Banner */}
        <div
          style={{
            height: "120px",
            background: role === "teacher"
              ? "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)"
              : "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
            borderTopLeftRadius: "20px",
            borderTopRightRadius: "20px",
            position: "relative"
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              position: "absolute",
              top: "14px",
              right: "14px",
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              color: "#ffffff",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              transition: "all 0.2s"
            }}
          >
            &times;
          </button>
        </div>

        {/* Profile Details Container */}
        <div style={{ padding: "0 24px 28px", marginTop: "-50px" }}>
          {/* Avatar & Title Row */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: "16px", marginBottom: "16px" }}>
            {profile?.profilePicture ? (
              <img
                src={profile.profilePicture}
                alt={name}
                style={{
                  width: "90px",
                  height: "90px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "4px solid #ffffff",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  backgroundColor: "#ffffff"
                }}
              />
            ) : (
              <div
                style={{
                  width: "90px",
                  height: "90px",
                  borderRadius: "50%",
                  backgroundColor: role === "teacher" ? "#4f46e5" : "#f97316",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "32px",
                  fontWeight: "700",
                  border: "4px solid #ffffff",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                }}
              >
                {getInitials(name)}
              </div>
            )}

            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "700", color: "#0f172a" }}>{name}</h2>
              <span
                style={{
                  display: "inline-block",
                  marginTop: "4px",
                  padding: "3px 10px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: "600",
                  backgroundColor: role === "teacher" ? "#e0e7ff" : "#ffedd5",
                  color: role === "teacher" ? "#3730a3" : "#9a3412"
                }}
              >
                {roleLabel}
              </span>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: "30px 0", textAlign: "center", color: "#64748b" }}>
              Loading user profile details...
            </div>
          ) : (
            <>
              {/* Basic Info Badges */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
                {profile?.email && (
                  <div style={{ fontSize: "13px", color: "#475569", display: "flex", alignItems: "center", gap: "6px" }}>
                    <i className="fas fa-envelope" style={{ color: "#64748b" }}></i>
                    {profile.email}
                  </div>
                )}
                {profile?.batchNumber && (
                  <div style={{ fontSize: "13px", color: "#475569", display: "flex", alignItems: "center", gap: "6px" }}>
                    <i className="fas fa-layer-group" style={{ color: "#64748b" }}></i>
                    Batch {profile.batchNumber}
                  </div>
                )}
                {profile?.jobStatus && profile.jobStatus !== "Not Looking" && (
                  <div style={{ fontSize: "13px", color: "#16a34a", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                    <i className="fas fa-briefcase" style={{ color: "#16a34a" }}></i>
                    {profile.jobStatus}
                  </div>
                )}
              </div>

              <hr style={{ border: "none", borderTop: "1px solid #f1f5f9", margin: "16px 0" }} />

              {/* Bio Section */}
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: "700", color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  About & Bio
                </h4>
                <p style={{ margin: 0, fontSize: "14px", color: "#475569", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                  {bio}
                </p>
              </div>

              {/* Skills Section */}
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", fontWeight: "700", color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Skills & Expertise ({skills.length})
                </h4>
                {skills.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {skills.map((skill, index) => (
                      <span
                        key={index}
                        style={{
                          padding: "6px 14px",
                          borderRadius: "20px",
                          backgroundColor: "#f1f5f9",
                          color: "#1e293b",
                          fontSize: "13px",
                          fontWeight: "600",
                          border: "1px solid #e2e8f0"
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: "13px", color: "#94a3b8" }}>No skills listed yet.</span>
                )}
              </div>

              {/* Social Links & Resume */}
              {(profile?.linkedin || profile?.github || profile?.instagram || profile?.resume) && (
                <div style={{ marginBottom: "16px" }}>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", fontWeight: "700", color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Social & Links
                  </h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    {profile?.linkedin && (
                      <a
                        href={profile.linkedin.startsWith("http") ? profile.linkedin : `https://${profile.linkedin}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "8px 14px",
                          borderRadius: "8px",
                          backgroundColor: "#0077b5",
                          color: "#ffffff",
                          fontSize: "13px",
                          fontWeight: "600",
                          textDecoration: "none"
                        }}
                      >
                        <i className="fab fa-linkedin"></i> LinkedIn
                      </a>
                    )}
                    {profile?.github && (
                      <a
                        href={profile.github.startsWith("http") ? profile.github : `https://${profile.github}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "8px 14px",
                          borderRadius: "8px",
                          backgroundColor: "#181717",
                          color: "#ffffff",
                          fontSize: "13px",
                          fontWeight: "600",
                          textDecoration: "none"
                        }}
                      >
                        <i className="fab fa-github"></i> GitHub
                      </a>
                    )}
                    {profile?.instagram && (
                      <a
                        href={profile.instagram.startsWith("http") ? profile.instagram : `https://${profile.instagram}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "8px 14px",
                          borderRadius: "8px",
                          backgroundColor: "#e1306c",
                          color: "#ffffff",
                          fontSize: "13px",
                          fontWeight: "600",
                          textDecoration: "none"
                        }}
                      >
                        <i className="fab fa-instagram"></i> Instagram
                      </a>
                    )}
                    {profile?.resume && (
                      <a
                        href={profile.resume}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "8px 14px",
                          borderRadius: "8px",
                          backgroundColor: "#0284c7",
                          color: "#ffffff",
                          fontSize: "13px",
                          fontWeight: "600",
                          textDecoration: "none"
                        }}
                      >
                        <i className="fas fa-file-pdf"></i> Resume
                      </a>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Close Button Footer */}
          <div style={{ marginTop: "24px", textAlign: "right" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "10px 24px",
                borderRadius: "10px",
                backgroundColor: "#f1f5f9",
                color: "#334155",
                border: "none",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
