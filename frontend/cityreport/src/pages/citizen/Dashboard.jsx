import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    FileText,
    Clock,
    CheckCircle,
    AlertTriangle,
    Activity,
    Layers,
    Droplets,
    Zap,
    Sparkles,
    Shield,
    Radio
} from 'lucide-react';
import api from '../../api';
import Navbar from '../../components/shared/Navbar';
import Button from '../../components/shared/Button';
import ReportCard from '../../components/citizen/ReportCard';
import FilterBar from '../../components/shared/FilterBar';
import { useAuth } from '../../contexts/AuthContext';
import './Dashboard.css';

const SEVERITY_ORDER = { critical: 4, high: 3, medium: 2, low: 1 };

const ROAD_DEFECT_OPTIONS = [
    { id: '', label: '🌐 All Road Defects' },
    { id: 'road_issues', label: '🕳️ Potholes & Cavities' },
    { id: 'cracks', label: '⚡ Asphalt Cracks' },
    { id: 'waterlogged', label: '🌊 Waterlogged Potholes' },
    { id: 'surface', label: '🚧 Surface Rutting' },
];

const StatCard = ({ icon: Icon, label, value, color, onClick, active }) => (
    <div
        className="stat-card"
        onClick={onClick}
        style={{
            cursor: onClick ? 'pointer' : undefined,
            outline: active ? `2px solid ${color}` : undefined,
            outlineOffset: 2
        }}
    >
        <div className="stat-icon" style={{ background: color + '20', color }}>
            <Icon size={22} />
        </div>
        <div>
            <p className="stat-label">{label}</p>
            <p className="stat-value">{value}</p>
        </div>
    </div>
);

const CitizenDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDefectType, setSelectedDefectType] = useState('');
    const [filters, setFilters] = useState({ status: '' });
    const [sortBy, setSortBy] = useState('newest');

    useEffect(() => {
        api.get('/reports/')
            .then(({ data }) => setReports(Array.isArray(data) ? data : data.items || []))
            .catch(() => setError('Failed to load reports.'))
            .finally(() => setLoading(false));
    }, []);

    const handleUpvote = async (id) => {
        const key = `upvoted_${user?.id}_${id}`;
        const wasUpvoted = localStorage.getItem(key) === '1';
        if (wasUpvoted) localStorage.removeItem(key);
        else localStorage.setItem(key, '1');
        try {
            await api.post(`/reports/${id}/upvote`);
            const { data } = await api.get('/reports/');
            setReports(Array.isArray(data) ? data : data.items || []);
        } catch {
            if (wasUpvoted) localStorage.setItem(key, '1');
            else localStorage.removeItem(key);
        }
    };

    const handleWithdraw = async (id) => {
        if (!window.confirm('Are you sure you want to delete this report? This cannot be undone.')) return;
        try {
            await api.delete(`/reports/${id}`);
            setReports(prev => prev.filter(r => r.id !== id));
        } catch (err) {
            const msg = err?.response?.data?.detail || 'Failed to delete report.';
            alert(msg);
        }
    };

    const stats = {
        total:      reports.length,
        pending:    reports.filter(r => r.status === 'pending').length,
        inProgress: reports.filter(r => r.status === 'in_progress').length,
        resolved:   reports.filter(r => ['resolved', 'closed'].includes(r.status)).length,
    };

    const filtered = useMemo(() => {
        const f = reports.filter(r => {
            const matchSearch =
                r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (r.description || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchStatus = filters.status ? r.status === filters.status : true;
            const matchDefect = selectedDefectType
                ? (r.category === selectedDefectType || (selectedDefectType === 'road_issues' && (!r.category || r.category === 'road_issues')))
                : true;
            return matchSearch && matchStatus && matchDefect;
        });
        return [...f].sort((a, b) => {
            if (sortBy === 'upvotes')  return (b.upvotes ?? 0) - (a.upvotes ?? 0);
            if (sortBy === 'newest')   return new Date(b.created_at) - new Date(a.created_at);
            if (sortBy === 'oldest')   return new Date(a.created_at) - new Date(b.created_at);
            if (sortBy === 'severity') return (SEVERITY_ORDER[b.ai_severity_level] ?? 0) - (SEVERITY_ORDER[a.ai_severity_level] ?? 0);
            return 0;
        });
    }, [reports, searchTerm, filters, selectedDefectType, sortBy]);

    return (
        <div className="min-h-screen bg-background citizen-dashboard-page">
            <Navbar />

            <main className="container py-lg">
                {/* Live City Road Health Banner */}
                <div className="city-health-banner mb-lg">
                    <div className="health-left">
                        <div className="pulse-indicator">
                            <span className="pulse-dot"></span>
                        </div>
                        <div>
                            <span className="health-title">MUNICIPAL ROAD NETWORK TELEMETRY</span>
                            <p className="health-desc">City Roadway Condition Index: <strong>94.8% Operational</strong> | AI Pothole Vision Engine Active</p>
                        </div>
                    </div>
                    <div className="health-right">
                        <span className="telemetry-badge">
                            <Radio size={13} />
                            <span>PostGIS Geodetic Sync Active</span>
                        </span>
                    </div>
                </div>

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-lg gap-md">
                    <div>
                        <h1 className="text-2xl mb-xs font-bold">Community Pothole &amp; Road Defect Feed</h1>
                        <p className="text-muted text-sm">
                            Smart City Infrastructure Monitoring &amp; Live AI Pothole Repair Tracking
                        </p>
                    </div>
                    <Button variant="primary" size="lg" icon={Plus} onClick={() => navigate('/citizen/report/new')}>
                        Report Road Pothole
                    </Button>
                </div>

                {/* City-wide stats */}
                <div className="stats-grid mb-lg">
                    <StatCard icon={FileText}      label="Total Reports"  value={loading ? '—' : stats.total}      color="#6366f1"
                        active={filters.status === ''}
                        onClick={() => setFilters(prev => ({ ...prev, status: '' }))} />
                    <StatCard icon={Clock}         label="Pending"        value={loading ? '—' : stats.pending}     color="#f59e0b"
                        active={filters.status === 'pending'}
                        onClick={() => setFilters(prev => ({ ...prev, status: prev.status === 'pending' ? '' : 'pending' }))} />
                    <StatCard icon={AlertTriangle} label="In Progress"    value={loading ? '—' : stats.inProgress}  color="#3b82f6"
                        active={filters.status === 'in_progress'}
                        onClick={() => setFilters(prev => ({ ...prev, status: prev.status === 'in_progress' ? '' : 'in_progress' }))} />
                    <StatCard icon={CheckCircle}   label="Resolved"       value={loading ? '—' : stats.resolved}    color="#10b981"
                        active={filters.status === 'resolved'}
                        onClick={() => setFilters(prev => ({ ...prev, status: prev.status === 'resolved' ? '' : 'resolved' }))} />
                </div>

                {/* Defect Category Filter Bar */}
                <div className="facility-filter-strip mb-md">
                    <span className="facility-filter-label">Defect Type:</span>
                    <div className="facility-chips-row">
                        {ROAD_DEFECT_OPTIONS.map(opt => (
                            <button
                                key={opt.id}
                                className={`facility-chip-btn ${selectedDefectType === opt.id ? 'active' : ''}`}
                                onClick={() => setSelectedDefectType(opt.id)}
                            >
                                <span>{opt.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Filter bar */}
                <FilterBar
                    onSearch={setSearchTerm}
                    onFilterChange={(type, value) => setFilters(prev => ({ ...prev, [type]: value }))}
                    onSortChange={setSortBy}
                />

                {error && (
                    <div style={{ padding: '1rem', marginBottom: '1rem', background: '#fee', color: '#c00', borderRadius: '0.5rem' }}>
                        {error}
                    </div>
                )}

                {loading ? (
                    <p className="text-center text-muted py-lg">Loading road defect reports...</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
                        {filtered.length > 0 ? (
                            filtered.map(report => (
                                <ReportCard
                                    key={report.id}
                                    report={report}
                                    onUpvote={handleUpvote}
                                    onClick={(id) => navigate(`/citizen/report/${id}`)}
                                    onWithdraw={handleWithdraw}
                                    isOwner={user && Number(user.id) === Number(report.user_id)}
                                />
                            ))
                        ) : (
                            <div className="col-span-full text-center py-lg text-muted" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="10" y="20" width="60" height="48" rx="6" fill="#e0e7ff" />
                                    <rect x="20" y="32" width="40" height="6" rx="3" fill="#a5b4fc" />
                                    <rect x="20" y="44" width="28" height="6" rx="3" fill="#c7d2fe" />
                                    <circle cx="56" cy="22" r="14" fill="#f0fdf4" stroke="#86efac" strokeWidth="2" />
                                    <path d="M50 22l4 4 8-8" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <div>
                                    <p style={{ fontWeight: 500 }}>No road defect reports match your search criteria.</p>
                                    <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Try changing the defect type filter or clearing the search.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default CitizenDashboard;
