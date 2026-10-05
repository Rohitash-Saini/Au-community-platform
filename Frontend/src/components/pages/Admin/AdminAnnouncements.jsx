import React, { useState, useEffect } from 'react';
import API from '../../../api';
import '../../../styles/AdminStyle/AdminAnnouncements.css';

function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', publishedTo: 'All Students', content: '' });
  const [isLoading, setIsLoading] = useState(false);

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      const res = await API.get('/announcements');
      setAnnouncements(res.data.announcements || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handlePost = async (e) => {
    e.preventDefault();
    try {
      await API.post('/announcements', formData);
      setShowForm(false);
      setFormData({ title: '', publishedTo: 'All Students', content: '' });
      fetchAnnouncements();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this announcement?")) {
      try {
        await API.delete(`/announcements/${id}`);
        fetchAnnouncements();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="announcements-page">
      <div className="ann-header">
        <div>
          <h1>Announcements</h1>
          <p>Broadcast important messages to the university community</p>
        </div>
        <button className="btn-new-ann" onClick={() => setShowForm(true)}>
          <i className="fas fa-bullhorn"></i> New Announcement
        </button>
      </div>

      {showForm && (
        <div className="ann-modal-overlay">
          <div className="ann-form-card">
            <h2><i className="fas fa-bullhorn"></i> Create Announcement</h2>
            <form onSubmit={handlePost}>
              <div className="ann-form-group">
                <label>Announcement Title</label>
                <input 
                  required 
                  placeholder="e.g. Campus closed tomorrow due to weather" 
                  value={formData.title} 
                  onChange={e => setFormData({ ...formData, title: e.target.value })} 
                />
              </div>
              <div className="ann-form-group">
                <label>Target Audience</label>
                <select 
                  value={formData.publishedTo} 
                  onChange={e => setFormData({ ...formData, publishedTo: e.target.value })}
                >
                  <option value="All Users">All Users (Students & Faculty)</option>
                  <option value="All Students">All Students</option>
                  <option value="Faculty Only">Faculty Only</option>
                </select>
              </div>
              <div className="ann-form-group">
                <label>Message Content</label>
                <textarea 
                  required 
                  placeholder="Enter the full details of your announcement here..." 
                  value={formData.content} 
                  onChange={e => setFormData({ ...formData, content: e.target.value })} 
                />
              </div>
              <div className="ann-form-actions">
                <button type="button" className="btn-cancel-ann" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-save-ann">Publish Now</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <div className="ann-grid">
        {isLoading ? (
          <div style={{ padding: '40px', color: '#6366f1', gridColumn: '1 / -1', textAlign: 'center' }}>
            <i className="fas fa-spinner fa-spin" style={{marginRight: '10px'}}></i> Loading announcements...
          </div>
        ) : announcements.length > 0 ? (
          announcements.map(ann => (
            <div className="ann-card" key={ann._id}>
              <div className="ann-card-header">
                <div>
                  <h3 className="ann-title">{ann.title}</h3>
                  <span className="ann-target"><i className="fas fa-users" style={{marginRight: '4px'}}></i> {ann.publishedTo}</span>
                </div>
              </div>
              
              <div className="ann-content">
                {ann.content || "No content provided for this announcement."}
              </div>
              
              <div className="ann-footer">
                <div className="ann-date">
                  <i className="far fa-clock"></i> {new Date(ann.createdAt).toLocaleString()}
                </div>
                <button className="btn-del-ann" title="Delete Announcement" onClick={() => handleDelete(ann._id)}>
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: '40px', color: '#6b7280', gridColumn: '1 / -1', textAlign: 'center', background: 'white', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
            <i className="fas fa-bullhorn" style={{fontSize: '32px', color: '#e2e8f0', marginBottom: '15px', display: 'block'}}></i>
            No announcements found. Click "New Announcement" to create one.
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminAnnouncements;
