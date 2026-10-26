import React, { useState, useEffect } from 'react';
import API from '../../../api';
import ExpandableText from '../../common/ExpandableText';
import '../../../styles/AdminStyle/AdminEvents.css';

function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Cultural',
    eventDate: '',
    eventTime: '',
    location: 'AU Campus Ground',
    organizer: 'AU Student Council',
    image: '',
    description: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState('All');

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const res = await API.get('/events');
      setEvents(res.data.events || []);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleMediaUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        image: reader.result
      }));
    };
    reader.readAsDataURL(file);
  };

  const isVideoFile = (mediaUrl) => {
    if (!mediaUrl) return false;
    return mediaUrl.startsWith('data:video') || mediaUrl.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i);
  };

  const handlePost = async (e) => {
    e.preventDefault();
    try {
      await API.post('/events', formData);
      setShowForm(false);
      setFormData({
        title: '',
        category: 'Cultural',
        eventDate: '',
        eventTime: '',
        location: 'AU Campus Ground',
        organizer: 'AU Student Council',
        image: '',
        description: ''
      });
      fetchEvents();
    } catch (err) {
      console.error('Error posting event:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await API.delete(`/events/${id}`);
        fetchEvents();
      } catch (err) {
        console.error('Error deleting event:', err);
      }
    }
  };

  const filteredEvents = filterCategory === 'All' 
    ? events 
    : events.filter(e => e.category === filterCategory);

  const categoryIcons = {
    Dandiya: 'fa-music',
    Tournament: 'fa-trophy',
    Hackathon: 'fa-laptop-code',
    Cultural: 'fa-theater-masks',
    Sports: 'fa-futbol',
    Tech: 'fa-microchip',
    Workshop: 'fa-chalkboard-teacher',
    General: 'fa-calendar-alt'
  };

  return (
    <div className="events-page">
      <div className="evt-header">
        <div>
          <h1>Events & Campus Activities</h1>
          <p>Create & manage Dandiya nights, Tournaments, Hackathons, Fests and sports events</p>
        </div>
        <button className="btn-new-evt" onClick={() => setShowForm(true)}>
          <i className="fas fa-plus-circle"></i> Create New Event
        </button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {['All', 'Dandiya', 'Tournament', 'Hackathon', 'Cultural', 'Sports', 'Tech', 'Workshop'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              border: '1px solid #cbd5e1',
              background: filterCategory === cat ? '#10b981' : '#ffffff',
              color: filterCategory === cat ? '#ffffff' : '#475569',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="evt-modal-overlay">
          <div className="evt-form-card">
            <h2><i className="fas fa-calendar-plus" style={{ color: '#10b981' }}></i> Add Campus Event</h2>
            <form onSubmit={handlePost}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="evt-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Event Name / Title</label>
                  <input 
                    required 
                    placeholder="e.g. Navratri Dandiya Night 2026 / AU Hackathon '26" 
                    value={formData.title} 
                    onChange={e => setFormData({ ...formData, title: e.target.value })} 
                  />
                </div>

                <div className="evt-form-group">
                  <label>Category / Type</label>
                  <select 
                    value={formData.category} 
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="Dandiya">Dandiya Night</option>
                    <option value="Tournament">Sports Tournament</option>
                    <option value="Hackathon">Hackathon</option>
                    <option value="Cultural">Cultural Fest</option>
                    <option value="Sports">Sports Event</option>
                    <option value="Tech">Tech Event</option>
                    <option value="Workshop">Workshop</option>
                    <option value="General">General Event</option>
                  </select>
                </div>

                <div className="evt-form-group">
                  <label>Organizer</label>
                  <input 
                    placeholder="e.g. Cultural Club / CS Dept" 
                    value={formData.organizer} 
                    onChange={e => setFormData({ ...formData, organizer: e.target.value })} 
                  />
                </div>

                <div className="evt-form-group">
                  <label>Event Date</label>
                  <input 
                    type="date"
                    required
                    value={formData.eventDate} 
                    onChange={e => setFormData({ ...formData, eventDate: e.target.value })} 
                  />
                </div>

                <div className="evt-form-group">
                  <label>Event Time</label>
                  <input 
                    type="time"
                    value={formData.eventTime} 
                    onChange={e => setFormData({ ...formData, eventTime: e.target.value })} 
                  />
                </div>

                <div className="evt-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Venue / Location</label>
                  <input 
                    required
                    placeholder="e.g. AU Main Basketball Court / Auditorium" 
                    value={formData.location} 
                    onChange={e => setFormData({ ...formData, location: e.target.value })} 
                  />
                </div>

                {/* LOCAL FILE UPLOAD (IMAGE OR VIDEO) */}
                <div className="evt-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label><i className="fas fa-paperclip" style={{ marginRight: '6px', color: '#10b981' }}></i> Upload Event Image or Video (From Computer)</label>
                  <input 
                    type="file" 
                    accept="image/*,video/*" 
                    onChange={handleMediaUpload} 
                    style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#f8fafc' }} 
                  />
                  {formData.image && (
                    <div style={{ marginTop: '10px', position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', maxWidth: '100%', background: '#0f172a', display: 'flex', justifyContent: 'center' }}>
                      {isVideoFile(formData.image) ? (
                        <video controls src={formData.image} style={{ width: '100%', maxHeight: '200px', objectFit: 'contain' }} />
                      ) : (
                        <img src={formData.image} alt="Preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain' }} />
                      )}
                      <button 
                        type="button" 
                        onClick={() => setFormData({ ...formData, image: '' })}
                        style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer' }}
                      >
                        &times;
                      </button>
                    </div>
                  )}
                </div>

                <div className="evt-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Description & Guidelines</label>
                  <textarea 
                    required 
                    placeholder="Enter event details, rules, eligibility, prizes, dress code, etc." 
                    value={formData.description} 
                    onChange={e => setFormData({ ...formData, description: e.target.value })} 
                  />
                </div>
              </div>

              <div className="evt-form-actions">
                <button type="button" className="btn-cancel-evt" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-save-evt">Publish Event</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <div className="evt-grid">
        {isLoading ? (
          <div style={{ padding: '40px', color: '#10b981', gridColumn: '1 / -1', textAlign: 'center' }}>
            <i className="fas fa-spinner fa-spin" style={{marginRight: '10px'}}></i> Loading events...
          </div>
        ) : filteredEvents.length > 0 ? (
          filteredEvents.map(evt => (
            <div className="evt-card" key={evt._id}>
              {evt.image && (
                <div style={{ width: '100%', maxHeight: '240px', borderRadius: '8px', overflow: 'hidden', marginBottom: '14px', background: '#0f172a', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {isVideoFile(evt.image) ? (
                    <video controls src={evt.image} style={{ width: '100%', maxHeight: '240px', objectFit: 'contain' }} />
                  ) : (
                    <img src={evt.image} alt={evt.title} style={{ width: '100%', maxHeight: '240px', objectFit: 'contain' }} />
                  )}
                </div>
              )}
              <div className="evt-card-header">
                <div>
                  <h3 className="evt-title">{evt.title}</h3>
                  <span className="evt-badge">
                    <i className={`fas ${categoryIcons[evt.category] || 'fa-tag'}`} style={{marginRight: '6px'}}></i> 
                    {evt.category}
                  </span>
                </div>
              </div>
              
              <div className="evt-content" style={{ display: 'block', overflow: 'visible' }}>
                <ExpandableText text={evt.description || "No description provided."} linesLimit={3} charLimit={160} />
              </div>

              <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '15px' }}>
                <div><i className="far fa-calendar" style={{ width: '18px', color: '#10b981' }}></i> <strong>Date:</strong> {evt.eventDate || 'TBA'} {evt.eventTime ? `at ${evt.eventTime}` : ''}</div>
                <div><i className="fas fa-map-marker-alt" style={{ width: '18px', color: '#ef4444' }}></i> <strong>Venue:</strong> {evt.location || 'AU Campus'}</div>
                <div><i className="fas fa-user-friends" style={{ width: '18px', color: '#6366f1' }}></i> <strong>Organizer:</strong> {evt.organizer || 'AU Community'}</div>
              </div>
              
              <div className="evt-footer">
                <div className="evt-date">
                  <i className="fas fa-users"></i> {evt.rsvps?.length || 0} Interested
                </div>
                <button className="btn-del-evt" title="Delete Event" onClick={() => handleDelete(evt._id)}>
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: '40px', color: '#64748b', gridColumn: '1 / -1', textAlign: 'center', background: 'white', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
            <i className="fas fa-calendar-times" style={{fontSize: '32px', color: '#cbd5e1', marginBottom: '15px', display: 'block'}}></i>
            No {filterCategory === 'All' ? '' : filterCategory} events found. Click "Create New Event" to publish one!
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminEvents;
