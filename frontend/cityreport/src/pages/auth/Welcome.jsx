import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Activity,
    MapPin,
    Cpu,
    TrendingUp,
    CheckCircle2,
    ArrowRight,
    LogIn,
    UserPlus,
    Sun,
    Moon,
    Zap,
    Shield,
    Users,
    AlertTriangle,
    Eye,
    Sparkles,
    Radio,
    Sliders,
    Layers,
    Clock,
    FileText,
    Camera
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import Button from '../../components/shared/Button';
import './Welcome.css';

const POTHOLE_DEFECT_TYPES = {
    pothole: {
        title: 'Deep Asphalt Pothole Cavity Scan',
        badge: 'PRIORITY 1 - CRITICAL ROAD HAZARD',
        image: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
        boxLabel: 'POTHOLE SPREAD: 0.74m² | DEPTH: 8.2cm',
        severity: '88.5 / 100',
        severityTag: 'Critical',
        proximity: '85m to Hospital Corridor',
        dept: 'Roads & Infrastructure (Alpha Quick-Repair Team)',
        sentiment: 'High Traffic Velocity (+15 AHP Weight)',
        sla: '< 4.0 Hours Target SLA'
    },
    cracks: {
        title: 'Asphalt Alligator Fracture & Transverse Crack',
        badge: 'PRIORITY 2 - HIGH STRUCTURAL DECAY',
        image: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?auto=format&fit=crop&w=800&q=80',
        boxLabel: 'FRACTURE LINE: 14.6m SPREAD',
        severity: '76.0 / 100',
        severityTag: 'High',
        proximity: 'Main Arterial Commuter Highway',
        dept: 'Municipal Asphalt Resurfacing Division',
        sentiment: 'Sub-base Water Penetration Risk (+12 Weight)',
        sla: '< 12.0 Hours Target SLA'
    },
    waterlogging: {
        title: 'Submerged Pothole & Road Waterlogging',
        badge: 'PRIORITY 1 - CRITICAL HYDROLOGICAL HAZARD',
        image: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80',
        boxLabel: 'WATERLOGGED CAVITY: REFLECTIVE DEPTH 11cm',
        severity: '82.3 / 100',
        severityTag: 'Critical',
        proximity: '120m to School Crosswalk Zone',
        dept: 'Drainage & Roadway Safety Squad',
        sentiment: 'Hydroplaning & Skid Risk (+18 Weight)',
        sla: '< 3.0 Hours Target SLA'
    },
    surface: {
        title: 'Asphalt Rutting & Shoulder Edge Breakdown',
        badge: 'PRIORITY 3 - MEDIUM WEAR',
        image: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80',
        boxLabel: 'SHOULDER DROP-OFF: 6.5cm WEAR',
        severity: '64.2 / 100',
        severityTag: 'Medium',
        proximity: 'Commercial Bus Route Corridor',
        dept: 'Pavement Maintenance Sector 3',
        sentiment: 'Heavy Commercial Vehicle Route (+8 Weight)',
        sla: '< 24.0 Hours Target SLA'
    }
};

