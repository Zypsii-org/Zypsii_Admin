import React, { useState, useEffect } from 'react';
import { FaList, FaPlus, FaEdit, FaTrash, FaEye, FaMapMarkerAlt, FaCalendar, FaTags } from 'react-icons/fa';
import axios from 'axios';
import GuideForm from './GuideForm';
import DeleteConfirmModal from './DeleteConfirmModal';
import ToggleStatusModal from './ToggleStatusModal';
import './Guides.css';

const Guides = () => {
  const [activeView, setActiveView] = useState('list'); // 'list', 'form', or 'detail'
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [editingGuide, setEditingGuide] = useState(null);
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null); // Will store the guide ID being deleted
  const [toggleStatusLoading, setToggleStatusLoading] = useState(null); // Will store the guide ID being toggled
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [guideToDelete, setGuideToDelete] = useState(null);
  const [toggleStatusModalOpen, setToggleStatusModalOpen] = useState(false);
  const [guideToToggle, setGuideToToggle] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
    hasMore: false
  });

  useEffect(() => {
    if (activeView === 'list') {
      fetchGuides();
    }
  }, [activeView]);

  const fetchGuides = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the auth token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await axios.get(`${process.env.REACT_APP_API_URL}/featured-guides/user/listing?page=${page}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.status) {
        setGuides(response.data.data || []);
        setPagination(response.data.pagination || {
          currentPage: page,
          totalPages: 1,
          totalCount: 0,
          limit: 10,
          hasMore: false
        });
      } else {
        throw new Error(response.data.message || 'Failed to fetch guides');
      }
    } catch (error) {
      console.error('Error fetching guides:', error);
      setError(error.message || 'Failed to fetch guides');
      // For demo purposes, set some sample data
      setGuides([
        {
          id: 1,
          title: 'Complete Guide to Beach Adventures',
          category: 'Beach',
          description: 'Discover the best beaches and water activities for your next adventure.',
          image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400',
          tags: ['Beach', 'Adventure', 'Water Sports'],
          createdAt: '2024-01-15T10:00:00Z',
          place: { name: 'Maldives' },
          isActive: true
        },
        {
          id: 2,
          title: 'Mountain Trekking Essentials',
          category: 'Mountains',
          description: 'Everything you need to know about mountain trekking and safety.',
          image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400',
          tags: ['Mountains', 'Trekking', 'Safety'],
          createdAt: '2024-01-10T14:30:00Z',
          place: { name: 'Himalayas' },
          isActive: true
        },
        {
          id: 3,
          title: 'Cultural Heritage Sites Guide',
          category: 'Cultural Sites',
          description: 'Explore ancient temples and historical monuments around the world.',
          image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400',
          tags: ['Cultural', 'Historical', 'Temples'],
          createdAt: '2024-01-05T09:15:00Z',
          place: { name: 'Varanasi' },
          isActive: false
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleGuideClick = (guideId) => {
    const guide = guides.find(g => g.id === guideId);
    if (guide) {
      setSelectedGuide(guide);
      setActiveView('detail');
    }
  };

  const handleEdit = (guide) => {
    setEditingGuide(guide);
    setActiveView('form');
    setEditLoading(false);
  };

  const handleEditSuccess = (updatedGuide) => {
    // Update the guide in the local state
    setGuides(prev => prev.map(g => 
      g.id === updatedGuide.id ? updatedGuide : g
    ));
    
    // If we're editing from detail view, update the selected guide too
    if (selectedGuide && selectedGuide.id === updatedGuide.id) {
      setSelectedGuide(updatedGuide);
    }
    
    // Clear editing state and switch back to list view
    setEditingGuide(null);
    setActiveView('list');
    setEditLoading(false);
    
    // Show success message
    setError('Guide updated successfully!');
    setTimeout(() => setError(null), 3000);
  };

  const handleEditFromDetail = () => {
    setEditingGuide(selectedGuide);
    setActiveView('form');
    setEditLoading(false);
  };

  const handleBackToList = () => {
    setSelectedGuide(null);
    setActiveView('list');
  };

  const openDeleteModal = (guide) => {
    setGuideToDelete(guide);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setGuideToDelete(null);
  };

  const confirmDelete = async () => {
    if (!guideToDelete) return;

    try {
      setDeleteLoading(guideToDelete.id);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await axios.delete(`${process.env.REACT_APP_API_URL}/featured-guides/user/delete/${guideToDelete.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.status) {
        // Remove from local state
        setGuides(prev => prev.filter(guide => guide.id !== guideToDelete.id));
        
        // If we're in detail view and deleting the current guide, go back to list
        if (selectedGuide && selectedGuide.id === guideToDelete.id) {
          setSelectedGuide(null);
          setActiveView('list');
        }
        
        // Close modal and show success message
        closeDeleteModal();
        setSuccessMessage('Guide deleted successfully!');
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setSuccessMessage('');
        }, 3000);
      } else {
        throw new Error(response.data.message || 'Failed to delete guide');
      }
    } catch (error) {
      let errorMessage = 'Failed to delete guide';
      
      if (error.response) {
        // Handle API error responses
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
        
        // Handle specific HTTP status codes
        if (error.response.status === 404) {
          errorMessage = 'Guide not found';
        } else if (error.response.status === 400) {
          errorMessage = 'Invalid guide ID';
        } else if (error.response.status === 500) {
          errorMessage = 'Server error occurred while deleting guide';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      console.error('Error deleting guide:', error);
    } finally {
      setDeleteLoading(null);
    }
  };

  const openToggleStatusModal = (guide) => {
    setGuideToToggle(guide);
    setToggleStatusModalOpen(true);
  };

  const closeToggleStatusModal = () => {
    setToggleStatusModalOpen(false);
    setGuideToToggle(null);
  };

  const confirmToggleStatus = async () => {
    if (!guideToToggle) return;

    try {
      setToggleStatusLoading(guideToToggle.id);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await axios.put(`${process.env.REACT_APP_API_URL}/featured-guides/user/activate-inactive/${guideToToggle.id}`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.status) {
        // Update local state
        const newStatus = !guideToToggle.isActive;
        setGuides(prev => prev.map(guide => 
          guide.id === guideToToggle.id 
            ? { ...guide, isActive: newStatus }
            : guide
        ));
        
        // If we're in detail view and updating the current guide, update selectedGuide too
        if (selectedGuide && selectedGuide.id === guideToToggle.id) {
          setSelectedGuide(prev => ({ ...prev, isActive: newStatus }));
        }
        
        // Close modal and show success message
        closeToggleStatusModal();
        setSuccessMessage(`Guide ${newStatus ? 'activated' : 'deactivated'} successfully!`);
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setSuccessMessage('');
        }, 3000);
      } else {
        throw new Error(response.data.message || 'Failed to update guide status');
      }
    } catch (error) {
      let errorMessage = 'Failed to update guide status';
      
      if (error.response) {
        // Handle API error responses
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
        
        // Handle specific HTTP status codes
        if (error.response.status === 404) {
          errorMessage = 'Guide not found';
        } else if (error.response.status === 400) {
          errorMessage = 'Invalid request';
        } else if (error.response.status === 500) {
          errorMessage = 'Server error occurred while updating guide status';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      console.error('Error updating guide status:', error);
    } finally {
      setToggleStatusLoading(null);
    }
  };



  const renderGuidesList = () => {
    if (loading) {
      return (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading guides...</p>
        </div>
      );
    }

    if (error && error !== 'Guide deleted successfully') {
      return (
        <div className="error-message">
          <p>{error}</p>
        </div>
      );
    }

    if (!guides.length) {
      return (
        <div className="no-guides">
          <p>No guides found. Create your first guide!</p>
        </div>
      );
    }

    return (
      <>
        <div className="guides-grid">
          {guides.map((guide) => (
            <div 
              key={guide.id} 
              className={`guide-card ${!guide.isActive ? 'inactive' : ''} ${deleteLoading === guide.id ? 'deleting' : ''} ${toggleStatusLoading === guide.id ? 'updating' : ''}`}
              onClick={() => handleGuideClick(guide.id)}
              style={{ cursor: (deleteLoading === guide.id || toggleStatusLoading === guide.id) ? 'not-allowed' : 'pointer' }}
            >
              <div className="guide-image-container">
                <img 
                  src={guide.image} 
                  alt={guide.title} 
                  className="guide-image"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/400x200?text=Guide+Image';
                  }}
                />
                <div className="guide-status">
                  <span className={`status-badge ${guide.isActive ? 'active' : 'inactive'}`}>
                    {guide.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {deleteLoading === guide.id && (
                  <div className="card-deleting-overlay">
                    <div className="deleting-spinner"></div>
                  </div>
                )}
              </div>
              
              <div className="guide-content">
                <h3 className="guide-title">{guide.title}</h3>
                
                <div className="guide-category">
                  <FaMapMarkerAlt />
                  <span>{guide.category}</span>
                </div>
                
                <div className="guide-description" 
                     dangerouslySetInnerHTML={{ __html: guide.description.substring(0, 100) + '...' }} />
                
                <div className="guide-meta">
                  <div className="guide-date">
                    <FaCalendar />
                    <span>{new Date(guide.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="guide-place">
                    <FaMapMarkerAlt />
                    <span>{guide.place?.name || 'Unknown Location'}</span>
                  </div>
                </div>
                
                <div className="guide-tags">
                  <FaTags />
                  {guide.tags.slice(0, 3).map((tag, index) => (
                    <span key={index} className="tag">{tag}</span>
                  ))}
                  {guide.tags.length > 3 && (
                    <span className="tag-more">+{guide.tags.length - 3} more</span>
                  )}
                </div>
                
                <div className="guide-actions">
                  <button 
                    className="btn btn-edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(guide);
                    }}
                    disabled={(editLoading && editingGuide?.id === guide.id) || deleteLoading === guide.id || toggleStatusLoading === guide.id}
                  >
                    <FaEdit /> {editLoading && editingGuide?.id === guide.id ? 'Loading...' : 'Edit'}
                  </button>
                  <button 
                    className="btn btn-toggle"
                    onClick={(e) => {
                      e.stopPropagation();
                      openToggleStatusModal(guide);
                    }}
                    disabled={deleteLoading === guide.id || toggleStatusLoading === guide.id}
                  >
                    {toggleStatusLoading === guide.id ? 'Updating...' : (guide.isActive ? 'Deactivate' : 'Activate')}
                  </button>
                  <button 
                    className="btn btn-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDeleteModal(guide);
                    }}
                    disabled={deleteLoading === guide.id}
                  >
                    <FaTrash /> {deleteLoading === guide.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {pagination.totalPages > 1 && (
          <div className="pagination">
            {Array.from({ length: pagination.totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => fetchGuides(i + 1)}
                className={`page-button ${pagination.currentPage === i + 1 ? 'active' : ''}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </>
    );
  };

  const renderGuideDetail = () => {
    if (!selectedGuide) return null;

    return (
      <div className="guide-detail-container">
        {deleteLoading === selectedGuide.id && (
          <div className="detail-loading-overlay">
            <div className="loading-content">
              <div className="spinner"></div>
              <p>Deleting guide...</p>
            </div>
          </div>
        )}
        <div className="detail-header">
          <button
            className="btn btn-secondary"
            onClick={handleBackToList}
            disabled={deleteLoading === selectedGuide.id || toggleStatusLoading === selectedGuide.id}
          >
            ← Back to List
          </button>

          <div className="detail-actions">
            <button
              className="btn btn-edit"
              onClick={handleEditFromDetail}
              disabled={editLoading || deleteLoading === selectedGuide.id || toggleStatusLoading === selectedGuide.id}
            >
              <FaEdit /> {editLoading ? 'Loading...' : 'Edit Guide'}
            </button>
            <button
              className="btn btn-toggle"
              onClick={() => openToggleStatusModal(selectedGuide)}
              disabled={deleteLoading === selectedGuide.id || toggleStatusLoading === selectedGuide.id}
            >
              {toggleStatusLoading === selectedGuide.id ? 'Updating...' : (selectedGuide.isActive ? 'Deactivate' : 'Activate')}
            </button>
            <button
              className="btn btn-delete"
              onClick={() => openDeleteModal(selectedGuide)}
              disabled={deleteLoading === selectedGuide.id || toggleStatusLoading === selectedGuide.id}
            >
              <FaTrash /> {deleteLoading === selectedGuide.id ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>

        <div className="detail-content">
          {/* Basic Information */}
          <div className="detail-section">
            <div className="detail-title">
              <h1>{selectedGuide.title}</h1>
              <div className="detail-status">
                <span className={`status-badge ${selectedGuide.isActive ? 'active' : 'inactive'}`}>
                  {selectedGuide.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div className="detail-meta">
              <div className="meta-item">
                <FaMapMarkerAlt />
                <span>{selectedGuide.category}</span>
              </div>
              <div className="meta-item">
                <FaCalendar />
                <span>{new Date(selectedGuide.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="meta-item">
                <FaMapMarkerAlt />
                <span>{selectedGuide.place?.name || 'Unknown Location'}</span>
              </div>
            </div>

            <div className="detail-description">
              <p dangerouslySetInnerHTML={{ __html: selectedGuide.description }} />
            </div>
          </div>

          {/* Guide Image */}
          {selectedGuide.image && (
            <div className="detail-section">
              <h3>📸 Guide Image</h3>
              <div className="guide-image-detail">
                <img
                  src={selectedGuide.image}
                  alt={selectedGuide.title}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/800x400?text=Guide+Image';
                  }}
                />
              </div>
            </div>
          )}

          {/* Tags */}
          {selectedGuide.tags && selectedGuide.tags.length > 0 && (
            <div className="detail-section">
              <h3>🏷️ Tags</h3>
              <div className="tags-grid">
                {selectedGuide.tags.map((tag, index) => (
                  <span key={index} className="tag-badge">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Additional Information */}
          <div className="detail-section">
            <h3>ℹ️ Additional Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <strong>Guide ID:</strong>
                <span>{selectedGuide.id}</span>
              </div>
              <div className="info-item">
                <strong>Category:</strong>
                <span>{selectedGuide.category}</span>
              </div>
              <div className="info-item">
                <strong>Location:</strong>
                <span>{selectedGuide.place?.name || 'Not specified'}</span>
              </div>
              <div className="info-item">
                <strong>Created:</strong>
                <span>{new Date(selectedGuide.createdAt).toLocaleString()}</span>
              </div>
              <div className="info-item">
                <strong>Status:</strong>
                <span className={`status-text ${selectedGuide.isActive ? 'active' : 'inactive'}`}>
                  {selectedGuide.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="guides-container">
      <div className="guides-header">
        <h1>Guides Management</h1>
        <p>Manage your travel guides and featured content</p>
      </div>

      {/* Navigation Tabs */}
      <div className="guides-nav">
        <button 
          className={`nav-tab ${activeView === 'list' ? 'active' : ''}`}
          onClick={() => setActiveView('list')}
        >
          <FaList /> View Guides
        </button>
        <button 
          className={`nav-tab ${activeView === 'form' ? 'active' : ''}`}
          onClick={() => setActiveView('form')}
          disabled={editLoading}
        >
          <FaPlus /> {editingGuide ? (editLoading ? 'Editing...' : 'Edit Guide') : 'Create Guide'}
        </button>
        {selectedGuide && (
          <button 
            className={`nav-tab ${activeView === 'detail' ? 'active' : ''}`}
            onClick={() => setActiveView('detail')}
          >
            <FaEye /> Guide Details
          </button>
        )}
      </div>

      {/* Content */}
      {activeView === 'list' ? (
        <>
          {error && (
            <div className="alert alert-error">
              <p>{error}</p>
            </div>
          )}
          {success && (
            <div className="alert alert-success">
              <p>{successMessage}</p>
            </div>
          )}
          {renderGuidesList()}
        </>
      ) : activeView === 'detail' ? (
        renderGuideDetail()
      ) : (
        <GuideForm 
          guide={editingGuide}
          onSuccess={handleEditSuccess}
          onCancel={() => {
            setActiveView('list');
            setEditingGuide(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        guideTitle={guideToDelete?.title || ''}
        loading={deleteLoading !== null}
      />

      {/* Toggle Status Confirmation Modal */}
      <ToggleStatusModal
        isOpen={toggleStatusModalOpen}
        onClose={closeToggleStatusModal}
        onConfirm={confirmToggleStatus}
        guideTitle={guideToToggle?.title || ''}
        currentStatus={guideToToggle?.isActive || false}
        loading={toggleStatusLoading !== null}
      />
    </div>
  );
};

export default Guides;
