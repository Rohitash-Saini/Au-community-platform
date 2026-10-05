// src/pages/Teacher/Profile.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../../api";
import "../../../styles/TeacherStyle/TeacherProfile.css";

const fallbackProfile = {
  name: "Faculty Member",
  email: "faculty@aufoundation.org",
  role: "Teacher",
  avatar: "T",
  designation: "Assistant Professor",
  department: "Computer Science & Engineering",
  institution: "AU Foundation",
  bio: "Senior Faculty & Guide at AU Foundation",
  expertise: "Computer Science & Engineering",
  experience: "8+ Years",
  location: "Jaipur, Rajasthan",
  phone: "",
  website: "",
  joined: "2024",
  skills: [
    "Computer Science",
    "Research",
    "Mentorship",
    "Academic Development",
  ],
  education: [
    {
      degree: "Master's / Ph.D.",
      institution: "AU Foundation",
      year: "2018 - Present",
    },
  ],
};

const Profile = () => {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(fallbackProfile);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const [formData, setFormData] = useState(fallbackProfile);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);

      const response = await API.get("/users/profile");

      const user = response?.data?.user || response?.data || {};

      let teacherData = {};

      if (user?._id) {
        try {
          const teacherResponse = await API.get(
            `/teachers/${user._id}`
          );

          teacherData =
            teacherResponse?.data?.teacher ||
            teacherResponse?.data ||
            {};
        } catch (teacherError) {
          console.log("Teacher profile not available:", teacherError);
        }
      }

      const storedUser = JSON.parse(
        localStorage.getItem("au_user") || "{}"
      );

      const mergedProfile = {
        ...fallbackProfile,
        ...storedUser,
        ...user,
        ...teacherData,

        name:
          teacherData.name ||
          user.name ||
          storedUser.name ||
          fallbackProfile.name,

        email:
          teacherData.email ||
          user.email ||
          storedUser.email ||
          fallbackProfile.email,

        avatar:
          teacherData.avatar ||
          user.avatar ||
          storedUser.avatar ||
          fallbackProfile.avatar,

        designation:
          teacherData.designation ||
          user.designation ||
          fallbackProfile.designation,

        department:
          teacherData.department ||
          teacherData.expertise ||
          user.department ||
          user.expertise ||
          fallbackProfile.department,

        bio:
          teacherData.bio ||
          user.bio ||
          fallbackProfile.bio,

        expertise:
          teacherData.expertise ||
          user.expertise ||
          fallbackProfile.expertise,

        experience:
          teacherData.experience ||
          user.experience ||
          fallbackProfile.experience,

        location:
          teacherData.location ||
          user.location ||
          fallbackProfile.location,

        phone:
          teacherData.phone ||
          user.phone ||
          fallbackProfile.phone,

        website:
          teacherData.website ||
          user.website ||
          fallbackProfile.website,

        joined:
          teacherData.joined ||
          user.joined ||
          fallbackProfile.joined,

        skills:
          teacherData.skills ||
          user.skills ||
          fallbackProfile.skills,

        education:
          teacherData.education ||
          user.education ||
          fallbackProfile.education,
      };

      setProfile(mergedProfile);
      setFormData(mergedProfile);
    } catch (error) {
      console.log("Profile fetch failed:", error);

      const storedUser = JSON.parse(
        localStorage.getItem("au_user") || "{}"
      );

      if (Object.keys(storedUser).length > 0) {
        const merged = {
          ...fallbackProfile,
          ...storedUser,
        };

        setProfile(merged);
        setFormData(merged);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      const payload = {
        name: formData.name,
        designation: formData.designation,
        department: formData.department,
        bio: formData.bio,
        expertise: formData.expertise,
        experience: formData.experience,
        location: formData.location,
        phone: formData.phone,
        website: formData.website,
      };

      let updatedProfile = {
        ...profile,
        ...formData,
      };

      try {
        const response = await API.put(
          "/users/profile",
          payload
        );

        const serverUser =
          response?.data?.user ||
          response?.data?.profile ||
          response?.data;

        if (serverUser && typeof serverUser === "object") {
          updatedProfile = {
            ...updatedProfile,
            ...serverUser,
          };
        }
      } catch (userError) {
        console.log(
          "User profile update endpoint failed:",
          userError
        );

        try {
          const response = await API.patch(
            "/users/profile",
            payload
          );

          const serverUser =
            response?.data?.user ||
            response?.data?.profile ||
            response?.data;

          if (serverUser && typeof serverUser === "object") {
            updatedProfile = {
              ...updatedProfile,
              ...serverUser,
            };
          }
        } catch (patchError) {
          console.log(
            "Profile PATCH endpoint failed:",
            patchError
          );
        }
      }

      setProfile(updatedProfile);
      setFormData(updatedProfile);

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

      setEditing(false);
      showToast("Profile updated successfully.");
    } catch (error) {
      console.error("Profile update failed:", error);
      showToast("Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const showToast = (message) => {
    setToast(message);

    setTimeout(() => {
      setToast("");
    }, 2800);
  };

  const getInitials = (name = "") => {
    const parts = name.trim().split(" ");

    if (parts.length === 1) {
      return parts[0]?.charAt(0)?.toUpperCase() || "T";
    }

    return (
      parts[0]?.charAt(0) +
      parts[parts.length - 1]?.charAt(0)
    ).toUpperCase();
  };

  const getAvatar = () => {
    if (!profile.avatar) {
      return getInitials(profile.name);
    }

    if (
      profile.avatar.startsWith("data:image") ||
      profile.avatar.startsWith("http") ||
      profile.avatar.startsWith("/")
    ) {
      return profile.avatar;
    }

    return null;
  };

  const avatar = getAvatar();

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          <div className="profile-loader"></div>

          <h3>Loading profile...</h3>

          <p>Please wait while we load your faculty profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="profile-hero">
        <div className="profile-hero-content">
          <span className="profile-eyebrow">
            <i className="fas fa-user-circle"></i>
            Faculty Profile
          </span>

          <h1>
            Your professional
            <span> identity.</span>
          </h1>

          <p>
            Manage your academic information, expertise,
            experience and professional details from one place.
          </p>
        </div>

        <div className="profile-hero-art">
          <div className="profile-art-ring profile-art-ring-one"></div>

          <div className="profile-art-ring profile-art-ring-two"></div>

          <div className="profile-art-center">
            <i className="fas fa-user-tie"></i>
          </div>
        </div>
      </section>


      {/* =====================================================
          PROFILE BODY
      ====================================================== */}

      <div className="profile-container">

        {/* ===================================================
            LEFT PROFILE CARD
        ==================================================== */}

        <aside className="profile-sidebar">
          <div className="profile-card">

            <div className="profile-avatar-wrapper">
              {avatar ? (
                <img
                  src={avatar}
                  alt={profile.name}
                  className="profile-avatar-image"
                />
              ) : (
                <div className="profile-avatar">
                  {getInitials(profile.name)}
                </div>
              )}

              <span className="profile-online-dot"></span>
            </div>

            <h2>{profile.name}</h2>

            <p className="profile-role">
              {profile.designation}
            </p>

            <p className="profile-department">
              {profile.department}
            </p>

            <div className="profile-role-badge">
              <i className="fas fa-chalkboard-teacher"></i>
              Faculty
            </div>


            <div className="profile-card-divider"></div>


            <div className="profile-mini-info">

              <div className="profile-mini-row">
                <span className="profile-mini-icon">
                  <i className="fas fa-map-marker-alt"></i>
                </span>

                <div>
                  <small>Location</small>
                  <strong>
                    {profile.location || "Not added"}
                  </strong>
                </div>
              </div>


              <div className="profile-mini-row">
                <span className="profile-mini-icon">
                  <i className="fas fa-briefcase"></i>
                </span>

                <div>
                  <small>Experience</small>
                  <strong>
                    {profile.experience || "Not added"}
                  </strong>
                </div>
              </div>


              <div className="profile-mini-row">
                <span className="profile-mini-icon">
                  <i className="fas fa-calendar-alt"></i>
                </span>

                <div>
                  <small>Joined</small>
                  <strong>
                    {profile.joined || "AU Foundation"}
                  </strong>
                </div>
              </div>

            </div>


            <button
              className="profile-sidebar-btn"
              onClick={() => setEditing(true)}
            >
              <i className="fas fa-pen"></i>
              Edit Profile
            </button>

          </div>


          {/* Quick links */}

          <div className="profile-quick-card">

            <div className="profile-quick-heading">
              <span>Quick Access</span>
            </div>

            <button
              onClick={() =>
                navigate("/teacher-dashboard", {
                  state: { activeTab: "network" },
                })
              }
            >
              <span>
                <i className="fas fa-users"></i>
                Network
              </span>

              <i className="fas fa-chevron-right"></i>
            </button>


            <button
              onClick={() =>
                navigate("/teacher-dashboard", {
                  state: { activeTab: "opportunity" },
                })
              }
            >
              <span>
                <i className="fas fa-lightbulb"></i>
                Opportunities
              </span>

              <i className="fas fa-chevron-right"></i>
            </button>


            <button
              onClick={() =>
                navigate("/teacher-dashboard", {
                  state: { activeTab: "events" },
                })
              }
            >
              <span>
                <i className="fas fa-calendar"></i>
                Events
              </span>

              <i className="fas fa-chevron-right"></i>
            </button>


            <button
              onClick={() =>
                navigate("/teacher-dashboard", {
                  state: { activeTab: "notifications" },
                })
              }
            >
              <span>
                <i className="fas fa-bell"></i>
                Notifications
              </span>

              <i className="fas fa-chevron-right"></i>
            </button>

          </div>
        </aside>


        {/* ===================================================
            MAIN PROFILE
        ==================================================== */}

        <main className="profile-main">

          {/* About */}

          <section className="profile-section-card">

            <div className="profile-section-header">
              <div>
                <span className="profile-section-label">
                  Introduction
                </span>

                <h2>About Me</h2>
              </div>

              <button
                className="profile-edit-icon"
                onClick={() => setEditing(true)}
                aria-label="Edit profile"
              >
                <i className="fas fa-pen"></i>
              </button>
            </div>


            <p className="profile-about-text">
              {profile.bio ||
                "Add a short professional introduction about yourself."}
            </p>

          </section>


          {/* Professional Information */}

          <section className="profile-section-card">

            <div className="profile-section-header">
              <div>
                <span className="profile-section-label">
                  Professional
                </span>

                <h2>Professional Information</h2>
              </div>
            </div>


            <div className="profile-info-grid">

              <div className="profile-info-item">
                <span className="profile-info-icon">
                  <i className="fas fa-user-tie"></i>
                </span>

                <div>
                  <small>Designation</small>

                  <strong>
                    {profile.designation || "Not added"}
                  </strong>
                </div>
              </div>


              <div className="profile-info-item">
                <span className="profile-info-icon">
                  <i className="fas fa-building"></i>
                </span>

                <div>
                  <small>Department</small>

                  <strong>
                    {profile.department || "Not added"}
                  </strong>
                </div>
              </div>


              <div className="profile-info-item">
                <span className="profile-info-icon">
                  <i className="fas fa-laptop-code"></i>
                </span>

                <div>
                  <small>Expertise</small>

                  <strong>
                    {profile.expertise || "Not added"}
                  </strong>
                </div>
              </div>


              <div className="profile-info-item">
                <span className="profile-info-icon">
                  <i className="fas fa-clock"></i>
                </span>

                <div>
                  <small>Experience</small>

                  <strong>
                    {profile.experience || "Not added"}
                  </strong>
                </div>
              </div>

            </div>

          </section>


          {/* Skills */}

          <section className="profile-section-card">

            <div className="profile-section-header">
              <div>
                <span className="profile-section-label">
                  Expertise
                </span>

                <h2>Skills & Interests</h2>
              </div>
            </div>


            <div className="profile-skills">

              {Array.isArray(profile.skills) &&
                profile.skills.length > 0 ? (
                profile.skills.map((skill, index) => (
                  <span
                    className="profile-skill-tag"
                    key={`${skill}-${index}`}
                  >
                    <i className="fas fa-check"></i>
                    {typeof skill === "string"
                      ? skill
                      : skill?.name || "Skill"}
                  </span>
                ))
              ) : (
                <span className="profile-no-data">
                  No skills added yet.
                </span>
              )}

            </div>

          </section>


          {/* Education */}

          <section className="profile-section-card">

            <div className="profile-section-header">
              <div>
                <span className="profile-section-label">
                  Academic Background
                </span>

                <h2>Education</h2>
              </div>
            </div>


            <div className="profile-education-list">

              {Array.isArray(profile.education) &&
                profile.education.length > 0 ? (
                profile.education.map((education, index) => (
                  <div
                    className="profile-education-item"
                    key={index}
                  >

                    <div className="profile-education-icon">
                      <i className="fas fa-graduation-cap"></i>
                    </div>

                    <div className="profile-education-content">

                      <h3>
                        {education.degree ||
                          education.title ||
                          "Academic Qualification"}
                      </h3>

                      <p>
                        {education.institution ||
                          education.school ||
                          "Institution not added"}
                      </p>

                      <span>
                        {education.year ||
                          education.duration ||
                          ""}
                      </span>

                    </div>

                  </div>
                ))
              ) : (
                <div className="profile-no-data">
                  No education details added yet.
                </div>
              )}

            </div>

          </section>


          {/* Contact */}

          <section className="profile-section-card">

            <div className="profile-section-header">
              <div>
                <span className="profile-section-label">
                  Contact
                </span>

                <h2>Contact Information</h2>
              </div>
            </div>


            <div className="profile-contact-grid">

              <div className="profile-contact-item">

                <div className="profile-contact-icon">
                  <i className="fas fa-envelope"></i>
                </div>

                <div>
                  <small>Email</small>

                  <strong>
                    {profile.email || "Not added"}
                  </strong>
                </div>

              </div>


              <div className="profile-contact-item">

                <div className="profile-contact-icon">
                  <i className="fas fa-phone"></i>
                </div>

                <div>
                  <small>Phone</small>

                  <strong>
                    {profile.phone || "Not added"}
                  </strong>
                </div>

              </div>


              <div className="profile-contact-item">

                <div className="profile-contact-icon">
                  <i className="fas fa-map-marker-alt"></i>
                </div>

                <div>
                  <small>Location</small>

                  <strong>
                    {profile.location || "Not added"}
                  </strong>
                </div>

              </div>


              <div className="profile-contact-item">

                <div className="profile-contact-icon">
                  <i className="fas fa-globe"></i>
                </div>

                <div>
                  <small>Website</small>

                  <strong>
                    {profile.website || "Not added"}
                  </strong>
                </div>

              </div>

            </div>

          </section>

        </main>

      </div>


      {/* =====================================================
          EDIT PROFILE MODAL
      ====================================================== */}

      {editing && (
        <div
          className="profile-modal-overlay"
          onMouseDown={(e) => {
            if (
              e.target.classList.contains(
                "profile-modal-overlay"
              )
            ) {
              setEditing(false);
            }
          }}
        >

          <div className="profile-modal">

            <div className="profile-modal-header">

              <div>
                <span className="profile-section-label">
                  Account Settings
                </span>

                <h2>Edit Profile</h2>

                <p>
                  Update your professional information.
                </p>
              </div>

              <button
                className="profile-modal-close"
                onClick={() => setEditing(false)}
                aria-label="Close"
              >
                <i className="fas fa-times"></i>
              </button>

            </div>


            <form
              className="profile-edit-form"
              onSubmit={handleSave}
            >

              <div className="profile-form-grid">

                <div className="profile-form-group">
                  <label>
                    Full Name
                  </label>

                  <div className="profile-input-wrapper">
                    <i className="fas fa-user"></i>

                    <input
                      type="text"
                      name="name"
                      value={formData.name || ""}
                      onChange={handleChange}
                      placeholder="Enter your name"
                    />
                  </div>
                </div>


                <div className="profile-form-group">
                  <label>
                    Email
                  </label>

                  <div className="profile-input-wrapper">
                    <i className="fas fa-envelope"></i>

                    <input
                      type="email"
                      name="email"
                      value={formData.email || ""}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      disabled
                    />
                  </div>
                </div>


                <div className="profile-form-group">
                  <label>
                    Designation
                  </label>

                  <div className="profile-input-wrapper">
                    <i className="fas fa-user-tie"></i>

                    <input
                      type="text"
                      name="designation"
                      value={formData.designation || ""}
                      onChange={handleChange}
                      placeholder="Assistant Professor"
                    />
                  </div>
                </div>


                <div className="profile-form-group">
                  <label>
                    Department
                  </label>

                  <div className="profile-input-wrapper">
                    <i className="fas fa-building"></i>

                    <input
                      type="text"
                      name="department"
                      value={formData.department || ""}
                      onChange={handleChange}
                      placeholder="Computer Science"
                    />
                  </div>
                </div>


                <div className="profile-form-group">
                  <label>
                    Expertise
                  </label>

                  <div className="profile-input-wrapper">
                    <i className="fas fa-laptop-code"></i>

                    <input
                      type="text"
                      name="expertise"
                      value={formData.expertise || ""}
                      onChange={handleChange}
                      placeholder="Your area of expertise"
                    />
                  </div>
                </div>


                <div className="profile-form-group">
                  <label>
                    Experience
                  </label>

                  <div className="profile-input-wrapper">
                    <i className="fas fa-clock"></i>

                    <input
                      type="text"
                      name="experience"
                      value={formData.experience || ""}
                      onChange={handleChange}
                      placeholder="8+ Years"
                    />
                  </div>
                </div>


                <div className="profile-form-group">
                  <label>
                    Location
                  </label>

                  <div className="profile-input-wrapper">
                    <i className="fas fa-map-marker-alt"></i>

                    <input
                      type="text"
                      name="location"
                      value={formData.location || ""}
                      onChange={handleChange}
                      placeholder="Jaipur, Rajasthan"
                    />
                  </div>
                </div>


                <div className="profile-form-group">
                  <label>
                    Phone
                  </label>

                  <div className="profile-input-wrapper">
                    <i className="fas fa-phone"></i>

                    <input
                      type="text"
                      name="phone"
                      value={formData.phone || ""}
                      onChange={handleChange}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>


                <div className="profile-form-group profile-form-full">
                  <label>
                    Website
                  </label>

                  <div className="profile-input-wrapper">
                    <i className="fas fa-globe"></i>

                    <input
                      type="text"
                      name="website"
                      value={formData.website || ""}
                      onChange={handleChange}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                </div>


                <div className="profile-form-group profile-form-full">
                  <label>
                    Professional Bio
                  </label>

                  <div className="profile-textarea-wrapper">
                    <i className="fas fa-align-left"></i>

                    <textarea
                      name="bio"
                      value={formData.bio || ""}
                      onChange={handleChange}
                      placeholder="Tell the community about yourself..."
                      rows="5"
                    />
                  </div>
                </div>

              </div>


              <div className="profile-form-footer">

                <button
                  type="button"
                  className="profile-cancel-btn"
                  onClick={() => setEditing(false)}
                  disabled={saving}
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="profile-save-btn"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="profile-button-loader"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check"></i>
                      Save Changes
                    </>
                  )}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}


      {/* =====================================================
          TOAST
      ====================================================== */}

      {toast && (
        <div className="profile-toast">
          <i className="fas fa-check-circle"></i>

          <span>{toast}</span>
        </div>
      )}

    </div>
  );
};

export default Profile;