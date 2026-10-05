import React, { useState, useEffect } from 'react';
import API from '../../../api';
import '../../../styles/AdminStyle/AdminUsers.css';

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student'
  });
  const [addError, setAddError] = useState('');

  const usersPerPage = 7;

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await API.get('/admin/users');
      setUsers(res.data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    setAddError('');
    try {
      const res = await API.post('/auth/register', newUserData);
      if (res.data.success || res.status === 201 || res.status === 200) {
        setIsAddModalOpen(false);
        setNewUserData({ name: '', email: '', password: '', role: 'student' });
        fetchUsers();
      } else {
        setAddError(res.data.message || 'Failed to add user');
      }
    } catch (err) {
      setAddError(err.response?.data?.message || 'Error registering user. Please check details.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await API.delete(`/admin/users/${id}`);
        fetchUsers();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleUpdateRole = async (id, newRole) => {
    try {
      await API.put(`/admin/users/${id}/role`, { role: newRole });
      fetchUsers();
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const openUserModal = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  // Filter and Search logic
  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'All' || user.role?.toLowerCase() === filterRole.toLowerCase();
    return matchesSearch && matchesRole;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // Stats
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.isVerified !== false).length;
  const pendingUsers = users.filter(u => u.isVerified === false).length;

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <h1>Manage Users</h1>
          <p>View, manage and monitor community members</p>
        </div>
        <button className="add-user-btn" onClick={() => setIsAddModalOpen(true)}>
          <span>+</span> Add New User
        </button>
      </div>

      <div className="user-stats">
        <div className="user-stat-card">
          <div className="stat-icon total-icon">
            <i className="fas fa-users"></i>
          </div>
          <div>
            <span>Total Users</span>
            <h2>{totalUsers}</h2>
          </div>
        </div>
        <div className="user-stat-card">
          <div className="stat-icon active-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <div>
            <span>Active Members</span>
            <h2>{activeUsers}</h2>
          </div>
        </div>
        <div className="user-stat-card">
          <div className="stat-icon pending-icon">
            <i className="fas fa-clock"></i>
          </div>
          <div>
            <span>Pending Verification</span>
            <h2>{pendingUsers}</h2>
          </div>
        </div>
        <div className="user-stat-card">
          <div className="stat-icon blocked-icon">
            <i className="fas fa-user-shield"></i>
          </div>
          <div>
            <span>Admins</span>
            <h2>{users.filter(u => u.role === 'admin').length}</h2>
          </div>
        </div>
      </div>

      <div className="users-card">
        <div className="users-toolbar">
          <div className="search-box">
            <span><i className="fas fa-search"></i></span>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <div className="filter-group">
            <select value={filterRole} onChange={(e) => { setFilterRole(e.target.value); setCurrentPage(1); }}>
              <option value="All">All Roles</option>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>USER DETAILS</th>
                <th>ROLE</th>
                <th>STATUS</th>
                <th>JOINED DATE</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>Loading users...</td>
                </tr>
              ) : currentUsers.length > 0 ? (
                currentUsers.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <div className="user-info">
                        <div className="user-avatar">
                          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <h4>{user.name}</h4>
                          <p>{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`role-badge ${user.role}`}>
                        {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Unknown'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${user.isVerified !== false ? 'active' : 'pending'}`}>
                        <span className="status-dot"></span>
                        {user.isVerified !== false ? 'Active' : 'Pending'}
                      </span>
                    </td>
                    <td>
                      <span className="joined-date">
                        {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="view-btn" title="View details" onClick={() => openUserModal(user)}>
                          <i className="fas fa-eye"></i>
                        </button>
                        <button className="edit-btn" title="Edit role" onClick={() => openUserModal(user)}>
                          <i className="fas fa-pen"></i>
                        </button>
                        <button className="block-btn" title="Delete User" onClick={() => handleDelete(user._id)}>
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">
                    <div className="no-users">
                      <div><i className="fas fa-search" style={{ color: '#cbd5e1' }}></i></div>
                      <h3>No users found</h3>
                      <p>Try adjusting your search or filters to find what you're looking for.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="users-footer">
          <p>Showing <strong>{indexOfFirstUser + 1}</strong> to <strong>{Math.min(indexOfLastUser, filteredUsers.length)}</strong> of <strong>{filteredUsers.length}</strong> users</p>
          <div className="pagination">
            <button
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                className={currentPage === i + 1 ? 'active-page' : ''}
                onClick={() => handlePageChange(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>

      {/* ADD USER MODAL */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="user-modal" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'left' }}>
            <button className="modal-close" onClick={() => setIsAddModalOpen(false)}>&times;</button>
            <h2 style={{ marginBottom: '6px' }}><i className="fas fa-user-plus" style={{ color: '#4f46e5', marginRight: '8px' }}></i> Add New User</h2>
            <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>Create a new member account for the platform</p>

            {addError && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', borderRadius: '6px', fontSize: '13px', marginBottom: '15px' }}>
                {addError}
              </div>
            )}

            <form onSubmit={handleAddUser}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>Full Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>Email Address</label>
                <input
                  required
                  type="email"
                  placeholder="e.g. rahul@aucommunity.com"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>Password</label>
                <input
                  required
                  type="password"
                  placeholder="Enter a secure password"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>Role</label>
                <select
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', boxSizing: 'border-box' }}
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-cancel" onClick={() => setIsAddModalOpen(false)} style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 20px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW/EDIT USER MODAL */}
      {isModalOpen && selectedUser && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="user-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>&times;</button>
            <div className="modal-avatar">
              {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <h2>{selectedUser.name}</h2>
            <p className="modal-email">{selectedUser.email}</p>

            <div className="modal-details">
              <div>
                <span>Role</span>
                <strong>{selectedUser.role}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{selectedUser.isVerified !== false ? 'Active' : 'Pending'}</strong>
              </div>
              <div>
                <span>Joined</span>
                <strong>{new Date(selectedUser.createdAt).toLocaleDateString()}</strong>
              </div>
            </div>

            <div style={{ textAlign: 'left', marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '8px', display: 'block' }}>Change Role</label>
              <select
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
                value={selectedUser.role}
                onChange={(e) => handleUpdateRole(selectedUser._id, e.target.value)}
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <button className="modal-action" onClick={closeModal}>Close Details</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;
