import React, { useEffect, useState } from "react";
import API from "../../../api";
import "../../../styles/StudentStyle/StudentProfile.css";

const fallbackProfile = {
  name: "Student",
  email: "student@aufoundation.org",
  role: "Student",
  avatar: "",
  banner: "",
  bio: "AU Community Student & Tech Enthusiast",
  batchNumber: "2024-B",
  department: "Computer Science & Engineering",
  course: "Bachelor of Technology",
  designation: "Student",
  location: "Ajmer, Rajasthan",
  phone: "",
  skills: ["Full Stack Web Development", "React", "Node.js"],
  interests: ["Technology", "Innovation", "Community"],
  education: [
    {
      degree: "Bachelor of Technology",
      institution: "AU Foundation",
      year: "2024 - Present",
    },
  ],
};

const normalizeProfile = (user = {}, student = {}) => {
  const merged = {
    ...user,
    ...student,
  };

  const rawSkills =
    merged.skills ||
    merged.skillSet ||
    merged.technicalSkills ||
    [];

  const skills = Array.isArray(rawSkills)
    ? rawSkills
      .map((skill) =>
        typeof skill === "string"
          ? skill
          : skill?.name || skill?.title || ""
      )
      .filter(Boolean)
    : typeof rawSkills === "string"
      ? rawSkills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean)
      : [];

  const rawInterests =
    merged.interests ||
    merged.hobbies ||
    [];

  const interests = Array.isArray(rawInterests)
    ? rawInterests
      .map((item) =>
        typeof item === "string"
          ? item
          : item?.name || item?.title || ""
      )
      .filter(Boolean)
    : typeof rawInterests === "string"
      ? rawInterests
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
      : [];

  const education = Array.isArray(merged.education)
    ? merged.education
    : fallbackProfile.education;

  return {
    name:
      merged.name ||
      merged.fullName ||
      `${merged.firstName || ""} ${merged.lastName || ""}`.trim() ||
      fallbackProfile.name,

    email: merged.email || fallbackProfile.email,

    role:
      merged.role ||
      merged.userRole ||
      fallbackProfile.role,

    avatar:
      merged.avatar ||
      merged.profileImage ||
      merged.profilePicture ||
      merged.profilePhoto ||
      "",

    banner:
      merged.banner ||
      merged.bannerImage ||
      merged.coverImage ||
      merged.coverPhoto ||
      merged.profileBanner ||
      "",

    bio:
      merged.bio ||
      merged.about ||
      merged.description ||
      fallbackProfile.bio,

    batchNumber:
      merged.batchNumber ||
      merged.batch ||
      merged.batchNo ||
      fallbackProfile.batchNumber,

    department:
      merged.department ||
      merged.branch ||
      merged.specialization ||
      fallbackProfile.department,

    course:
      merged.course ||
      merged.program ||
      merged.degree ||
      fallbackProfile.course,

    designation:
      merged.designation ||
      merged.title ||
      fallbackProfile.designation,

    location:
      merged.location ||
      merged.city ||
      merged.address ||
      fallbackProfile.location,

    phone:
      merged.phone ||
      merged.mobile ||
      merged.phoneNumber ||
      "",

    skills:
      skills.length > 0
        ? skills
        : fallbackProfile.skills,

    interests:
      interests.length > 0
        ? interests
        : fallbackProfile.interests,

    education,
  };
};

