import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api";
import TeacherEvents from "../pages/Teacher/Events";
import TeacherOpportunities from "../pages/Teacher/Opportunities";
import TeacherNetwork from "../pages/Teacher/Network";
import TeacherNotifications from "../pages/Teacher/Notifications";
import TeacherProfile from "../pages/Teacher/TeacherProfile";
import TeacherMessages from "../pages/Teacher/Messages";
import "../../styles/TeacherStyle/TeacherDashboard.css";

const NAV_ITEMS = [
  { key: "home", label: "Home", icon: "fas fa-home" },
  { key: "network", label: "Network", icon: "fas fa-user-graduate" },
  { key: "opportunity", label: "Opportunities", icon: "fas fa-briefcase" },
  { key: "messages", label: "Messages", icon: "fas fa-comment-dots" },
  { key: "events", label: "Events", icon: "fas fa-calendar-alt" },
  { key: "notifications", label: "Notifications", icon: "fas fa-bell" },
];

const getInitials = (name) =>
  name ? name.substring(0, 2).toUpperCase() : "T";

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const profileMenuRef = useRef(null);

  const [currentUser, setCurrentUser] = useState({
    name: "Faculty Member",
    email: "",
    role: "teacher",
    avatar: "T",
    bio: "Senior Faculty & Guide at AU Foundation",
    designation: "Assistant Professor",
    expertise: "Computer Science & Engineering",
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

      if (user._id) {
        try {
          const teacherRes = await API.get(`/teachers/${user._id}`);
          if (teacherRes.data?.profile) {
            const profile = teacherRes.data.profile;
            setCurrentUser((prev) => ({
              ...prev,
              designation: profile.designation || prev.designation,
              expertise: profile.expertise || prev.expertise,
              bio: profile.bio || prev.bio,
            }));
          }
        } catch (err) {
          console.error("Teacher profile details unavailable:", err);
        }
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await API.get("/notifications");
      const list = res.data?.notifications || res.data || [];
      setNotifications(Array.isArray(list) ? list.slice(0, 5) : []);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    fetchUserProfile();
    fetchPosts();
    fetchNotifications();
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
    <div className="td-layout">
      {/* ================= NAVBAR ================= */}
      <nav className="td-navbar">
        <div className="td-navbar-inner">
          <button
            type="button"
            className="td-brand"
            onClick={() => goTo("home")}
            title="AU Foundation Home"
          >
            <span className="td-brand-badge">AU</span>
            <span className="td-brand-text">
              <strong>FOUNDATION</strong>
              <span>Faculty Dashboard</span>
            </span>
          </button>

          <div className="td-nav-links">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`td-nav-link ${activeTab === item.key ? "active" : ""}`}
                onClick={() => goTo(item.key)}
              >
                <i className={item.icon} />
                <span>{item.label}</span>
                {item.key === "notifications" && notifications.length > 0 && (
                  <em className="td-nav-dot" />
                )}
              </button>
            ))}
          </div>

          <div className="td-profile-wrap" ref={profileMenuRef}>
            <button
              type="button"
              className={`td-profile-trigger ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => setShowProfileMenu((prev) => !prev)}
              aria-haspopup="true"
              aria-expanded={showProfileMenu}
            >
              <span className="td-avatar td-avatar-sm">{currentUser.avatar}</span>
              <span className="td-profile-label">
                Profile <i className="fas fa-caret-down" />
              </span>
            </button>

            {showProfileMenu && (
              <div className="td-dropdown" role="menu">
                <div className="td-dropdown-head">
                  <span className="td-avatar td-avatar-md">{currentUser.avatar}</span>
                  <div>
                    <strong>{currentUser.name}</strong>
                    <span>{currentUser.designation}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="td-view-profile"
                  onClick={() => goTo("profile")}
                >
                  View Profile
                </button>

                <div className="td-divider" />

                <button
                  type="button"
                  className="td-dropdown-item"
                  onClick={() => goTo("opportunity")}
                >
                  <i className="fas fa-briefcase" /> Opportunities
                </button>
                <button
                  type="button"
                  className="td-dropdown-item"
                  onClick={() => goTo("events")}
                >
                  <i className="fas fa-calendar-alt" /> Events
                </button>

                <div className="td-divider" />

                <button
                  type="button"
                  className="td-dropdown-item danger"
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
      <main className="td-main">
        {activeTab === "home" && (
          <div className="td-home">
            {/* ---- LEFT: user profile ---- */}
            <aside className="td-col-left">
              <div className="td-card td-profile-card">
                <div className="td-profile-cover" />
                <span className="td-avatar td-avatar-lg">{currentUser.avatar}</span>

                <button
                  type="button"
                  className="td-profile-info"
                  onClick={() => goTo("profile")}
                >
                  <strong>{currentUser.name}</strong>
                  <span>{currentUser.designation}</span>
                  <span>{currentUser.expertise}</span>
                </button>

                {currentUser.bio && <p className="td-profile-bio">{currentUser.bio}</p>}

                <div className="td-profile-actions">
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
            <section className="td-col-mid">
              <div className="td-card td-create">
                <span className="td-avatar td-avatar-md">{currentUser.avatar}</span>
                <button
                  type="button"
                  className="td-create-input"
                  onClick={() => openPostModal("General")}
                >
                  Start a post or share an update with the community...
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
                    <article className="td-card td-post" key={post._id}>
                      <header className="td-post-head">
                        <span
                          className={`td-avatar td-avatar-md ${isTeacher ? "is-teacher" : "is-student"}`}
                        >
                          {getInitials(post.author?.name) || "U"}
                        </span>

                        <div className="td-post-meta">
                          <div className="td-post-name">
                            <strong>{post.author?.name || "AU Community Member"}</strong>
                            {isTeacher && <span className="td-tag">Faculty</span>}
                            {post.category && post.category !== "General" && (
                              <span className="td-tag td-tag-soft">{post.category}</span>
                            )}
                          </div>
                          <span className="td-post-time">
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

                      <div className="td-post-body">
                        <p>{post.content}</p>
                        {post.image && (
                          <div className="td-post-media">
                            {post.image.startsWith("data:video") ||
                              post.image.endsWith(".mp4") ? (
                              <video controls src={post.image} />
                            ) : (
                              <img src={post.image} alt="Post attachment" />
                            )}
                          </div>
                        )}
                      </div>

                      <div className="td-post-stats">
                        <span>
                          <i className="fas fa-thumbs-up" /> {post.likes?.length || 0}
                        </span>
                        <span>{post.comments?.length || 0} comments</span>
                      </div>

                      <div className="td-post-actions">
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
                        <div className="td-comment-box">
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
                            className="td-btn-primary"
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
                <div className="td-card td-empty">
                  <p>No posts yet. Share the first update with the AU community.</p>
                  <button
                    type="button"
                    className="td-btn-primary"
                    onClick={() => openPostModal("General")}
                  >
                    Create Post
                  </button>
                </div>
              )}
            </section>

            {/* ---- RIGHT: notifications ---- */}
            <aside className="td-col-right">
              <div className="td-card td-widget">
                <div className="td-widget-head">
                  <h4>Notifications</h4>
                  <button type="button" onClick={() => goTo("notifications")}>
                    View all
                  </button>
                </div>

                {notifications.length > 0 ? (
                  <ul className="td-notif-list">
                    {notifications.map((n, i) => (
                      <li key={n._id || i}>
                        <button type="button" onClick={() => goTo("notifications")}>
                          <i className="fas fa-bell" />
                          <span>
                            <strong>{n.title || n.message || "New notification"}</strong>
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
                  <p className="td-widget-empty">You are all caught up.</p>
                )}
              </div>
            </aside>
          </div>
        )}

        {activeTab === "network" && <TeacherNetwork />}
        {activeTab === "opportunity" && <TeacherOpportunities />}
        {activeTab === "events" && <TeacherEvents />}
        {activeTab === "notifications" && <TeacherNotifications />}
        {activeTab === "profile" && (
          <TeacherProfile
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
          />
        )}

        {activeTab === "messages" && <TeacherMessages />}
      </main>

      {/* ================= CREATE POST MODAL ================= */}
      {showPostModal && (
        <div className="td-overlay" onClick={closePostModal}>
          <div
            className="td-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Create post"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="td-modal-head">
              <h3>Create post</h3>
              <button type="button" onClick={closePostModal} aria-label="Close">
                <i className="fas fa-times" />
              </button>
            </div>

            <div className="td-modal-body">
              <div className="td-modal-user">
                <span className="td-avatar td-avatar-md">{currentUser.avatar}</span>
                <div>
                  <strong>{currentUser.name}</strong>
                  <span>{currentUser.designation}</span>
                </div>
              </div>

              <label htmlFor="td-category">Category</label>
              <select
                id="td-category"
                value={postCategory}
                onChange={(e) => setPostCategory(e.target.value)}
              >
                <option value="General">General</option>
                <option value="Discussion">Discussion</option>
                <option value="Achievement">Achievement</option>
              </select>

              <label htmlFor="td-content">What do you want to share?</label>
              <textarea
                id="td-content"
                placeholder="Write an update, insight or announcement"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
              />

              <label htmlFor="td-media">Photo or video</label>
              <input
                id="td-media"
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaUpload}
              />

              {postMedia && (
                <div className="td-media-preview">
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

            <div className="td-modal-foot">
              <button type="button" className="td-btn-ghost" onClick={closePostModal}>
                Cancel
              </button>
              <button
                type="button"
                className="td-btn-primary"
                onClick={handleCreatePost}
                disabled={isPosting || !newPostContent.trim()}
              >
                {isPosting ? "Publishing..." : "Publish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="td-toast" role="status">{toast}</div>}
    </div>
  );
};

export default TeacherDashboard;