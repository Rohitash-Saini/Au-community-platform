import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api";
import EventsPage from "../pages/Student/Events";
import OpportunitiesPage from "../pages/Student/Opportunities";
import NetworkPage from "../pages/Student/Network";
import NotificationsPage from "../pages/Student/Notifications";
import StudentProfile from "../pages/Student/StudentProfile";
import StudentMessages from "../pages/Student/Messages";
import "../../styles/StudentStyle/StudentDashboard.css";

const NAV_ITEMS = [
  { key: "home", label: "Home", icon: "fas fa-home" },
  { key: "network", label: "Network", icon: "fas fa-user-friends" },
  { key: "opportunity", label: "Opportunities", icon: "fas fa-briefcase" },
  { key: "messages", label: "Messages", icon: "fas fa-comment-dots" },
  { key: "events", label: "Events", icon: "fas fa-calendar-alt" },
  { key: "notifications", label: "Notifications", icon: "fas fa-bell" },
];

const getInitials = (name) =>
  name ? name.substring(0, 2).toUpperCase() : "S";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const profileMenuRef = useRef(null);

  const [currentUser, setCurrentUser] = useState({
    name: "Student",
    email: "",
    role: "Student",
    avatar: "S",
    bio: "AU Community Student & Tech Enthusiast",
    batchNumber: "",
    skills: [],
  });

  const [activeTab, setActiveTab] = useState("home");
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [postCategory, setPostCategory] = useState("General");
  const [postMedia, setPostMedia] = useState("");
  const [isVideo, setIsVideo] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [commentOpenId, setCommentOpenId] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [toast, setToast] = useState("");

  /* ---------- helpers ---------- */

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 2200);
  };

  const goTo = (tab) => {
    setActiveTab(tab);
    setShowProfileMenu(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ---------- fetch data ---------- */

  const fetchPosts = async () => {
    try {
      const res = await API.get("/posts");
      const postData = res.data?.posts || res.data || [];
      const sorted = [...postData].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setPosts(sorted);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const res = await API.get("/users/profile");
      if (!res.data?.user) return;

      const user = res.data.user;
      setCurrentUser((prev) => ({
        ...prev,
        ...user,
        avatar: getInitials(user.name),
      }));

    } catch (err) {
      console.error("Failed to fetch student profile:", err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await API.get("/announcements");
      const list = res.data?.announcements || res.data || [];
      setNotifications(Array.isArray(list) ? list.slice(0, 5) : []);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    fetchUserProfile();
    fetchPosts();
    fetchNotifications();

    const savedUser = localStorage.getItem("au_user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setCurrentUser((prev) => ({
          ...prev,
          ...parsed,
          avatar: getInitials(parsed.name),
        }));
      } catch (err) {
        console.error("Error parsing user data:", err);
      }
    }
  }, []);

  // close avatar dropdown on outside click
  useEffect(() => {
    const handleOutside = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  /* ---------- post actions ---------- */

  const handleMediaUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const videoFile = file.type.startsWith("video/");

    reader.onloadend = () => {
      setPostMedia(reader.result);
      setIsVideo(videoFile);
    };
    reader.readAsDataURL(file);
  };

  const closePostModal = () => {
    setShowPostModal(false);
    setNewPostContent("");
    setPostMedia("");
    setIsVideo(false);
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || isPosting) return;

    setIsPosting(true);
    try {
      await API.post("/posts", {
        content: newPostContent.trim(),
        category: postCategory,
        image: postMedia,
      });
      closePostModal();
      await fetchPosts();
      showToast("Post published");
    } catch (err) {
      console.error("Failed to create post:", err);
      showToast("Could not publish. Please try again.");
    } finally {
      setIsPosting(false);
    }
  };

  const handleLikePost = async (postId) => {
    if (!postId) return;
    try {
      await API.post(`/posts/${postId}/like`);
      await fetchPosts();
    } catch (err) {
      console.error("Failed to like post:", err);
    }
  };

  const handleComment = async (postId) => {
    if (!commentText.trim()) return;
    try {
      await API.post(`/posts/${postId}/comment`, { text: commentText.trim() });
      setCommentText("");
      setCommentOpenId(null);
      await fetchPosts();
    } catch (err) {
      console.error("Failed to comment:", err);
      showToast("Could not add comment");
    }
  };

  const handleShare = async (post) => {
    try {
      await navigator.clipboard.writeText(
        `${post.content}\n\n— ${post.author?.name || "AU Community"}`
      );
      showToast("Post copied to clipboard");
    } catch {
      showToast("Copy not supported in this browser");
    }
  };

  const openPostModal = (category = "General") => {
    setPostCategory(category);
    setShowPostModal(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("au_token");
    localStorage.removeItem("au_user");
    navigate("/login");
  };

  /* ---------- render ---------- */

  return (
    <div className="sd-layout">
      {/* ================= NAVBAR ================= */}
      <nav className="sd-navbar">
        <div className="sd-navbar-inner">
          <button
            type="button"
            className="sd-brand"
            onClick={() => goTo("home")}
            title="AU Foundation Home"
          >
            <span className="sd-brand-badge">AU</span>
            <span className="sd-brand-text">
              <strong>FOUNDATION</strong>
              <span>Student Dashboard</span>
            </span>
          </button>

          <div className="sd-nav-links">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`sd-nav-link ${activeTab === item.key ? "active" : ""}`}
                onClick={() => goTo(item.key)}
              >
                <i className={item.icon} />
                <span>{item.label}</span>
                {item.key === "notifications" && notifications.length > 0 && (
                  <em className="sd-nav-dot" />
                )}
              </button>
            ))}
          </div>

          <div className="sd-profile-wrap" ref={profileMenuRef}>
            <button
              type="button"
              className={`sd-profile-trigger ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => setShowProfileMenu((prev) => !prev)}
              aria-haspopup="true"
              aria-expanded={showProfileMenu}
            >
              <span className="sd-avatar sd-avatar-sm">{currentUser.avatar}</span>
              <span className="sd-profile-label">
                Profile <i className="fas fa-caret-down" />
              </span>
            </button>

            {showProfileMenu && (
              <div className="sd-dropdown" role="menu">
                <div className="sd-dropdown-head">
                  <span className="sd-avatar sd-avatar-md">{currentUser.avatar}</span>
                  <div>
                    <strong>{currentUser.name}</strong>
                    <span>{currentUser.role || "Student"}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="sd-view-profile"
                  onClick={() => goTo("profile")}
                >
                  View Profile
                </button>

                <div className="sd-divider" />

                <button
                  type="button"
                  className="sd-dropdown-item"
                  onClick={() => goTo("opportunity")}
                >
                  <i className="fas fa-briefcase" /> Opportunities
                </button>
                <button
                  type="button"
                  className="sd-dropdown-item"
                  onClick={() => goTo("events")}
                >
                  <i className="fas fa-calendar-alt" /> Events
                </button>

                <div className="sd-divider" />

                <button
                  type="button"
                  className="sd-dropdown-item danger"
                  onClick={handleLogout}
                >
                  <i className="fas fa-sign-out-alt" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ================= BODY ================= */}
      <main className="sd-main">
        {activeTab === "home" && (
          <div className="sd-home">
            {/* ---- LEFT: user profile ---- */}
            <aside className="sd-col-left">
              <div className="sd-card sd-profile-card">
                <div className="sd-profile-cover" />
                <span className="sd-avatar sd-avatar-lg">{currentUser.avatar}</span>

                <button
                  type="button"
                  className="sd-profile-info"
                  onClick={() => goTo("profile")}
                >
                  <strong>{currentUser.name}</strong>
                  <span>{currentUser.role || "Student"}</span>
                  {currentUser.batchNumber && <span>Batch {currentUser.batchNumber}</span>}
                </button>

                {currentUser.bio && <p className="sd-profile-bio">{currentUser.bio}</p>}

                {currentUser.skills?.length > 0 && (
                  <div className="sd-skills">
                    {currentUser.skills.slice(0, 4).map((skill) => (
                      <span key={skill}>{skill}</span>
                    ))}
                  </div>
                )}

                <div className="sd-profile-actions">
                  <button type="button" onClick={() => goTo("profile")}>
                    <i className="fas fa-user-circle" /> View Profile
                  </button>
                  <button type="button" onClick={() => goTo("opportunity")}>
                    <i className="fas fa-briefcase" /> Opportunities
                  </button>
                  <button type="button" onClick={() => goTo("events")}>
                    <i className="fas fa-calendar-alt" /> Events
                  </button>
                </div>
              </div>
            </aside>

            {/* ---- MIDDLE: create post + feed ---- */}
            <section className="sd-col-mid">
              <div className="sd-card sd-create">
                <span className="sd-avatar sd-avatar-md">{currentUser.avatar}</span>
                <button
                  type="button"
                  className="sd-create-input"
                  onClick={() => openPostModal("General")}
                >
                  Share an update or project with the community
                </button>
                <button
                  type="button"
                  className="sd-btn-primary"
                  onClick={() => openPostModal("General")}
                >
                  <i className="fas fa-plus" /> Create Post
                </button>
              </div>

              {posts.length > 0 ? (
                posts.map((post) => {
                  const isLiked =
                    currentUser?._id && post.likes?.includes(currentUser._id);
                  const isTeacher = post.author?.role === "teacher";
                  const roleLabel = post.author?.role
                    ? post.author.role.charAt(0).toUpperCase() +
                    post.author.role.slice(1)
                    : "Member";

                  return (
                    <article className="sd-card sd-post" key={post._id}>
                      <header className="sd-post-head">
                        <span
                          className={`sd-avatar sd-avatar-md ${isTeacher ? "is-teacher" : "is-student"}`}
                        >
                          {getInitials(post.author?.name) || "U"}
                        </span>

                        <div className="sd-post-meta">
                          <div className="sd-post-name">
                            <strong>{post.author?.name || "AU Community Member"}</strong>
                            {isTeacher && <span className="sd-tag">Faculty</span>}
                            {post.category && post.category !== "General" && (
                              <span className="sd-tag sd-tag-soft">{post.category}</span>
                            )}
                          </div>
                          <span className="sd-post-time">
                            {roleLabel},{" "}
                            {post.createdAt
                              ? new Date(post.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })
                              : "Recently"}
                          </span>
                        </div>
                      </header>

                      <div className="sd-post-body">
                        <p>{post.content}</p>
                        {post.image && (
                          <div className="sd-post-media">
                            {post.image.startsWith("data:video") ||
                              post.image.endsWith(".mp4") ? (
                              <video controls src={post.image} />
                            ) : (
                              <img src={post.image} alt="Post attachment" />
                            )}
                          </div>
                        )}
                      </div>

                      <div className="sd-post-stats">
                        <span>
                          <i className="fas fa-thumbs-up" /> {post.likes?.length || 0}
                        </span>
                        <span>{post.comments?.length || 0} comments</span>
                      </div>

                      <div className="sd-post-actions">
                        <button
                          type="button"
                          className={isLiked ? "active" : ""}
                          onClick={() => handleLikePost(post._id)}
                        >
                          <i className={isLiked ? "fas fa-thumbs-up" : "far fa-thumbs-up"} />
                          Like
                        </button>
                        <button
                          type="button"
                          className={commentOpenId === post._id ? "active" : ""}
                          onClick={() => {
                            setCommentOpenId(commentOpenId === post._id ? null : post._id);
                            setCommentText("");
                          }}
                        >
                          <i className="far fa-comment-alt" />
                          Comment
                        </button>
                        <button type="button" onClick={() => handleShare(post)}>
                          <i className="fas fa-share" />
                          Share
                        </button>
                      </div>

                      {commentOpenId === post._id && (
                        <div className="sd-comment-box">
                          <input
                            type="text"
                            placeholder="Write a comment"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleComment(post._id)}
                            autoFocus
                          />
                          <button
                            type="button"
                            className="sd-btn-primary"
                            disabled={!commentText.trim()}
                            onClick={() => handleComment(post._id)}
                          >
                            Send
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })
              ) : (
                <div className="sd-card sd-empty">
                  <p>No posts yet. Share the first update with the AU community.</p>
                  <button
                    type="button"
                    className="sd-btn-primary"
                    onClick={() => openPostModal("General")}
                  >
                    Create Post
                  </button>
                </div>
              )}
            </section>

            {/* ---- RIGHT: notifications ---- */}
            <aside className="sd-col-right">
              <div className="sd-card sd-widget">
                <div className="sd-widget-head">
                  <h4>Notifications</h4>
                  <button type="button" onClick={() => goTo("notifications")}>
                    View all
                  </button>
                </div>

                {notifications.length > 0 ? (
                  <ul className="sd-notif-list">
                    {notifications.map((n, i) => (
                      <li key={n._id || i}>
                        <button type="button" onClick={() => goTo("notifications")}>
                          <i className="fas fa-bullhorn" />
                          <span>
                            <strong>{n.title || n.content || "New announcement"}</strong>
                            {n.createdAt && (
                              <em>
                                {new Date(n.createdAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </em>
                            )}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="sd-widget-empty">You are all caught up.</p>
                )}
              </div>
            </aside>
          </div>
        )}

        {activeTab === "network" && <NetworkPage />}
        {activeTab === "opportunity" && <OpportunitiesPage />}
        {activeTab === "events" && <EventsPage />}
        {activeTab === "notifications" && <NotificationsPage />}
        {activeTab === "profile" && (
          <StudentProfile
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
          />
        )}

        {activeTab === "messages" && <StudentMessages />}
      </main>

      {/* ================= CREATE POST MODAL ================= */}
      {showPostModal && (
        <div className="sd-overlay" onClick={closePostModal}>
          <div
            className="sd-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Create post"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sd-modal-head">
              <h3>Create post</h3>
              <button type="button" onClick={closePostModal} aria-label="Close">
                <i className="fas fa-times" />
              </button>
            </div>

            <div className="sd-modal-body">
              <div className="sd-modal-user">
                <span className="sd-avatar sd-avatar-md">{currentUser.avatar}</span>
                <div>
                  <strong>{currentUser.name}</strong>
                  <span>{currentUser.role || "Student"}</span>
                </div>
              </div>

              <label htmlFor="sd-category">Category</label>
              <select
                id="sd-category"
                value={postCategory}
                onChange={(e) => setPostCategory(e.target.value)}
              >
                <option value="General">General</option>
                <option value="Discussion">Discussion</option>
                <option value="Achievement">Achievement</option>
                <option value="Project">Project Share</option>
              </select>

              <label htmlFor="sd-content">What do you want to share?</label>
              <textarea
                id="sd-content"
                placeholder="Write an update, question or project showcase"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
              />

              <label htmlFor="sd-media">Photo or video</label>
              <input
                id="sd-media"
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaUpload}
              />

              {postMedia && (
                <div className="sd-media-preview">
                  {isVideo ? (
                    <video controls src={postMedia} />
                  ) : (
                    <img src={postMedia} alt="Selected preview" />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setPostMedia("");
                      setIsVideo(false);
                    }}
                    aria-label="Remove attachment"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            <div className="sd-modal-foot">
              <button type="button" className="sd-btn-ghost" onClick={closePostModal}>
                Cancel
              </button>
              <button
                type="button"
                className="sd-btn-primary"
                onClick={handleCreatePost}
                disabled={isPosting || !newPostContent.trim()}
              >
                {isPosting ? "Publishing..." : "Publish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="sd-toast" role="status">{toast}</div>}
    </div>
  );
};

export default StudentDashboard;