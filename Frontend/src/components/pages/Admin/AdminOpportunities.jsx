import React, { useState, useEffect } from 'react';
import API from '../../../api';
import '../../../styles/AdminStyle/AdminOpportunities.css';

function AdminOpportunities() {
  const [opportunities, setOpportunities] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    type: 'Internship',
    location: '',
    description: '',
    link: '',
    image: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [isLoading, setIsLoading] = useState(false);

  const fetchOpportunities = async () => {
    setIsLoading(true);
    try {
      const res = await API.get('/opportunities');
      setOpportunities(res.data.opportunities || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const handleImageUpload = (e) => {
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

  const handlePost = async (e) => {
    e.preventDefault();
    try {
      await API.post('/opportunities', formData);
      setShowForm(false);
      setFormData({
        title: '',
        company: '',
        type: 'Internship',
        location: '',
        description: '',
        link: '',
        image: ''
      });
      fetchOpportunities();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this opportunity?")) {
      try {
        await API.delete(`/opportunities/${id}`);
        fetchOpportunities();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const filteredOpps = opportunities.filter(opp => {
    const matchesSearch = opp.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          opp.company?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All' || opp.type === filterType;
    return matchesSearch && matchesType;
  });

  const totalOpps = opportunities.length;
  const totalJobs = opportunities.filter(o => o.type === 'Job').length;
  const totalInternships = opportunities.filter(o => o.type === 'Internship').length;
  const totalEvents = opportunities.filter(o => o.type === 'Event').length;

  return (
    <div className="opportunities-page">
      <div className="opps-header">
        <div>
          <h1>Opportunities & Jobs</h1>
          <p>Manage jobs, internships, and career placements for students</p>
        </div>
        <button className="btn-add-opp" onClick={() => setShowForm(true)}>
          <i className="fas fa-plus"></i> Post Opportunity
        </button>
      </div>

      <div className="opps-stats">
        <div className="opp-stat-card">
          <span className="stat-title">Total Opportunities</span>
          <h2 className="stat-value">{totalOpps}</h2>
        </div>
        <div className="opp-stat-card">
          <span className="stat-title">Jobs</span>
          <h2 className="stat-value">{totalJobs}</h2>
        </div>
        <div className="opp-stat-card">
          <span className="stat-title">Internships</span>
          <h2 className="stat-value">{totalInternships}</h2>
        </div>
        <div className="opp-stat-card">
          <span className="stat-title">Events</span>
          <h2 className="stat-value">{totalEvents}</h2>
        </div>
      </div>

      {showForm && (
        <div className="opp-modal-overlay">
          <div className="opp-form-card" style={{ maxWidth: '500px', width: '100%' }}>
            <h2><i className="fas fa-briefcase" style={{ color: '#ff5e00', marginRight: '8px' }}></i> Post New Opportunity</h2>
            <form onSubmit={handlePost}>
              <div className="opp-form-group">
                <label>Job / Internship Title</label>
                <input required placeholder="e.g. Software Engineer Intern" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
              </div>
              <div className="opp-form-group">
                <label>Company / Organization</label>
                <input required placeholder="e.g. Google / Microsoft" value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} />
              </div>
              <div className="opp-form-group">
                <label>Type</label>
                <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                  <option value="Internship">Internship</option>
                  <option value="Job">Job</option>
                  <option value="Event">Event</option>
                </select>
              </div>

              {/* LOCAL FILE STORAGE IMAGE UPLOAD */}
              <div className="opp-form-group">
                <label><i className="fas fa-image" style={{ marginRight: '6px', color: '#ff5e00' }}></i> Company Logo / Banner Image (From Computer)</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#f8fafc' }} 
                />
                {formData.image && (
                  <div style={{ marginTop: '10px', position: 'relative', borderRadius: '6px', overflow: 'hidden', border: '1px solid #e2e8f0', maxWidth: '200px' }}>
                    <img src={formData.image} alt="Preview" style={{ width: '100%', maxHeight: '120px', objectFit: 'cover' }} />
                    <button 
                      type="button" 
                      onClick={() => setFormData({ ...formData, image: '' })}
                      style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer' }}
                    >
                      &times;
                    </button>
                  </div>
                )}
              </div>

              <div className="opp-form-actions">
                <button type="button" className="btn-cancel-opp" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-save-opp">Publish Opportunity</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <div>
        <div className="opps-toolbar">
          <div className="opps-search">
            <i className="fas fa-search" style={{color: '#94a3b8'}}></i>
            <input 
              type="text" 
              placeholder="Search by title or company..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="opps-filters">
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="All">All Types</option>
              <option value="Internship">Internships</option>
              <option value="Job">Jobs</option>
              <option value="Event">Events</option>
            </select>
          </div>
        </div>
        
        <div className="opps-table-container">
          <table className="opps-table">
            <thead>
              <tr>
                <th>Opportunity</th>
                <th>Type</th>
                <th>Applications</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="5" style={{textAlign: 'center'}}>Loading opportunities...</td></tr>
              ) : filteredOpps.length > 0 ? (
                filteredOpps.map(opp => (
                  <tr key={opp._id}>
                    <td className="opp-title-cell">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {opp.image ? (
                          <img src={opp.image} alt={opp.company} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#ffedd5', color: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>
                            {opp.company ? opp.company.charAt(0).toUpperCase() : 'C'}
                          </div>
                        )}
                        <div>
                          <h4>{opp.title}</h4>
                          <p>{opp.company}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`type-tag type-${opp.type?.toLowerCase() || 'job'}`}>
                        {opp.type || 'Unknown'}
                      </span>
                    </td>
                    <td>{opp.applications || 0} applications</td>
                    <td><span className="status-active">Active</span></td>
                    <td>
                      <div className="opp-actions">
                        <button className="btn-del" title="Delete" onClick={() => handleDelete(opp._id)}>
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" style={{textAlign: 'center', padding: '30px', color: '#64748b'}}>No opportunities found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminOpportunities;
