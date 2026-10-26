import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/AdminStyle/AdminDashboard.css';
import API from '../../api';
import AdminUsers from '../pages/Admin/AdminUsers';
import AdminPosts from '../pages/Admin/AdminPosts';
import AdminOpportunities from '../pages/Admin/AdminOpportunities';
import AdminAnnouncements from '../pages/Admin/AdminAnnouncements';
import AdminEvents from '../pages/Admin/AdminEvents';
import AdminSettings from '../pages/Admin/AdminSettings';
import AdminProfile from '../pages/Admin/AdminProfile';

function AdminDashboard() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState({
    name: 'Admin',
    email: 'admin@aucommunity.com',
    role: 'Admin',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [stats, setStats] = useState({
    users: 0,
    posts: 0,
    opportunities: 210,
    announcements: 32,
    reports: 0,
  });

  const [liveData, setLiveData] = useState({
    recentUsers: [],
    recentPosts: [],
    pendingReports: [],
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [usersRes, postsRes, eventsRes, oppsRes, annsRes] = await Promise.all([
          API.get('/admin/users'),
          API.get('/admin/posts'),
          API.get('/events'),
          API.get('/opportunities'),
          API.get('/announcements')
        ]);

        const users = usersRes.data?.users || [];
        const posts = postsRes.data?.posts || [];
        const events = eventsRes.data?.events || [];
        const opps = oppsRes.data?.opportunities || [];
        const anns = annsRes.data?.announcements || [];

        // Sort for top items
        const sortedPosts = [...posts].sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
        const topPosts = sortedPosts.slice(0, 3);

        const sortedOpps = [...opps].sort((a, b) => (b.applications || 0) - (a.applications || 0));
        const topOpps = sortedOpps.slice(0, 3);

        const totalLikes = posts.reduce((sum, post) => sum + (post.likes?.length || 0), 0);
        const totalComments = posts.reduce((sum, post) => sum + (post.comments?.length || 0), 0);

        setStats({
          users: usersRes.data?.totalUsers || users.length || 0,
          posts: postsRes.data?.totalPosts || posts.length || 0,
          opportunities: opps.length,
          announcements: anns.length,
          events: events.length,
        });

        setLiveData({
          recentUsers: users.slice(0, 4),
          recentPosts: posts.slice(0, 4),
          recentEvents: events.slice(0, 5),
          topPosts,
          topOpps,
          recentAnns: anns.slice(0, 4),
          totalLikes,
          totalComments,
          activeUsers: users.filter(u => u.isVerified !== false).length
        });
      } catch (err) {
        console.error('Error fetching admin dashboard data:', err);
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem('au_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setCurrentUser((prev) => ({
          ...prev,
          name: parsed.name || prev.name,
          email: parsed.email || prev.email,
          role: parsed.role || prev.role,
        }));
      } catch (err) { }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('au_token');
    localStorage.removeItem('au_user');
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar ${isSidebarOpen ? '' : 'closed'}`}>
        <div className="sidebar-brand">
          <div className="sidebar-logo">AU</div>
          <div className="sidebar-title">
            <span className="sidebar-title-main">Community</span>
            <span className="sidebar-title-sub">Learn · Connect · Grow</span>
          </div>
          <i className="fas fa-times sidebar-close" onClick={() => setIsSidebarOpen(false)}></i>
        </div>

        <nav className="sidebar-nav">
          <button className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <i className="fas fa-home"></i><span>Dashboard</span>
          </button>
          <button className={`sidebar-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
            <i className="fas fa-users"></i><span>Users</span>
          </button>
          <button className={`sidebar-item ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>
            <i className="fas fa-edit"></i><span>Posts</span>
          </button>
          <button className={`sidebar-item ${activeTab === 'opportunities' ? 'active' : ''}`} onClick={() => setActiveTab('opportunities')}>
            <i className="fas fa-briefcase"></i><span>Opportunities</span>
          </button>
          <button className={`sidebar-item ${activeTab === 'announcements' ? 'active' : ''}`} onClick={() => setActiveTab('announcements')}>
            <i className="fas fa-bullhorn"></i><span>Announcements</span>
          </button>
          <button className={`sidebar-item ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}>
            <i className="fas fa-calendar-alt"></i><span>Events</span>
          </button>
          <button className={`sidebar-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            <i className="fas fa-cog"></i><span>Settings</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-banner">Better<br />Skills<br />Brighter<br />Tomorrow</div>
          <button className="sidebar-logout" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </aside>

      <main className={`admin-main ${isSidebarOpen ? '' : 'full-width'}`}>
        <header className="admin-header">
          <div className="header-left">
            <i className="fas fa-bars sidebar-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}></i>
            <div className="header-search">
              <i className="fas fa-search"></i>
              <input type="text" placeholder="Search users, posts, opportunities..." />
              <kbd>Ctrl K</kbd>
            </div>
          </div>

          <div className="header-right">
            <div className="header-profile" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('profile')}>
              <img src={currentUser.avatar} alt="Admin" />
              <div className="profile-info">
                <span className="profile-name">{currentUser.name}</span>
                <span className="profile-role">{currentUser.role}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="admin-content">
          {activeTab === 'dashboard' && (
            <>
              <div className="welcome-section">
                <div className="welcome-text">
                  <h1>Welcome Back, {currentUser.name} 👋</h1>
                  <p>Here's what's happening with AU Foundation today.</p>
                </div>
                <div className="welcome-actions">
                  <div className="date-display">
                    <i className="far fa-calendar-alt"></i> Monday, 29 Sep 2026
                  </div>
                  <button className="btn-primary" onClick={() => setActiveTab('settings')}>
                    <i className="fas fa-plus"></i> Quick Action <i className="fas fa-chevron-down" style={{ fontSize: '10px', marginLeft: '4px' }}></i>
                  </button>
                </div>
              </div>

              {/* STATS */}
              <div className="stats-container">
                <div className="stat-box purple">
                  <div className="stat-icon-wrapper"><i className="fas fa-user-friends"></i></div>
                  <div className="stat-details">
                    <span className="stat-value">{stats.users}</span>
                    <span className="stat-label">Total Users</span>
                    <span className="stat-change up"><i className="fas fa-arrow-up"></i> 12%</span>
                    <span className="stat-change-text">Since last month</span>
                  </div>
                </div>

                <div className="stat-box blue">
                  <div className="stat-icon-wrapper"><i className="fas fa-newspaper"></i></div>
                  <div className="stat-details">
                    <span className="stat-value">{stats.posts}</span>
                    <span className="stat-label">Total Posts</span>
                    <span className="stat-change up"><i className="fas fa-arrow-up"></i> 15%</span>
                    <span className="stat-change-text">Since last month</span>
                  </div>
                </div>

                <div className="stat-box orange">
                  <div className="stat-icon-wrapper"><i className="fas fa-briefcase"></i></div>
                  <div className="stat-details">
                    <span className="stat-value">{stats.opportunities}</span>
                    <span className="stat-label">Opportunities</span>
                    <span className="stat-change up"><i className="fas fa-arrow-up"></i> 20%</span>
                    <span className="stat-change-text">Since last month</span>
                  </div>
                </div>

                <div className="stat-box pink">
                  <div className="stat-icon-wrapper"><i className="fas fa-bullhorn"></i></div>
                  <div className="stat-details">
                    <span className="stat-value">{stats.announcements}</span>
                    <span className="stat-label">Announcements</span>
                    <span className="stat-change up"><i className="fas fa-arrow-up"></i> 6%</span>
                    <span className="stat-change-text">Since last month</span>
                  </div>
                </div>

                <div className="stat-box green" style={{ background: '#ecfdf5' }}>
                  <div className="stat-icon-wrapper" style={{ background: '#10b981', color: 'white' }}><i className="fas fa-calendar-alt"></i></div>
                  <div className="stat-details">
                    <span className="stat-value">{stats.events || 0}</span>
                    <span className="stat-label">Total Events</span>
                    <span className="stat-change up"><i className="fas fa-arrow-up"></i> Active</span>
                    <span className="stat-change-text">Campus Events</span>
                  </div>
                </div>

              </div>

              {/* CHARTS (Placeholders for visual match) */}
              <div className="middle-grid">
                <div className="card">
                  <div className="card-header-flex">
                    <h3 className="card-title">Platform Growth</h3>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#69718a' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6018db' }}></span> Users</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#007aff' }}></span> Posts</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff5e00' }}></span> Opportunities</span>
                      </div>
                      <select className="card-filter"><option>Last 6 Months</option></select>
                    </div>
                  </div>
                  <div style={{ height: '220px', display: 'flex', alignItems: 'flex-end', gap: '40px', padding: '0 20px', borderBottom: '1px solid #f0f1f5', position: 'relative' }}>
                    {/* SVG Line Chart Placeholder */}
                    <svg width="100%" height="100%" viewBox="0 0 500 200" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, left: 0 }}>
                      <path d="M 0,150 C 100,140 200,100 300,90 S 400,80 500,50" fill="none" stroke="#6018db" strokeWidth="2" />
                      <path d="M 0,180 C 100,170 200,140 300,130 S 400,120 500,110" fill="none" stroke="#007aff" strokeWidth="2" />
                      <path d="M 0,190 C 100,185 200,170 300,165 S 400,150 500,140" fill="none" stroke="#ff5e00" strokeWidth="2" />

                      <circle cx="0" cy="150" r="4" fill="#6018db" />
                      <circle cx="125" cy="120" r="4" fill="#6018db" />
                      <circle cx="250" cy="95" r="4" fill="#6018db" />
                      <circle cx="375" cy="85" r="4" fill="#6018db" />
                      <circle cx="500" cy="50" r="4" fill="#6018db" />
                    </svg>
                    <div style={{ position: 'absolute', bottom: '-25px', left: 0, width: '100%', display: 'flex', justifyContent: 'space-between', color: '#69718a', fontSize: '11px' }}>
                      <span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header-flex">
                    <h3 className="card-title">User Distribution</h3>
                    <select className="card-filter"><option>All Users</option></select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', height: '180px' }}>
                    <div style={{ width: '140px', height: '140px', borderRadius: '50%', background: 'conic-gradient(#6018db 0% 78%, #007aff 78% 95%, #ff5e00 95% 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '110px', height: '110px', borderRadius: '50%', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '20px', fontWeight: '700', color: '#100b21' }}>{stats.users}</span>
                        <span style={{ fontSize: '11px', color: '#69718a' }}>Total Users</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', fontSize: '13px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}><span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#6018db' }}></span> Students</span>
                        <span style={{ fontWeight: '700' }}>980 <span style={{ color: '#69718a', fontWeight: '400', fontSize: '11px', marginLeft: '8px' }}>78%</span></span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', fontSize: '13px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}><span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5e00' }}></span> Admins</span>
                        <span style={{ fontWeight: '700' }}>58 <span style={{ color: '#69718a', fontWeight: '400', fontSize: '11px', marginLeft: '8px' }}>5%</span></span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header-flex">
                    <h3 className="card-title"><i className="fas fa-bolt" style={{ color: '#2f80ed' }}></i> Quick Actions</h3>
                  </div>
                  <div className="quick-actions-grid">
                    <button className="action-btn purple" onClick={() => setActiveTab('users')}>
                      <div className="icon"><i className="fas fa-user-plus"></i></div>
                      <div className="text">Add User</div>
                    </button>
                    <button className="action-btn blue" onClick={() => setActiveTab('posts')}>
                      <div className="icon"><i className="fas fa-edit"></i></div>
                      <div className="text">Create Post</div>
                    </button>
                    <button className="action-btn orange" onClick={() => setActiveTab('opportunities')}>
                      <div className="icon"><i className="fas fa-briefcase"></i></div>
                      <div className="text">Add Opportunity</div>
                    </button>
                    <button className="action-btn pink" onClick={() => setActiveTab('announcements')}>
                      <div className="icon"><i className="fas fa-bullhorn"></i></div>
                      <div className="text" style={{ textAlign: 'center' }}>New<br />Announcement</div>
                    </button>
                    <button className="action-btn green" onClick={() => setActiveTab('events')}>
                      <div className="icon"><i className="fas fa-calendar-alt"></i></div>
                      <div className="text">Manage Events</div>
                    </button>
                    <button className="action-btn green" onClick={() => setActiveTab('users')}>
                      <div className="icon"><i className="fas fa-users-cog"></i></div>
                      <div className="text">Manage Users</div>
                    </button>
                  </div>
                </div>
              </div>

              {/* LISTS */}
              <div className="lists-grid">
                <div className="card">
                  <div className="card-header-flex">
                    <h3 className="card-title">Recent Users</h3>
                    <a href="#" className="view-all" onClick={(e) => { e.preventDefault(); setActiveTab('users'); }}>View All &rarr;</a>
                  </div>
                  <div className="list-content">
                    {liveData.recentUsers.length > 0 ? liveData.recentUsers.map((user, idx) => (
                      <div className="list-item" key={idx}>
                        <img src={user.profilePicture || "https://randomuser.me/api/portraits/lego/1.jpg"} alt="User" className="list-item-avatar" />
                        <div className="list-item-content">
                          <div className="list-item-title">{user.name}</div>
                          <div className="list-item-sub">{user.email}</div>
                        </div>
                        <div className="list-item-right">
                          <span className="badge purple">{user.role}</span>
                        </div>
                      </div>
                    )) : <div style={{ padding: '20px', color: '#69718a' }}>No recent users.</div>}
                  </div>
                </div>

                <div className="card">
                  <div className="card-header-flex">
                    <h3 className="card-title">Recent Activity</h3>
                    <a href="#" className="view-all" onClick={(e) => { e.preventDefault(); setActiveTab('dashboard'); }}>View All &rarr;</a>
                  </div>
                  <div className="list-content">
                    {liveData.recentAnns && liveData.recentAnns.length > 0 ? liveData.recentAnns.map((ann, idx) => (
                      <div className="list-item" key={idx}>
                        <div className="list-item-icon pink"><i className="fas fa-bullhorn"></i></div>
                        <div className="list-item-content">
                          <div className="list-item-title">{ann.title}</div>
                          <div className="list-item-sub">Target: {ann.publishedTo}</div>
                        </div>
                        <div className="time-text">{new Date(ann.createdAt).toLocaleDateString()}</div>
                      </div>
                    )) : <div style={{ padding: '20px', color: '#69718a' }}>No recent announcements.</div>}
                  </div>
                </div>

                <div className="card">
                  <div className="card-header-flex">
                    <h3 className="card-title"><i className="fas fa-calendar-alt" style={{ color: '#10b981' }}></i> Upcoming Events</h3>
                    <a href="#" className="view-all" onClick={(e) => { e.preventDefault(); setActiveTab('events'); }}>View All &rarr;</a>
                  </div>
                  <div className="list-content">
                    {liveData.recentEvents && liveData.recentEvents.length > 0 ? liveData.recentEvents.map((evt, idx) => (
                      <div className="list-item" key={idx}>
                        <div className="list-item-icon green" style={{ background: '#ecfdf5', color: '#10b981' }}><i className="fas fa-calendar-alt"></i></div>
                        <div className="list-item-content">
                          <div className="list-item-title">{evt.title}</div>
                          <div className="list-item-sub">{evt.category} • {evt.location}</div>
                        </div>
                        <div className="list-item-right">
                          <span className="badge green" style={{ background: '#ecfdf5', color: '#059669' }}>{evt.eventDate || 'Upcoming'}</span>
                        </div>
                      </div>
                    )) : <div style={{ padding: '20px', color: '#69718a' }}>No upcoming events.</div>}
                  </div>
                </div>
              </div>

              {/* BOTTOM SECTION */}
              <div className="bottom-grid">
                <div className="card">
                  <div className="card-header-flex">
                    <h3 className="card-title">Top Posts</h3>
                    <a href="#" className="view-all" onClick={(e) => { e.preventDefault(); setActiveTab('posts'); }}>View All &rarr;</a>
                  </div>
                  <div className="list-content">
                    {liveData.topPosts && liveData.topPosts.length > 0 ? liveData.topPosts.map((post, idx) => (
                      <div className={`rank-item ${idx === 0 ? 'top-1' : ''}`} key={idx}>
                        <div className="rank-number">{idx + 1}</div>
                        <div className="rank-img" style={{ background: '#0d0722', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffb300' }}><i className="fas fa-file-alt" style={{ fontSize: '20px' }}></i></div>
                        <div className="rank-content">
                          <div className="rank-title">{post.content?.substring(0, 30)}...</div>
                          <div className="rank-sub">{post.author?.name || 'Unknown'}</div>
                        </div>
                        <div className="rank-right"><i className="fas fa-heart" style={{ color: '#ef4444' }}></i> {post.likes?.length || 0} likes</div>
                      </div>
                    )) : <div style={{ padding: '20px', color: '#69718a' }}>No posts available.</div>}
                  </div>
                </div>

                <div className="card">
                  <div className="card-header-flex">
                    <h3 className="card-title">Top Opportunities</h3>
                    <a href="#" className="view-all" onClick={(e) => { e.preventDefault(); setActiveTab('opportunities'); }}>View All &rarr;</a>
                  </div>
                  <div className="list-content">
                    {liveData.topOpps && liveData.topOpps.length > 0 ? liveData.topOpps.map((opp, idx) => (
                      <div className={`rank-item ${idx === 0 ? 'top-1' : ''}`} key={idx}>
                        <div className="rank-number">{idx + 1}</div>
                        <div className="rank-content">
                          <div className="rank-title">{opp.title}</div>
                          <div className="rank-sub">{opp.company} • {opp.type}</div>
                        </div>
                        <div className="rank-right">{opp.applications || 0} applications</div>
                      </div>
                    )) : <div style={{ padding: '20px', color: '#69718a' }}>No opportunities available.</div>}
                  </div>
                </div>

                <div className="card">
                  <div className="card-header-flex">
                    <h3 className="card-title"><i className="fas fa-chart-bar" style={{ color: '#4a54f1' }}></i> Community Summary</h3>
                    <a href="#" className="view-all" onClick={(e) => { e.preventDefault(); setActiveTab('dashboard'); }}>View All &rarr;</a>
                  </div>
                  <div className="list-content">
                    <div className="summary-item">
                      <div className="summary-left">
                        <div className="list-item-icon blue"><i className="fas fa-comments"></i></div>
                        <div className="rank-content">
                          <div className="rank-title" style={{ fontSize: '14px' }}>Total Comments</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{ fontSize: '16px', fontWeight: '700', color: '#100b21' }}>{liveData.totalComments || 0}</span>
                      </div>
                    </div>
                    <div className="summary-item">
                      <div className="summary-left">
                        <div className="list-item-icon pink"><i className="fas fa-heart"></i></div>
                        <div className="rank-content">
                          <div className="rank-title" style={{ fontSize: '14px' }}>Total Likes</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{ fontSize: '16px', fontWeight: '700', color: '#100b21' }}>{liveData.totalLikes || 0}</span>
                      </div>
                    </div>
                    <div className="summary-item">
                      <div className="summary-left">
                        <div className="list-item-icon blue"><i className="fas fa-users"></i></div>
                        <div className="rank-content">
                          <div className="rank-title" style={{ fontSize: '14px' }}>Active Verified Users</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{ fontSize: '16px', fontWeight: '700', color: '#100b21' }}>{liveData.activeUsers || 0}</span>
                      </div>
                    </div>
                    <div className="summary-item">
                      <div className="summary-left">
                        <div className="list-item-icon orange"><i className="fas fa-briefcase"></i></div>
                        <div className="rank-content">
                          <div className="rank-title" style={{ fontSize: '14px' }}>Total Opportunities</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{ fontSize: '16px', fontWeight: '700', color: '#100b21' }}>{stats.opportunities || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'users' && <AdminUsers />}
          {activeTab === 'posts' && <AdminPosts />}
          {activeTab === 'opportunities' && <AdminOpportunities />}
          {activeTab === 'announcements' && <AdminAnnouncements />}
          {activeTab === 'events' && <AdminEvents />}
          {activeTab === 'settings' && <AdminSettings />}
          {activeTab === 'profile' && <AdminProfile currentUser={currentUser} setCurrentUser={setCurrentUser} />}
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