const Welcome = () => {
    const { theme, toggleTheme, isDark } = useTheme();
    const navigate = useNavigate();
    const [activeDefect, setActiveDefect] = useState('pothole');

    const currentViz = POTHOLE_DEFECT_TYPES[activeDefect];

    return (
        <div className="welcome-page">
            {/* Top Navigation Bar */}
            <header className="welcome-nav">
                <div className="container welcome-nav-content">
                    <Link to="/" className="brand-badge">
                        <div className="brand-logo-hex">
                            <Shield size={22} />
                        </div>
                        <div className="brand-text-block">
                            <span className="brand-name">Smart City</span>
                            <span className="brand-tag">Infrastructure &amp; Management System</span>
                        </div>
                    </Link>

                    <div className="telemetry-pill hidden md:flex">
                        <span className="pulse-dot"></span>
                        <span>AI POTHOLE DETECTION &amp; GIS DISPATCH ACTIVE</span>
                    </div>

                    <div className="nav-actions">
                        <button
                            className="icon-btn theme-toggle-btn"
                            onClick={toggleTheme}
                            title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
                            aria-label="Toggle theme"
                        >
                            {isDark ? <Sun size={19} className="theme-icon sun" /> : <Moon size={19} className="theme-icon moon" />}
                        </button>

                        <Link to="/login">
                            <Button variant="ghost" size="sm" icon={LogIn}>
                                Sign In
                            </Button>
                        </Link>

                        <Link to="/signup">
                            <Button variant="primary" size="sm" icon={UserPlus}>
                                Report Pothole
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="container hero-grid">
                    <div className="hero-text-content">
                        <div className="hero-badge-tag">
                            <Sparkles size={14} />
                            <span>AI Computer Vision &amp; Road Pothole Triage Core</span>
                        </div>

                        <h1 className="hero-title">
                            Smart City Infrastructure <br />
                            <span className="highlight-text">&amp; Management System</span>
                        </h1>

                        <p className="hero-desc">
                            AI-powered municipal road infrastructure monitoring and pothole triage system. Using computer vision to detect cavity spread, PostGIS spatial indexing for road vulnerability weighting, and automated field crew dispatch for rapid asphalt repairs.
                        </p>

                        <div className="hero-buttons">
                            <Link to="/login" className="btn-hero-primary">
                                <span>Access Command Portal</span>
                                <ArrowRight size={18} />
                            </Link>

                            <Link to="/signup" className="btn-hero-secondary">
                                <span>Report Road Defect</span>
                                <AlertTriangle size={18} />
                            </Link>
                        </div>

                        <div className="flex flex-wrap items-center gap-md text-xs text-muted">
                            <span className="flex items-center gap-xs">
                                <CheckCircle2 size={14} className="text-success" /> OpenCV Pothole Geometry
                            </span>
                            <span className="flex items-center gap-xs">
                                <CheckCircle2 size={14} className="text-success" /> PostGIS Road Spatial Indexing
                            </span>
                            <span className="flex items-center gap-xs">
                                <CheckCircle2 size={14} className="text-success" /> AHP Dynamic Multi-Factor Triage
                            </span>
                        </div>
                    </div>

                    {/* Interactive AI Pothole Telemetry Scanner */}
                    <div className="visualizer-card">
                        <div className="viz-facility-tabs">
                            <button
                                className={`viz-fac-btn ${activeDefect === 'pothole' ? 'active' : ''}`}
                                onClick={() => setActiveDefect('pothole')}
                            >
                                🕳️ Deep Pothole
                            </button>
                            <button
                                className={`viz-fac-btn ${activeDefect === 'cracks' ? 'active' : ''}`}
                                onClick={() => setActiveDefect('cracks')}
                            >
                                ⚡ Asphalt Cracks
                            </button>
                            <button
                                className={`viz-fac-btn ${activeDefect === 'waterlogging' ? 'active' : ''}`}
                                onClick={() => setActiveDefect('waterlogging')}
                            >
                                🌊 Waterlogged
                            </button>
                            <button
                                className={`viz-fac-btn ${activeDefect === 'surface' ? 'active' : ''}`}
                                onClick={() => setActiveDefect('surface')}
                            >
                                🚧 Edge Rutting
                            </button>
                        </div>

                        <div className="viz-header">
                            <div className="viz-title-box">
                                <Activity size={18} className="text-primary" />
                                <span>{currentViz.title}</span>
                            </div>
                            <span className="viz-badge">{currentViz.badge}</span>
                        </div>

                        <div className="viz-image-container">
                            <img
                                src={currentViz.image}
                                alt="Road Defect AI Scan"
                                className="viz-image"
                            />
                            <div className="viz-ai-box">
                                <span className="viz-ai-tag">{currentViz.boxLabel}</span>
                            </div>
                        </div>

                        <div className="viz-metrics-grid">
                            <div className="viz-metric-item">
                                <p className="viz-metric-label">Composite AI Severity</p>
                                <p className="viz-metric-val critical">
                                    <span>{currentViz.severity}</span>
                                    <span className="text-xs">[{currentViz.severityTag}]</span>
                                </p>
                            </div>
                            <div className="viz-metric-item">
                                <p className="viz-metric-label">Spatial Proximity</p>
                                <p className="viz-metric-val">
                                    <MapPin size={14} className="text-danger" />
                                    <span>{currentViz.proximity}</span>
                                </p>
                            </div>
                            <div className="viz-metric-item">
                                <p className="viz-metric-label">Assigned Road Squad</p>
                                <p className="viz-metric-val">
                                    <span>{currentViz.dept}</span>
                                </p>
                            </div>
                            <div className="viz-metric-item">
                                <p className="viz-metric-label">Citizen Sentiment &amp; Speed</p>
                                <p className="viz-metric-val">
                                    <span>{currentViz.sentiment}</span>
                                </p>
                            </div>
                        </div>

                        <div className="viz-footer-strip">
                            <span>Status: <strong>AI Triage &amp; Road Crew Dispatched</strong></span>
                            <span className="text-muted">Target SLA: {currentViz.sla}</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Live Metrics Counter Strip */}
            <section className="stats-strip-section">
                <div className="container">
                    <div className="stats-strip-card">
                        <div className="stat-item">
                            <span className="stat-number">14,850+ km</span>
                            <span className="stat-label-text">Monitored Road Network</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">98.4%</span>
                            <span className="stat-label-text">AI Pothole Detection Precision</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">&lt; 3.8 hrs</span>
                            <span className="stat-label-text">Critical Pothole Repair SLA</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">100%</span>
                            <span className="stat-label-text">PostGIS Spatial Auditability</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Core Architecture Pillars */}
            <section className="pillars-section">
                <div className="container">
                    <div className="section-header-center">
                        <p className="section-eyebrow">End-to-End Pothole Engineering</p>
                        <h2 className="section-heading">AI-Powered Road Condition Intelligence</h2>
                        <p className="section-subtext">
                            From mobile image capture to neural cavity segmentation, spatial risk weighting, and verified road repairs.
                        </p>
                    </div>

                    <div className="pillars-grid">
                        <div className="pillar-card">
                            <div className="pillar-icon-box">
                                <Cpu size={24} />
                            </div>
                            <h3 className="pillar-title">OpenCV Vision Engine</h3>
                            <p className="pillar-desc">
                                Automated cavity surface area calculation, depth gradient contrast, and asphalt crack texture classification.
                            </p>
                        </div>

                        <div className="pillar-card">
                            <div className="pillar-icon-box">
                                <MapPin size={24} />
                            </div>
                            <h3 className="pillar-title">GIS Spatial Weighting</h3>
                            <p className="pillar-desc">
                                Dynamic risk calculation with PostGIS R-Tree indexing factoring proximity to schools, hospitals, and heavy transit arteries.
                            </p>
                        </div>

                        <div className="pillar-card">
                            <div className="pillar-icon-box">
                                <TrendingUp size={24} />
                            </div>
                            <h3 className="pillar-title">AHP Dynamic Prioritization</h3>
                            <p className="pillar-desc">
                                Analytic Hierarchy Process calculating composite severity scores (1-100) from vision, spatial, NLP sentiment, and crowd upvotes.
                            </p>
                        </div>

                        <div className="pillar-card">
                            <div className="pillar-icon-box">
                                <CheckCircle2 size={24} />
                            </div>
                            <h3 className="pillar-title">Dual Proof-of-Work Loop</h3>
                            <p className="pillar-desc">
                                Field road crews submit geo-tagged before/after repair photos; citizens verify or dispute closures with 100% transparency.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Direct Role Portals */}
            <section className="portals-section">
                <div className="container">
                    <div className="section-header-center">
                        <p className="section-eyebrow">Role-Based Access Control</p>
                        <h2 className="section-heading">Dedicated Portals for Every Stakeholder</h2>
                        <p className="section-subtext">
                            Access dedicated command dashboards for municipal administration, field inspection teams, and citizens.
                        </p>
                    </div>

                    <div className="portals-grid">
                        {/* Admin Portal Card */}
                        <div className="portal-card admin">
                            <div>
                                <div className="portal-header">
                                    <div className="portal-role-icon">
                                        <Shield size={22} />
                                    </div>
                                    <span className="portal-badge">Executive Hub</span>
                                </div>
                                <h3 className="portal-name">Super Admin</h3>
                                <p className="portal-desc">
                                    City-wide road network oversight, AHP priority weight calibration, road crew provisioning, and repair SLA analytics.
                                </p>
                                <ul className="portal-features-list">
                                    <li className="portal-feature-item">
                                        <CheckCircle2 size={15} /> City-wide pothole density heatmaps
                                    </li>
                                    <li className="portal-feature-item">
                                        <CheckCircle2 size={15} /> Road crew resource allocation
                                    </li>
                                    <li className="portal-feature-item">
                                        <CheckCircle2 size={15} /> Field officer roster &amp; repair audits
                                    </li>
                                </ul>
                            </div>
                            <Link to="/login">
                                <Button fullWidth variant="primary" icon={LogIn}>
                                    Admin Login
                                </Button>
                            </Link>
                        </div>

                        {/* Field Officer Portal Card */}
                        <div className="portal-card officer">
                            <div>
                                <div className="portal-header">
                                    <div className="portal-role-icon">
                                        <Users size={22} />
                                    </div>
                                    <span className="portal-badge">Field Response</span>
                                </div>
                                <h3 className="portal-name">Road Field Officer</h3>
                                <p className="portal-desc">
                                    Pothole triage queue, GPS turn-by-turn navigation, repair progression (In-Progress, Resolved), and inspection upload.
                                </p>
                                <ul className="portal-features-list">
                                    <li className="portal-feature-item">
                                        <CheckCircle2 size={15} /> Assigned pothole repair queue
                                    </li>
                                    <li className="portal-feature-item">
                                        <CheckCircle2 size={15} /> Google Maps GPS navigation
                                    </li>
                                    <li className="portal-feature-item">
                                        <CheckCircle2 size={15} /> Citizen email communication &amp; proof logs
                                    </li>
                                </ul>
                            </div>
                            <Link to="/login">
                                <Button fullWidth variant="primary" icon={LogIn}>
                                    Officer Login
                                </Button>
                            </Link>
                        </div>

                        {/* Citizen Portal Card */}
                        <div className="portal-card citizen">
                            <div>
                                <div className="portal-header">
                                    <div className="portal-role-icon">
                                        <MapPin size={22} />
                                    </div>
                                    <span className="portal-badge">Public Portal</span>
                                </div>
                                <h3 className="portal-name">Citizen Reporter</h3>
                                <p className="portal-desc">
                                    Report road potholes, cracking, and hazards in seconds with photo uploads, GPS auto-locating, and live repair tracking.
                                </p>
                                <ul className="portal-features-list">
                                    <li className="portal-feature-item">
                                        <CheckCircle2 size={15} /> Instant AI pothole scan preview
                                    </li>
                                    <li className="portal-feature-item">
                                        <CheckCircle2 size={15} /> Community voting &amp; road GIS map
                                    </li>
                                    <li className="portal-feature-item">
                                        <CheckCircle2 size={15} /> Real-time repair notifications
                                    </li>
                                </ul>
                            </div>
                            <Link to="/login">
                                <Button fullWidth variant="primary" icon={LogIn}>
                                    Citizen Login
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="welcome-footer">
                <div className="container footer-content">
                    <p className="footer-title">
                        Smart City Infrastructure and Management System
                    </p>
                    <p className="footer-copy">
                        AI-Powered Municipal Road &amp; Pothole Defect Detection, Severity Triaging &amp; Dynamic Repair Dispatch.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Welcome;
