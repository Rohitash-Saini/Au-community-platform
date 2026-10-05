import React, { useState, useEffect } from 'react';
import API from '../../../api';
import '../../../styles/AdminStyle/AdminPosts.css';

function AdminPosts() {
  const [posts, setPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterSort, setFilterSort] = useState('recent');
  const [selectedPost, setSelectedPost] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [newPostData, setNewPostData] = useState({
    content: '',
    category: 'General',
    image: '', // Can store Image or Video base64 string
    isVideo: false
  });

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const res = await API.get('/admin/posts');
      setPosts(res.data.posts || []);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleMediaUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    const isVid = file.type.startsWith('video');

    reader.onloadend = () => {
      setNewPostData(prev => ({
        ...prev,
        image: reader.result,
        isVideo: isVid
      }));
    };

    reader.readAsDataURL(file);
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      await API.post('/posts', {
        content: newPostData.content,
        category: newPostData.category,
        image: newPostData.image
      });
      setIsCreateModalOpen(false);
      setNewPostData({ content: '', category: 'General', image: '', isVideo: false });
      fetchPosts();
    } catch (err) {
      console.error('Error creating post:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        await API.delete(`/admin/posts/${id}`);
        fetchPosts();
        setIsModalOpen(false);
      } catch (err) {
        console.error('Error deleting post:', err);
      }
    }
  };

  const openPostModal = (post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
  };

  const isVideoFile = (mediaUrl) => {
    if (!mediaUrl) return false;
    return mediaUrl.startsWith('data:video') || mediaUrl.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i);
  };

  // Filter and Sort
  let filteredPosts = posts.filter((post) => {
    const matchesSearch = 
      post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.author?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'All' || post.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  if (filterSort === 'recent') {
    filteredPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (filterSort === 'liked') {
    filteredPosts.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
  } else if (filterSort === 'commented') {
    filteredPosts.sort((a, b) => (b.comments?.length || 0) - (a.comments?.length || 0));
  }

  const totalPosts = posts.length;
  const totalLikes = posts.reduce((sum, post) => sum + (post.likes?.length || 0), 0);
  const totalComments = posts.reduce((sum, post) => sum + (post.comments?.length || 0), 0);

  const categoryColors = {
    Discussion: '#3b82f6',
    Question: '#8b5cf6',
    Achievement: '#10b981',
    Project: '#f59e0b',
    General: '#6b7280'
  };

  return (
    <div className="posts-page">
      <div className="posts-header">
        <div>
          <h1>Manage Community Posts</h1>
          <p>Monitor student discussions, Q&A, achievements, and project showcases</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          style={{
            padding: '10px 18px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 6px rgba(59, 130, 246, 0.2)'
          }}
        >
          <i className="fas fa-plus"></i> Create Post
        </button>
      </div>

      <div className="posts-stats">
        <div className="post-stat-card">
          <div className="post-stat-icon icon-blue">
            <i className="fas fa-file-alt"></i>
          </div>
          <div>
            <span>Total Posts</span>
            <h2>{totalPosts}</h2>
          </div>
        </div>
        <div className="post-stat-card">
          <div className="post-stat-icon icon-orange">
            <i className="fas fa-heart"></i>
          </div>
          <div>
            <span>Total Likes</span>
            <h2>{totalLikes}</h2>
          </div>
        </div>
        <div className="post-stat-card">
          <div className="post-stat-icon icon-purple">
            <i className="fas fa-comments"></i>
          </div>
          <div>
            <span>Total Comments</span>
            <h2>{totalComments}</h2>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {['All', 'Discussion', 'Question', 'Achievement', 'Project', 'General'].map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              border: '1px solid #d1d5db',
              background: filterCategory === cat ? '#3b82f6' : '#ffffff',
              color: filterCategory === cat ? '#ffffff' : '#374151',
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

      <div className="posts-card">
        <div className="posts-toolbar">
          <div className="posts-search">
            <i className="fas fa-search" style={{color: '#9ca3af'}}></i>
            <input 
              type="text" 
              placeholder="Search posts, category, or author..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="posts-filter">
            <select value={filterSort} onChange={(e) => setFilterSort(e.target.value)}>
              <option value="recent">Most Recent</option>
              <option value="liked">Most Liked</option>
              <option value="commented">Most Commented</option>
            </select>
          </div>
        </div>
        
        <div className="post-list">
          {isLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
              <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i> Loading posts...
            </div>
          ) : filteredPosts.length > 0 ? (
            filteredPosts.map(post => (
              <div className="post-item" key={post._id}>
                <div className="post-content-area">
                  <div className="post-author">
                    <div className="post-author-img">
                      {post.author?.name ? post.author.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="post-author-name">{post.author?.name || 'Unknown Author'}</span>
                        <span style={{ 
                          fontSize: '11px', 
                          background: categoryColors[post.category] ? `${categoryColors[post.category]}20` : '#f3f4f6', 
                          color: categoryColors[post.category] || '#4b5563', 
                          padding: '2px 8px', 
                          borderRadius: '10px', 
                          fontWeight: '600' 
                        }}>
                          {post.category || 'General'}
                        </span>
                      </div>
                      <div className="post-date">{new Date(post.createdAt).toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="post-text">{post.content || "No content"}</div>

                  {post.image && (
                    <div style={{ margin: '8px 0', maxWidth: '300px', borderRadius: '8px', overflow: 'hidden' }}>
                      {isVideoFile(post.image) ? (
                        <video controls src={post.image} style={{ width: '100%', borderRadius: '8px', maxHeight: '200px' }} />
                      ) : (
                        <img src={post.image} alt="Attachment" style={{ width: '100%', display: 'block', maxHeight: '200px', objectFit: 'cover' }} />
                      )}
                    </div>
                  )}

                  <div className="post-meta">
                    <span><i className="fas fa-heart" style={{ color: '#ef4444' }}></i> {post.likes?.length || 0} Likes</span>
                    <span><i className="fas fa-comment" style={{ color: '#3b82f6' }}></i> {post.comments?.length || 0} Comments</span>
                  </div>
                </div>

                <div className="post-actions">
                  <button className="btn-view" title="View Post" onClick={() => openPostModal(post)}>
                    <i className="fas fa-eye"></i>
                  </button>
                  <button className="btn-delete" title="Delete Post" onClick={() => handleDelete(post._id)}>
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            ))
          ) : (
             <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
               No {filterCategory === 'All' ? '' : filterCategory} posts found matching your criteria.
             </div>
          )}
        </div>
      </div>

      {/* CREATE POST MODAL */}
      {isCreateModalOpen && (
        <div className="post-modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="post-modal" onClick={(e) => e.stopPropagation()}>
            <div className="post-modal-header">
              <h2><i className="fas fa-edit" style={{ color: '#3b82f6', marginRight: '8px' }}></i> Create Community Post</h2>
              <button className="post-modal-close" onClick={() => setIsCreateModalOpen(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleCreatePost}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Category</label>
                <select 
                  value={newPostData.category}
                  onChange={(e) => setNewPostData({ ...newPostData, category: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', outline: 'none' }}
                >
                  <option value="Discussion">Discussion</option>
                  <option value="Question">Question / Q&A</option>
                  <option value="Achievement">Achievement</option>
                  <option value="Project">Project Showcase</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Post Content</label>
                <textarea 
                  required
                  rows="4"
                  placeholder="What would you like to share with the community?"
                  value={newPostData.content}
                  onChange={(e) => setNewPostData({ ...newPostData, content: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', outline: 'none', resize: 'vertical' }}
                />
              </div>

              {/* LOCAL FILE STORAGE UPLOAD (IMAGE OR VIDEO) */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                  <i className="fas fa-paperclip" style={{ marginRight: '6px', color: '#3b82f6' }}></i>
                  Upload Image or Video (From Computer)
                </label>
                <input 
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleMediaUpload}
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', background: '#f9fafb' }}
                />

                {/* MEDIA PREVIEW */}
                {newPostData.image && (
                  <div style={{ marginTop: '10px', position: 'relative', maxWidth: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                    {newPostData.isVideo ? (
                      <video controls src={newPostData.image} style={{ width: '100%', maxHeight: '200px' }} />
                    ) : (
                      <img src={newPostData.image} alt="Preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover' }} />
                    )}
                    <button 
                      type="button" 
                      onClick={() => setNewPostData({ ...newPostData, image: '', isVideo: false })}
                      style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer' }}
                    >
                      &times;
                    </button>
                  </div>
                )}
              </div>

              <div className="post-modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
                <button type="submit" style={{ padding: '8px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                  Publish Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW POST DETAILS MODAL */}
      {isModalOpen && selectedPost && (
        <div className="post-modal-overlay" onClick={closeModal}>
          <div className="post-modal" onClick={(e) => e.stopPropagation()}>
            <div className="post-modal-header">
              <h2>Post Details</h2>
              <button className="post-modal-close" onClick={closeModal}>&times;</button>
            </div>
            
            <div className="post-author" style={{marginBottom: '15px'}}>
              <div className="post-author-img">
                {selectedPost.author?.name ? selectedPost.author.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="post-author-name">{selectedPost.author?.name || 'Unknown Author'}</span>
                  <span style={{ fontSize: '11px', background: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: '10px', fontWeight: '600' }}>
                    {selectedPost.category || 'General'}
                  </span>
                </div>
                <div className="post-date">{new Date(selectedPost.createdAt).toLocaleString()}</div>
              </div>
            </div>
            
            <div className="post-modal-content">
              {selectedPost.content}
            </div>
            
            {selectedPost.image && (
              <div style={{marginBottom: '15px'}}>
                {isVideoFile(selectedPost.image) ? (
                  <video controls src={selectedPost.image} style={{ maxWidth: '100%', borderRadius: '8px' }} />
                ) : (
                  <img src={selectedPost.image} alt="Post Attachment" style={{maxWidth: '100%', borderRadius: '8px'}} />
                )}
              </div>
            )}
            
            <div className="post-meta" style={{marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #e5e7eb'}}>
              <span><i className="fas fa-heart" style={{ color: '#ef4444' }}></i> {selectedPost.likes?.length || 0} Likes</span>
              <span><i className="fas fa-comment" style={{ color: '#3b82f6' }}></i> {selectedPost.comments?.length || 0} Comments</span>
            </div>
            
            <div className="post-modal-footer">
              <button className="btn-cancel" onClick={closeModal}>Close</button>
              <button className="btn-danger" onClick={() => handleDelete(selectedPost._id)}>Delete Post</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPosts;
