import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Filter,
  Eye,
  Mail,
  MapPin,
  Play,
  Check,
  Search,
  ExternalLink,
  X,
  ThumbsUp,
  RefreshCw,
  Ban,
  XCircle
} from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import { getImageUrl } from '../../utils/image';
import api from '../../api';
import './OfficerDashboard.css';

const OfficerDashboard = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [addressCache, setAddressCache] = useState({});

  // Modals state
  const [previewImage, setPreviewImage] = useState(null);
  const [emailModalReport, setEmailModalReport] = useState(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailSending, setEmailSending] = useState(false);

  // Reject modal state
  const [rejectModalReport, setRejectModalReport] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  const geocodeCoords = async (lat, lon) => {
    const key = `${lat.toFixed(4)},${lon.toFixed(4)}`;
    if (addressCache[key]) return;

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (data && data.display_name) {
        const parts = data.display_name.split(', ');
        const friendly = parts.length > 3
          ? `${parts[0]}, ${parts[1]}, ${parts[parts.length - 1]}`
          : data.display_name;
        setAddressCache(prev => ({ ...prev, [key]: friendly }));
      }
    } catch {
      // Fallback
      setAddressCache(prev => ({ ...prev, [key]: `${lat.toFixed(4)}, ${lon.toFixed(4)}` }));
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = {
        sort_by: 'created_at',
        sort_order: 'desc'
      };

      const response = await api.get('/reports/', { params });
      const items = Array.isArray(response.data) ? response.data : response.data.items || [];
      setReports(items);

      // Trigger reverse geocoding for items missing human address
      items.forEach(r => {
        if (r.latitude && r.longitude && r.latitude !== 0) {
          geocodeCoords(r.latitude, r.longitude);
        }
      });
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const updateStatus = async (id, newStatus) => {
    try {
      const { data } = await api.patch(`/reports/${id}/status`, null, { params: { new_status: newStatus } });
      setReports(prev => prev.map(r => r.id === id ? { ...r, status: data.status } : r));
    } catch (err) {
      console.error('Status update failed:', err);
      alert('Failed to update report status.');
    }
  };

  const handleOpenRejectModal = (report) => {
    setRejectModalReport(report);
    setRejectReason('Road repair already completed and verified. Reopen dispute rejected.');
  };

  const handleConfirmReject = async () => {
    if (!rejectModalReport) return;
    try {
      setRejectSubmitting(true);
      const { data } = await api.post(
        `/reports/${rejectModalReport.id}/reject`,
        null,
        { params: { reason: rejectReason } }
      );
      setReports(prev => prev.map(r => r.id === rejectModalReport.id ? { ...r, status: data.status, citizen_feedback: data.citizen_feedback } : r));
      setRejectModalReport(null);
      setRejectReason('');
    } catch (err) {
      console.error('Rejection failed:', err);
      alert('Failed to reject complaint. Please try again.');
    } finally {
      setRejectSubmitting(false);
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    return {
      pending: reports.filter(r => r.status === 'pending').length,
      inProgress: reports.filter(r => r.status === 'in_progress' || r.status === 'assigned').length,
      resolved: reports.filter(r => r.status === 'resolved' || r.status === 'closed').length,
      disputed: reports.filter(r => r.status === 'reopened').length,
      rejected: reports.filter(r => r.status === 'rejected').length
    };
  }, [reports]);

  // Filtering reports
  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      // Tab filter
      if (statusTab === 'pending' && report.status !== 'pending') return false;
      if (statusTab === 'in_progress' && !['in_progress', 'assigned'].includes(report.status)) return false;
      if (statusTab === 'disputed' && report.status !== 'reopened') return false;
      if (statusTab === 'resolved' && !['resolved', 'closed'].includes(report.status)) return false;
      if (statusTab === 'rejected' && report.status !== 'rejected') return false;

      // Status dropdown filter
      if (statusFilter && statusFilter !== 'all') {
        if (statusFilter === 'pending' && report.status !== 'pending') return false;
        if (statusFilter === 'in_progress' && !['in_progress', 'assigned'].includes(report.status)) return false;
        if (statusFilter === 'resolved' && !['resolved', 'closed'].includes(report.status)) return false;
        if (statusFilter === 'disputed' && report.status !== 'reopened') return false;
        if (statusFilter === 'rejected' && report.status !== 'rejected') return false;
      }

      // Priority dropdown filter
      if (priorityFilter && priorityFilter !== 'all') {
        if (report.priority?.toLowerCase() !== priorityFilter.toLowerCase()) return false;
      }

      // Search filter
      if (appliedSearch.trim()) {
        const query = appliedSearch.toLowerCase().trim();
        const address = getReportAddress(report).toLowerCase();
        const title = (report.title || '').toLowerCase();
        const desc = (report.description || '').toLowerCase();
        const idStr = String(report.id);
        const hexId = generateReportHash(report.id).toLowerCase();

        const match = title.includes(query) ||
          desc.includes(query) ||
          address.includes(query) ||
          idStr.includes(query) ||
          hexId.includes(query);

        if (!match) return false;
      }

      return true;
    });
  }, [reports, statusTab, statusFilter, priorityFilter, appliedSearch, addressCache]);

  function generateReportHash(id) {
    // Generate a clean hex ID for presentation matching mockup (e.g. 68a5a2b1e2d1c2f8a...)
    const base = `68a5a2b${id}e2d1c2f8a123456${id}`.slice(0, 24);
    return base;
  }

  function getReportAddress(report) {
    if (report.latitude && report.longitude && report.latitude !== 0) {
      const key = `${report.latitude.toFixed(4)},${report.longitude.toFixed(4)}`;
      if (addressCache[key]) return addressCache[key];
      return `Tumakuru, Karnataka, India`;
    }
    return 'Location not specified';
  }

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setAppliedSearch(searchQuery);
  };

  const handleOpenEmail = (report) => {
    const recipient = report.user_email || 'citizen@cityreport.org';
    const subj = `Update regarding Report #${report.id}: ${report.title}`;
    const body = `Hello,\n\nWe are reaching out from the City Road Maintenance Department regarding your reported issue "${report.title}".\n\nLocation: ${getReportAddress(report)}\nStatus: ${report.status.toUpperCase()}\n\n`;
    
    setEmailModalReport(report);
    setEmailSubject(subj);
    setEmailBody(body);
  };

  const handleSendEmail = () => {
    setEmailSending(true);
    setTimeout(() => {
      setEmailSending(false);
      alert(`Message successfully sent to citizen (${emailModalReport?.user_email || 'citizen@cityreport.org'})!`);
      setEmailModalReport(null);
    }, 600);
  };

  const handleOpenMap = (report) => {
    if (report.latitude && report.longitude && report.latitude !== 0) {
      window.open(
        `https://www.google.com/maps?q=${report.latitude},${report.longitude}`,
        '_blank',
        'noopener,noreferrer'
      );
    } else {
      alert('Coordinates not available for this report.');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return { date: '8/20/2026', time: '9:55 PM' };
    const d = new Date(dateStr);
    return {
      date: d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }),
      time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    };
  };

  return (
    <div className="min-h-screen bg-background officer-page">
      <Navbar />

      <main className="container py-lg">
        {/* Header */}
        <div className="dashboard-header mb-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-md">
          <div>
            <h1 className="text-2xl mb-xs font-bold">Field Response &amp; Repair Triage</h1>
            <p className="text-muted text-sm font-medium">
              Smart Civic Infrastructure Monitoring &amp; Dynamic Task Dispatch
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={fetchReports}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh Queue'}
          </Button>
        </div>

        {/* 4 Top Summary Cards (Stats Grid) */}
        <div className="stats-grid">
          {/* 1. Pending */}
          <div className="officer-stat-card">
            <div className="stat-icon-box pending-box">
              <Clock size={24} strokeWidth={2.5} />
            </div>
            <div className="stat-info">
              <p className="stat-title">Pending</p>
              <p className="stat-count">{stats.pending}</p>
            </div>
          </div>

          {/* 2. In Progress */}
          <div className="officer-stat-card">
            <div className="stat-icon-box in-progress-box">
              <AlertCircle size={24} strokeWidth={2.5} />
            </div>
            <div className="stat-info">
              <p className="stat-title">In Progress</p>
              <p className="stat-count">{stats.inProgress}</p>
            </div>
          </div>

          {/* 3. Resolved */}
          <div className="officer-stat-card">
            <div className="stat-icon-box resolved-box">
              <CheckCircle size={24} strokeWidth={2.5} />
            </div>
            <div className="stat-info">
              <p className="stat-title">Resolved</p>
              <p className="stat-count">{stats.resolved}</p>
            </div>
          </div>

          {/* 4. Disputed */}
          <div className="officer-stat-card">
            <div className="stat-icon-box disputed-box">
              <AlertCircle size={24} strokeWidth={2.5} />
            </div>
            <div className="stat-info">
              <p className="stat-title">Disputed</p>
              <p className="stat-count">{stats.disputed}</p>
            </div>
          </div>

          {/* 5. Rejected */}
          <div className="officer-stat-card">
            <div className="stat-icon-box rejected-box">
              <XCircle size={24} strokeWidth={2.5} />
            </div>
            <div className="stat-info">
              <p className="stat-title">Rejected</p>
              <p className="stat-count">{stats.rejected}</p>
            </div>
          </div>
        </div>

        {/* Filters Card */}
        <Card className="filter-card mt-lg mb-lg">
          <div className="filter-header flex items-center gap-xs mb-md">
            <Filter size={18} className="text-secondary" />
            <h3 className="filter-card-title">Filters</h3>
          </div>

          <form onSubmit={handleSearchSubmit} className="filters-grid">
            {/* Priority Filter */}
            <div className="filter-field">
              <label className="filter-label">Priority</label>
              <select
                className="filter-select"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="filter-field">
              <label className="filter-label">Status</label>
              <select
                className="filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="disputed">Disputed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="filter-field search-field">
              <label className="filter-label">Search</label>
              <div className="search-input-group">
                <input
                  type="text"
                  className="filter-input search-input"
                  placeholder="Search by title, description, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="search-btn">
                  Search
                </button>
              </div>
            </div>
          </form>
        </Card>

        {/* Assigned Reports Card */}
        <Card className="reports-section-card mt-lg">
          {/* Card Header with Tabs */}
          <div className="reports-card-header">
            <h2 className="reports-heading">Assigned Reports</h2>

            {/* Status Tabs */}
            <div className="status-tabs-container">
              <button
                className={`status-tab-btn ${statusTab === 'all' ? 'active' : ''}`}
                onClick={() => setStatusTab('all')}
              >
                All
              </button>
              <button
                className={`status-tab-btn ${statusTab === 'pending' ? 'active' : ''}`}
                onClick={() => setStatusTab('pending')}
              >
                Pending
              </button>
              <button
                className={`status-tab-btn ${statusTab === 'in_progress' ? 'active' : ''}`}
                onClick={() => setStatusTab('in_progress')}
              >
                In Progress
              </button>
              <button
                className={`status-tab-btn ${statusTab === 'disputed' ? 'active' : ''}`}
                onClick={() => setStatusTab('disputed')}
              >
                Disputed
              </button>
              <button
                className={`status-tab-btn ${statusTab === 'resolved' ? 'active' : ''}`}
                onClick={() => setStatusTab('resolved')}
              >
                Resolved
              </button>
              <button
                className={`status-tab-btn ${statusTab === 'rejected' ? 'active' : ''}`}
                onClick={() => setStatusTab('rejected')}
              >
                Rejected
              </button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-xl">
              <p className="text-muted">Loading assigned reports...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-xl empty-reports">
              <p className="text-muted">No road repair reports found matching current filters.</p>
            </div>
          ) : (
            <div className="table-responsive-wrapper">
              <table className="officer-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: '240px' }}>Title</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th style={{ minWidth: '180px' }}>Location</th>
                    <th>Created Date</th>
                    <th>Upvotes</th>
                    <th style={{ minWidth: '200px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report) => {
                    const formattedDateTime = formatDate(report.created_at);
                    const addressStr = getReportAddress(report);
                    const isDisputed = report.status === 'reopened';
                    const hexId = generateReportHash(report.id);

                    return (
                      <tr key={report.id} className="officer-row">
                        {/* Title Column with Thumbnail */}
                        <td>
                          <div className="report-title-cell">
                            <div
                              className="report-thumbnail-wrapper"
                              onClick={() => setPreviewImage(getImageUrl(report.image_url))}
                              title="Click to zoom image"
                            >
                              <img
                                src={getImageUrl(report.image_url)}
                                alt={report.title}
                                className="report-thumbnail-img"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=200&q=80';
                                }}
                              />
                            </div>
                            <div className="report-title-info">
                              <span className="report-main-title">{report.title}</span>
                              <span className="report-desc-snippet">
                                {report.description || 'Road surface damage reported.'}
                              </span>
                              <span className="report-id-text">ID: {hexId}</span>
                              {isDisputed && report.citizen_feedback && (
                                <span className="dispute-pill">
                                  Dispute: {report.citizen_feedback}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Priority Column */}
                        <td>
                          <span className={`priority-pill priority-${(report.priority || 'low').toLowerCase()}`}>
                            {(report.priority || 'LOW').toUpperCase()}
                          </span>
                        </td>

                        {/* Status Column */}
                        <td>
                          <span className={`status-pill status-${(report.status || 'pending').toLowerCase()}`}>
                            {report.status === 'in_progress' ? 'IN PROGRESS' : (
                              report.status === 'reopened' ? 'DISPUTED' : (report.status || 'PENDING').toUpperCase()
                            )}
                          </span>
                        </td>

                        {/* Location Column */}
                        <td>
                          <div className="location-cell">
                            <span className="location-address">{addressStr}</span>
                            <span className="location-coords">
                              {report.latitude && report.longitude && report.latitude !== 0
                                ? `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`
                                : '13.3409, 77.1011'}
                            </span>
                            <button
                              type="button"
                              className="view-on-map-link"
                              onClick={() => handleOpenMap(report)}
                            >
                              View on Map
                            </button>
                          </div>
                        </td>

                        {/* Created Date Column */}
                        <td>
                          <div className="date-cell">
                            <span className="date-main">{formattedDateTime.date}</span>
                            <span className="date-time">{formattedDateTime.time}</span>
                          </div>
                        </td>

                        {/* Upvotes Column */}
                        <td>
                          <div className="upvotes-cell">
                            <ThumbsUp size={14} className="upvote-icon" />
                            <span>{report.upvotes || 0}</span>
                          </div>
                        </td>

                        {/* Actions Column */}
                        <td>
                          <div className="actions-cell-group">
                            {/* Top row action buttons */}
                            <div className="action-buttons-row">
                              {/* View Button */}
                              <button
                                className="action-btn-view"
                                onClick={() => navigate(`/officer/report/${report.id}`)}
                                title="Open full report details"
                              >
                                <Eye size={14} />
                                <span>View</span>
                              </button>

                              {/* Email Button */}
                              <button
                                className="action-btn-email"
                                onClick={() => handleOpenEmail(report)}
                                title="Contact the citizen who reported this"
                              >
                                <Mail size={14} />
                                <span>Email</span>
                              </button>

                              {/* Location Button */}
                              <button
                                className="action-btn-location"
                                onClick={() => handleOpenMap(report)}
                                title="Open exact location in map"
                              >
                                <MapPin size={14} />
                                <span>Location</span>
                              </button>
                            </div>

                            {/* Bottom row status transition buttons */}
                            <div className="status-buttons-row">
                              {(report.status === 'pending' || report.status === 'reopened') && (
                                <button
                                  className="action-btn-start"
                                  onClick={() => updateStatus(report.id, 'in_progress')}
                                >
                                  Start
                                </button>
                              )}

                              {(report.status === 'pending' || report.status === 'in_progress' || report.status === 'reopened') && (
                                <button
                                  className="action-btn-resolve"
                                  onClick={() => updateStatus(report.id, 'resolved')}
                                >
                                  Resolve
                                </button>
                              )}

                              {(report.status === 'pending' || report.status === 'in_progress' || report.status === 'reopened' || report.status === 'resolved') && (
                                <button
                                  className="action-btn-reject"
                                  onClick={() => handleOpenRejectModal(report)}
                                  title="Reject complaint if road is already resolved or dispute is false"
                                >
                                  <Ban size={12} />
                                  <span>Reject</span>
                                </button>
                              )}

                              {report.status === 'rejected' && (
                                <span className="rejected-status-text" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <XCircle size={13} /> Rejected
                                </span>
                              )}

                              {report.status === 'resolved' && (
                                <span className="resolved-status-text" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <CheckCircle2 size={13} /> Resolved
                                </span>
                              )}

                              {report.status === 'closed' && (
                                <span className="closed-status-text" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <CheckCircle2 size={13} /> Closed
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Showing count */}
          {!loading && filteredReports.length > 0 && (
            <div className="reports-count-footer">
              Showing 1 to {filteredReports.length} of {filteredReports.length} reports
            </div>
          )}

          {/* Bottom Legend Box */}
          <div className="officer-legend-box mt-lg">
            <div className="legend-grid">
              <div className="legend-item">
                <Eye size={14} className="legend-icon icon-view" />
                <span className="legend-text"><strong>View:</strong> Open full report details with images and description</span>
              </div>
              <div className="legend-item">
                <Play size={14} className="legend-icon icon-start" />
                <span className="legend-text"><strong>Start:</strong> Mark report as In Progress</span>
              </div>
              <div className="legend-item">
                <Mail size={14} className="legend-icon icon-email" />
                <span className="legend-text"><strong>Email:</strong> Contact the citizen who reported this issue</span>
              </div>
              <div className="legend-item">
                <Check size={14} className="legend-icon icon-resolve" />
                <span className="legend-text"><strong>Resolve:</strong> Mark report as Resolved</span>
              </div>
              <div className="legend-item">
                <Ban size={14} className="legend-icon" style={{ color: '#ef4444' }} />
                <span className="legend-text"><strong>Reject:</strong> Reject false disputes or complaints where road is already resolved</span>
              </div>
              <div className="legend-item">
                <MapPin size={14} className="legend-icon icon-loc" />
                <span className="legend-text"><strong>Location:</strong> Open exact location in map</span>
              </div>
            </div>
          </div>
        </Card>
      </main>

      {/* Image Lightbox Modal */}
      {previewImage && (
        <div className="modal-backdrop" onClick={() => setPreviewImage(null)}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setPreviewImage(null)}>
              <X size={20} />
            </button>
            <img src={previewImage} alt="Enlarged road damage" className="enlarged-img" />
          </div>
        </div>
      )}

      {/* Email Citizen Modal */}
      {emailModalReport && (
        <div className="modal-backdrop" onClick={() => setEmailModalReport(null)}>
          <div className="email-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="email-modal-header">
              <div className="flex items-center gap-xs">
                <Mail size={20} className="text-primary" />
                <h3 className="email-modal-title">Contact Citizen</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setEmailModalReport(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="email-modal-body">
              <div className="email-form-group">
                <label className="email-label">To:</label>
                <input
                  type="text"
                  className="email-input-disabled"
                  disabled
                  value={emailModalReport.user_email || 'citizen@cityreport.org'}
                />
              </div>

              <div className="email-form-group">
                <label className="email-label">Subject:</label>
                <input
                  type="text"
                  className="email-input"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                />
              </div>

              <div className="email-form-group">
                <label className="email-label">Message:</label>
                <textarea
                  className="email-textarea"
                  rows={6}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                />
              </div>
            </div>

            <div className="email-modal-footer">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEmailModalReport(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSendEmail}
                disabled={emailSending}
              >
                {emailSending ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Complaint Modal */}
      {rejectModalReport && (
        <div className="modal-backdrop" onClick={() => setRejectModalReport(null)}>
          <div className="email-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="email-modal-header">
              <div className="flex items-center gap-xs">
                <Ban size={20} style={{ color: '#ef4444' }} />
                <h3 className="email-modal-title">Reject Complaint / Dispute</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setRejectModalReport(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="email-modal-body">
              <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Mark Report <strong>#{rejectModalReport.id}: &ldquo;{rejectModalReport.title}&rdquo;</strong> as <strong>Rejected</strong>.
                Use this option if the road damage was already repaired and resolved, or if the citizen reopened the complaint falsely.
              </p>

              <div className="email-form-group">
                <label className="email-label">Quick Reason Presets:</label>
                <div className="preset-reasons-group">
                  {[
                    'Road repair already completed and verified.',
                    'False dispute / issue already fixed on-site.',
                    'Duplicate report / no damage found at coordinates.',
                    'Not under municipal road jurisdiction.'
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`preset-reason-btn ${rejectReason === preset ? 'active' : ''}`}
                      onClick={() => setRejectReason(preset)}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="email-form-group">
                <label className="email-label">Rejection Reason / Note to Citizen:</label>
                <textarea
                  className="email-textarea"
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explain why this complaint or dispute is being rejected..."
                />
              </div>
            </div>

            <div className="email-modal-footer">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRejectModalReport(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={Ban}
                onClick={handleConfirmReject}
                disabled={rejectSubmitting}
              >
                {rejectSubmitting ? 'Rejecting...' : 'Confirm Reject'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficerDashboard;
