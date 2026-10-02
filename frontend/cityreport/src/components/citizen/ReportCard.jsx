import { MapPin, ThumbsUp, Trash2, Zap, Droplets, Lightbulb, Layers, Activity } from 'lucide-react';
import Card from '../shared/Card';
import Badge from '../shared/Badge';
import Button from '../shared/Button';
import './ReportCard.css';
import { getImageUrl } from '../../utils/image';
import { useAuth } from '../../contexts/AuthContext';

const FACILITY_MAP = {
    road_issues: { label: '🛣️ Roads & Pavement', variant: 'neutral' },
    roads: { label: '🛣️ Roads & Pavement', variant: 'neutral' },
    bridges: { label: '🌉 Bridge Structure', variant: 'info' },
    water: { label: '💧 Water Network', variant: 'info' },
    streetlights: { label: '💡 Smart Lighting', variant: 'warning' },
    power: { label: '⚡ Grid & Power', variant: 'warning' },
    parks: { label: '🌳 Green Space', variant: 'success' },
};

const ReportCard = ({ report, onUpvote, onClick, onWithdraw, isOwner }) => {
    const { user } = useAuth();
    const {
        id,
        title,
        category,
        location,
        status,
        image_url,
        imageUrl,
        upvotes,
        createdAt,
        created_at,
        ai_severity_score,
        ai_severity_level
    } = report;

    const upvoted = localStorage.getItem(`upvoted_${user?.id}_${id}`) === '1';

    const facInfo = FACILITY_MAP[category] || { label: '🏛️ Civic Asset', variant: 'neutral' };

    const STATUS_LABELS = {
        pending: 'Pending',
        in_progress: 'In Progress',
        resolved: 'Resolved',
        closed: 'Closed',
        reopened: 'Reopened',
        rejected: 'Rejected',
    };

    const getStatusVariant = (status = '') => {
        switch (status.toLowerCase()) {
            case 'resolved':
            case 'closed': return 'success';
            case 'in_progress': return 'warning';
            case 'reopened': return 'danger';
            case 'rejected': return 'danger';
            case 'pending': return 'danger';
            default: return 'neutral';
        }
    };

    const getSeverityBadgeClass = (score) => {
        if (!score) return '';
        if (score >= 75) return 'severity-pill-critical';
        if (score >= 50) return 'severity-pill-high';
        if (score >= 25) return 'severity-pill-medium';
        return 'severity-pill-low';
    };

    return (
        <Card className="report-card" padding="none" onClick={() => onClick(id)}>
            <div className="report-image-container">
                <img
                    src={getImageUrl(image_url || imageUrl)}
                    alt={title}
                    className="report-image"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=400&q=80';
                    }}
                />
                <div className="report-image-badges">
                    <span className="facility-floating-pill">{facInfo.label}</span>
                    {ai_severity_score && (
                        <span className={`severity-floating-pill ${getSeverityBadgeClass(ai_severity_score)}`}>
                            AI {ai_severity_score.toFixed(0)}/100
                        </span>
                    )}
                </div>
            </div>

            <div className="report-content p-md">
                <div className="flex justify-between items-start mb-sm gap-xs">
                    <h3 className="text-lg font-semibold report-title">{title}</h3>
                    <Badge variant={getStatusVariant(status)}>{STATUS_LABELS[status] || status}</Badge>
                </div>

                {location && (
                    <div className="flex items-center text-muted text-sm mb-md">
                        <MapPin size={14} className="mr-1 flex-shrink-0 text-danger" />
                        <span className="truncate">{location}</span>
                    </div>
                )}

                <div className="flex justify-between items-center mt-auto pt-sm border-t">
                    <div className="flex gap-md">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="action-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                onUpvote(id);
                            }}
                        >
                            <ThumbsUp size={18} style={{ color: upvoted ? 'var(--primary)' : undefined, fill: upvoted ? 'var(--primary)' : 'none' }} />
                            <span style={{ color: upvoted ? 'var(--primary)' : undefined }}>{upvotes}</span>
                        </Button>

                        {isOwner && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="action-btn action-btn-delete"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onWithdraw(id);
                                }}
                                title="Withdraw Report"
                            >
                                <Trash2 size={18} />
                            </Button>
                        )}
                    </div>

                    <span className="text-xs text-muted font-medium">
                        {(createdAt || created_at) ? new Date(createdAt || created_at).toLocaleDateString() : 'N/A'}
                    </span>
                </div>
            </div>
        </Card>
    );
};

export default ReportCard;