const Profile = ({
  currentUser,
  setCurrentUser,
}) => {
  const [profile, setProfile] = useState(
    normalizeProfile(currentUser || {})
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEditModal, setShowEditModal] =
    useState(false);
  const [toast, setToast] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    batchNumber: "",
    department: "",
    course: "",
    designation: "",
    location: "",
    phone: "",
    skills: "",
    interests: "",
    avatar: "",
    banner: "",
  });

  /* =====================================================
     FETCH PROFILE
     ===================================================== */

  useEffect(() => {
    fetchProfile();
  }, []);

  /* =====================================================
     TOAST
     ===================================================== */

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast("");
    }, 2800);

    return () => clearTimeout(timer);
  }, [toast]);

  /* =====================================================
     GET PROFILE
     ===================================================== */

  const fetchProfile = async () => {
    setLoading(true);

    try {
      const userResponse =
        await API.get("/users/profile");

      const userData =
        userResponse?.data?.user ||
        userResponse?.data?.data ||
        userResponse?.data ||
        {};

      let studentData = {};

      const userId =
        userData?._id ||
        userData?.id ||
        currentUser?._id ||
        currentUser?.id;

      if (userId) {
        try {
          const studentResponse =
            await API.get(`/students/${userId}`);

          studentData =
            studentResponse?.data?.student ||
            studentResponse?.data?.data ||
            studentResponse?.data ||
            {};
        } catch (studentError) {
          console.warn(
            "Student profile endpoint unavailable:",
            studentError
          );
        }
      }

      const normalized = normalizeProfile(
        userData,
        studentData
      );

      setProfile(normalized);

      if (setCurrentUser) {
        setCurrentUser((prev) => ({
          ...prev,
          ...userData,
          ...studentData,
          name: normalized.name,
          email: normalized.email,
          avatar: normalized.avatar,
          banner: normalized.banner,
          bio: normalized.bio,
          batchNumber: normalized.batchNumber,
          department: normalized.department,
          course: normalized.course,
          skills: normalized.skills,
        }));
      }
    } catch (error) {
      console.error(
        "Failed to fetch student profile:",
        error
      );

      setProfile(
        normalizeProfile(
          currentUser || fallbackProfile
        )
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     INITIALS
     ===================================================== */

  const getInitials = (name = "Student") => {
    const parts = name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (parts.length === 0) {
      return "S";
    }

    if (parts.length === 1) {
      return parts[0]
        .slice(0, 2)
        .toUpperCase();
    }

    return `${parts[0][0]}${parts[parts.length - 1][0]
      }`.toUpperCase();
  };

  /* =====================================================
     IMAGE CHECK
     ===================================================== */

  const isImage = (value) => {
    if (!value || typeof value !== "string") {
      return false;
    }

    return (
      value.startsWith("http://") ||
      value.startsWith("https://") ||
      value.startsWith("data:image") ||
      value.startsWith("/")
    );
  };

  /* =====================================================
     EDIT MODAL
     ===================================================== */

  const openEditModal = () => {
    setFormData({
      name: profile.name || "",
      bio: profile.bio || "",
      batchNumber: profile.batchNumber || "",
      department: profile.department || "",
      course: profile.course || "",
      designation: profile.designation || "",
      location: profile.location || "",
      phone: profile.phone || "",
      skills: (profile.skills || []).join(", "),
      interests: (profile.interests || []).join(", "),
      avatar: profile.avatar || "",
      banner: profile.banner || "",
    });

    setShowEditModal(true);
  };

  /* =====================================================
     INPUT CHANGE
     ===================================================== */

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* =====================================================
     SAVE PROFILE
     ===================================================== */

  const saveProfile = async (event) => {
    event.preventDefault();

    setSaving(true);

    const updatedProfile = {
      ...profile,

      name:
        formData.name.trim() ||
        profile.name,

      bio: formData.bio.trim(),

      batchNumber:
        formData.batchNumber.trim(),

      department:
        formData.department.trim(),

      course:
        formData.course.trim(),

      designation:
        formData.designation.trim(),

      location:
        formData.location.trim(),

      phone:
        formData.phone.trim(),

      avatar:
        formData.avatar.trim(),

      banner:
        formData.banner.trim(),

      skills: formData.skills
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),

      interests: formData.interests
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    };

    try {
      await API.put(
        "/users/profile",
        updatedProfile
      );
    } catch (putError) {
      try {
        await API.patch(
          "/users/profile",
          updatedProfile
        );
      } catch (patchError) {
        console.warn(
          "Profile update endpoint unavailable:",
          patchError
        );
      }
    }

    setProfile(updatedProfile);

    if (setCurrentUser) {
      setCurrentUser((prev) => ({
        ...prev,
        ...updatedProfile,
      }));
    }

    try {
      const storedUser = JSON.parse(
        localStorage.getItem("au_user") || "{}"
      );

      localStorage.setItem(
        "au_user",
        JSON.stringify({
          ...storedUser,
          ...updatedProfile,
        })
      );
    } catch (storageError) {
      console.warn(
        "Unable to update local profile:",
        storageError
      );
    }

    setSaving(false);
    setShowEditModal(false);

    setToast(
      "Profile updated successfully."
    );
  };

  /* =====================================================
     LOADING
     ===================================================== */

  if (loading) {
    return (
      <div className="student-profile-page">
        <div className="student-profile-loading">
          <div className="student-profile-loader" />
          <span>
            Loading profile...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="student-profile-page">

      {/* =================================================
          PROFILE HERO / BANNER
          ================================================= */}

      <section className="student-profile-hero">

        <div
          className="student-profile-banner"
          style={
            isImage(profile.banner)
              ? {
                backgroundImage: `url("${profile.banner}")`,
              }
              : undefined
          }
        >
          {!isImage(profile.banner) && (
            <div className="student-profile-banner-pattern">
              <span />
              <span />
              <span />
            </div>
          )}
        </div>

        <div className="student-profile-hero-content">

          {/* AVATAR */}

          <div className="student-profile-hero-avatar">
            {isImage(profile.avatar) ? (
              <img
                src={profile.avatar}
                alt={profile.name}
              />
            ) : (
              getInitials(profile.name)
            )}
          </div>

          {/* PROFILE INFO */}

          <div className="student-profile-hero-info">

            <div className="student-profile-eyebrow">
              AU Community Profile
            </div>

            <h1>
              {profile.name}
            </h1>

            <p>
              {profile.designation ||
                "Student"}

              {profile.department
                ? ` • ${profile.department}`
                : ""}
            </p>

            <div className="student-profile-hero-meta">

              <span>
                <i className="fas fa-envelope" />
                {profile.email}
              </span>

              {profile.location && (
                <span>
                  <i className="fas fa-map-marker-alt" />
                  {profile.location}
                </span>
              )}

              {profile.batchNumber && (
                <span>
                  <i className="fas fa-layer-group" />
                  Batch {profile.batchNumber}
                </span>
              )}

            </div>

          </div>

          {/* EDIT */}

          <button
            type="button"
            className="student-profile-edit-btn"
            onClick={openEditModal}
          >
            <i className="fas fa-pen" />
            Edit Profile
          </button>

        </div>
      </section>

      {/* =================================================
          MAIN
          ================================================= */}

      <main className="student-profile-main">

        {/* =================================================
            SIDEBAR
            ================================================= */}

        <aside className="student-profile-sidebar">

          {/* QUICK PROFILE */}

          <div className="student-profile-card student-profile-quick-card">

            <div className="student-profile-mini-avatar">

              {isImage(profile.avatar) ? (
                <img
                  src={profile.avatar}
                  alt={profile.name}
                />
              ) : (
                getInitials(profile.name)
              )}

            </div>

            <h3>
              {profile.name}
            </h3>

            <span className="student-profile-role">
              {profile.role}
            </span>

            <p>
              {profile.bio}
            </p>

            <button
              type="button"
              className="student-profile-side-edit"
              onClick={openEditModal}
            >
              <i className="fas fa-user-edit" />
              Update Profile
            </button>

          </div>

          {/* OVERVIEW */}

          <div className="student-profile-card student-profile-links-card">

            <div className="student-profile-card-label">
              Profile Overview
            </div>

            <div className="student-profile-side-item">

              <div className="student-profile-side-icon">
                <i className="fas fa-graduation-cap" />
              </div>

              <div>
                <span>
                  Course
                </span>

                <strong>
                  {profile.course ||
                    "Not added"}
                </strong>
              </div>

            </div>

            <div className="student-profile-side-item">

              <div className="student-profile-side-icon">
                <i className="fas fa-building" />
              </div>

              <div>
                <span>
                  Department
                </span>

                <strong>
                  {profile.department ||
                    "Not added"}
                </strong>
              </div>

            </div>

            <div className="student-profile-side-item">

              <div className="student-profile-side-icon">
                <i className="fas fa-users" />
              </div>

              <div>
                <span>
                  Batch
                </span>

                <strong>
                  {profile.batchNumber ||
                    "Not added"}
                </strong>
              </div>

            </div>

            <div className="student-profile-side-item">

              <div className="student-profile-side-icon">
                <i className="fas fa-map-marker-alt" />
              </div>

              <div>
                <span>
                  Location
                </span>

                <strong>
                  {profile.location ||
                    "Not added"}
                </strong>
              </div>

            </div>

          </div>

        </aside>

        {/* =================================================
            CONTENT
            ================================================= */}

        <section className="student-profile-content">

          {/* ABOUT */}

          <div className="student-profile-card">

            <div className="student-profile-card-header">

              <div>
                <div className="student-profile-section-label">
                  Introduction
                </div>

                <h2>
                  About Me
                </h2>
              </div>

              <div className="student-profile-header-icon">
                <i className="fas fa-user" />
              </div>

            </div>

            <p className="student-profile-about">
              {profile.bio ||
                "Add a short introduction about yourself, your interests and your journey."}
            </p>

          </div>

          {/* STUDENT INFORMATION */}

          <div className="student-profile-card">

            <div className="student-profile-card-header">

              <div>
                <div className="student-profile-section-label">
                  Academic Details
                </div>

                <h2>
                  Student Information
                </h2>
              </div>

              <div className="student-profile-header-icon">
                <i className="fas fa-id-card" />
              </div>

            </div>

            <div className="student-profile-info-grid">

              <div className="student-profile-info-item">

                <span>
                  <i className="fas fa-graduation-cap" />
                  Course
                </span>

                <strong>
                  {profile.course ||
                    "Not added"}
                </strong>

              </div>

              <div className="student-profile-info-item">

                <span>
                  <i className="fas fa-building" />
                  Department
                </span>

                <strong>
                  {profile.department ||
                    "Not added"}
                </strong>

              </div>

              <div className="student-profile-info-item">

                <span>
                  <i className="fas fa-layer-group" />
                  Batch
                </span>

                <strong>
                  {profile.batchNumber ||
                    "Not added"}
                </strong>

              </div>

              <div className="student-profile-info-item">

                <span>
                  <i className="fas fa-user-tag" />
                  Role
                </span>

                <strong>
                  {profile.role ||
                    "Student"}
                </strong>

              </div>

            </div>

          </div>

          {/* SKILLS */}

          <div className="student-profile-card">

            <div className="student-profile-card-header">

              <div>
                <div className="student-profile-section-label">
                  Expertise
                </div>

                <h2>
                  Skills & Technologies
                </h2>
              </div>

              <div className="student-profile-header-icon">
                <i className="fas fa-code" />
              </div>

            </div>

            <div className="student-profile-tags">

              {profile.skills?.length > 0 ? (
                profile.skills.map(
                  (skill, index) => (
                    <span
                      className="student-profile-tag"
                      key={`${skill}-${index}`}
                    >
                      {skill}
                    </span>
                  )
                )
              ) : (
                <span className="student-profile-muted">
                  No skills added yet.
                </span>
              )}

            </div>

          </div>

          {/* INTERESTS */}

          <div className="student-profile-card">

            <div className="student-profile-card-header">

              <div>
                <div className="student-profile-section-label">
                  Personal Interests
                </div>

                <h2>
                  Interests
                </h2>
              </div>

              <div className="student-profile-header-icon">
                <i className="fas fa-heart" />
              </div>

            </div>

            <div className="student-profile-tags">

              {profile.interests?.length > 0 ? (
                profile.interests.map(
                  (interest, index) => (
                    <span
                      className="student-profile-interest-tag"
                      key={`${interest}-${index}`}
                    >
                      <i className="fas fa-star" />
                      {interest}
                    </span>
                  )
                )
              ) : (
                <span className="student-profile-muted">
                  No interests added yet.
                </span>
              )}

            </div>

          </div>

          {/* EDUCATION */}

          <div className="student-profile-card">

            <div className="student-profile-card-header">

              <div>
                <div className="student-profile-section-label">
                  Academic Journey
                </div>

                <h2>
                  Education
                </h2>
              </div>

              <div className="student-profile-header-icon">
                <i className="fas fa-university" />
              </div>

            </div>

            <div className="student-profile-education-list">

              {(profile.education || []).map(
                (education, index) => (
                  <div
                    className="student-profile-education-item"
                    key={index}
                  >

                    <div className="student-profile-education-icon">
                      <i className="fas fa-graduation-cap" />
                    </div>

                    <div>

                      <h3>
                        {education.degree ||
                          education.course ||
                          "Academic Program"}
                      </h3>

                      <p>
                        {education.institution ||
                          education.college ||
                          "AU Foundation"}
                      </p>

                      <span>
                        {education.year ||
                          education.duration ||
                          "Present"}
                      </span>

                    </div>

                  </div>
                )
              )}

            </div>

          </div>

          {/* CONTACT */}

          <div className="student-profile-card">

            <div className="student-profile-card-header">

              <div>
                <div className="student-profile-section-label">
                  Get In Touch
                </div>

                <h2>
                  Contact Information
                </h2>
              </div>

              <div className="student-profile-header-icon">
                <i className="fas fa-address-card" />
              </div>

            </div>

            <div className="student-profile-contact-grid">

              <div className="student-profile-contact-item">

                <div className="student-profile-contact-icon">
                  <i className="fas fa-envelope" />
                </div>

                <div>
                  <span>
                    Email
                  </span>

                  <strong>
                    {profile.email}
                  </strong>
                </div>

              </div>

              <div className="student-profile-contact-item">

                <div className="student-profile-contact-icon">
                  <i className="fas fa-phone" />
                </div>

                <div>
                  <span>
                    Phone
                  </span>

                  <strong>
                    {profile.phone ||
                      "Not added"}
                  </strong>
                </div>

              </div>

              <div className="student-profile-contact-item">

                <div className="student-profile-contact-icon">
                  <i className="fas fa-map-marker-alt" />
                </div>

                <div>
                  <span>
                    Location
                  </span>

                  <strong>
                    {profile.location ||
                      "Not added"}
                  </strong>
                </div>

              </div>

            </div>

          </div>

        </section>

      </main>

      {/* =================================================
          EDIT PROFILE MODAL
          ================================================= */}

      {showEditModal && (
        <div
          className="student-profile-modal-overlay"
          onClick={() =>
            setShowEditModal(false)
          }
        >

          <div
            className="student-profile-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="student-profile-modal-head">

              <div>
                <div className="student-profile-section-label">
                  Profile Settings
                </div>

                <h2>
                  Edit Profile
                </h2>
              </div>

              <button
                type="button"
                className="student-profile-modal-close"
                onClick={() =>
                  setShowEditModal(false)
                }
              >
                <i className="fas fa-times" />
              </button>

            </div>

            <form
              className="student-profile-form"
              onSubmit={saveProfile}
            >

              <div className="student-profile-form-grid">

                {/* NAME */}

                <div className="student-profile-form-group full">

                  <label htmlFor="student-profile-name">
                    Full Name
                  </label>

                  <input
                    id="student-profile-name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                  />

                </div>

                {/* AVATAR */}

                <div className="student-profile-form-group full">

                  <label htmlFor="student-profile-avatar">
                    Avatar Image URL
                  </label>

                  <input
                    id="student-profile-avatar"
                    name="avatar"
                    value={formData.avatar}
                    onChange={handleInputChange}
                    placeholder="https://example.com/avatar.jpg"
                  />

                  <small>
                    Add a direct image URL for your profile picture.
                  </small>

                </div>

                {/* BANNER */}

                <div className="student-profile-form-group full">

                  <label htmlFor="student-profile-banner">
                    Banner Image URL
                  </label>

                  <input
                    id="student-profile-banner"
                    name="banner"
                    value={formData.banner}
                    onChange={handleInputChange}
                    placeholder="https://example.com/banner.jpg"
                  />

                  <small>
                    Recommended: wide landscape image for your profile banner.
                  </small>

                </div>

                {/* BIO */}

                <div className="student-profile-form-group full">

                  <label htmlFor="student-profile-bio">
                    About
                  </label>

                  <textarea
                    id="student-profile-bio"
                    name="bio"
                    rows="4"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Tell the community about yourself..."
                  />

                </div>

                {/* COURSE */}

                <div className="student-profile-form-group">

                  <label htmlFor="student-profile-course">
                    Course
                  </label>

                  <input
                    id="student-profile-course"
                    name="course"
                    value={formData.course}
                    onChange={handleInputChange}
                    placeholder="e.g. B.Tech"
                  />

                </div>

                {/* DEPARTMENT */}

                <div className="student-profile-form-group">

                  <label htmlFor="student-profile-department">
                    Department
                  </label>

                  <input
                    id="student-profile-department"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    placeholder="e.g. Computer Science"
                  />

                </div>

                {/* DESIGNATION */}

                <div className="student-profile-form-group">

                  <label htmlFor="student-profile-designation">
                    Designation
                  </label>

                  <input
                    id="student-profile-designation"
                    name="designation"
                    value={formData.designation}
                    onChange={handleInputChange}
                    placeholder="e.g. Student"
                  />

                </div>

                {/* BATCH */}

                <div className="student-profile-form-group">

                  <label htmlFor="student-profile-batch">
                    Batch
                  </label>

                  <input
                    id="student-profile-batch"
                    name="batchNumber"
                    value={formData.batchNumber}
                    onChange={handleInputChange}
                    placeholder="e.g. 2024-B"
                  />

                </div>

                {/* LOCATION */}

                <div className="student-profile-form-group">

                  <label htmlFor="student-profile-location">
                    Location
                  </label>

                  <input
                    id="student-profile-location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="City, State"
                  />

                </div>

                {/* PHONE */}

                <div className="student-profile-form-group">

                  <label htmlFor="student-profile-phone">
                    Phone
                  </label>

                  <input
                    id="student-profile-phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Phone number"
                  />

                </div>

                {/* SKILLS */}

                <div className="student-profile-form-group full">

                  <label htmlFor="student-profile-skills">
                    Skills
                  </label>

                  <input
                    id="student-profile-skills"
                    name="skills"
                    value={formData.skills}
                    onChange={handleInputChange}
                    placeholder="React, Node.js, Python"
                  />

                  <small>
                    Separate multiple skills with commas.
                  </small>

                </div>

                {/* INTERESTS */}

                <div className="student-profile-form-group full">

                  <label htmlFor="student-profile-interests">
                    Interests
                  </label>

                  <input
                    id="student-profile-interests"
                    name="interests"
                    value={formData.interests}
                    onChange={handleInputChange}
                    placeholder="Technology, Design, Startups"
                  />

                  <small>
                    Separate multiple interests with commas.
                  </small>

                </div>

              </div>

              {/* MODAL FOOTER */}

              <div className="student-profile-modal-foot">

                <button
                  type="button"
                  className="student-profile-cancel-btn"
                  onClick={() =>
                    setShowEditModal(false)
                  }
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="student-profile-save-btn"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="student-profile-button-loader" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save" />
                      Save Changes
                    </>
                  )}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* =================================================
          TOAST
          ================================================= */}

      {toast && (
        <div className="student-profile-toast">
          <i className="fas fa-check-circle" />
          {toast}
        </div>
      )}

    </div>
  );
};

export default Profile;