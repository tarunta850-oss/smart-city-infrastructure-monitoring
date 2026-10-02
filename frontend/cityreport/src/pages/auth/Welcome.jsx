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
    Award,
    Sparkles,
    Droplets,
    Lightbulb,
    Radio,
    Sliders,
    Layers,
    Clock,
    FileText
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import Button from '../../components/shared/Button';
import FacultyShowcaseModal from '../../components/FacultyShowcaseModal';
import './Welcome.css';

const FACILITY_PREVIEWS = {
    roads: {
        title: 'Road & Pavement Defect Scan',
        badge: 'PRIORITY 1 - CRITICAL HAZARD',
        image: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
        boxLabel: 'POTHOLE SPREAD: 0.74m²',
        severity: '88.5 / 100',
        severityTag: 'Critical',
        proximity: '85m to Hospital Corridor',
        dept: 'Roads & Infrastructure (Alpha Team)',
        sentiment: 'Urgent (+15 AHP Weight)',
        sla: '< 4.0 Hours SLA'
    },
    bridges: {
        title: 'Flyover Structural Joint Scan',
        badge: 'PRIORITY 2 - HIGH VULNERABILITY',
        image: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?auto=format&fit=crop&w=800&q=80',
        boxLabel: 'EXPANSION GAP: +18mm DEVIATION',
        severity: '74.2 / 100',
        severityTag: 'High',
        proximity: 'Major River Crossing Artery',
        dept: 'Bridges & Civil Structures Division',
        sentiment: 'Vibration Alert (+12 AHP Weight)',
        sla: '< 12.0 Hours SLA'
    },
    water: {
        title: 'Distribution Main Pressure Burst',
        badge: 'PRIORITY 1 - CRITICAL LEAKAGE',
        image: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80',
        boxLabel: 'PRESSURE DROP: 28 PSI (LOW)',
        severity: '82.0 / 100',
        severityTag: 'Critical',
        proximity: '120m to Residential District',
        dept: 'Water Supply & Sewerage Board',
        sentiment: 'Contamination Risk (+18 Weight)',
        sla: '< 3.0 Hours SLA'
    },
    lighting: {
        title: 'Smart Streetlight Grid Outage',
        badge: 'PRIORITY 3 - MEDIUM SEVERITY',
        image: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80',
        boxLabel: 'CLUSTER OUTAGE: 6 LUMINAIRES',
        severity: '54.5 / 100',
        severityTag: 'Medium',
        proximity: 'School Pedestrian Crosswalk',
        dept: 'Smart Electrical & Lighting Grid',
        sentiment: 'Public Safety Alert (+8 Weight)',
        sla: '< 24.0 Hours SLA'
    }
};

const Welcome = () => {
    const { theme, toggleTheme, isDark } = useTheme();
    const navigate = useNavigate();
    const [activeFacility, setActiveFacility] = useState('roads');
    const [showFacultyModal, setShowFacultyModal] = useState(false);

    const currentViz = FACILITY_PREVIEWS[activeFacility];

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

                    <div className="telemetry-pill hidden lg:flex">
                        <span className="pulse-dot"></span>
                        <span>AI DEFECT ENGINE &amp; IOT TELEMETRY ACTIVE</span>
                    </div>

                    <div className="nav-actions">
                        {/* Faculty Viva Showcase Trigger Button */}
                        <button
                            className="btn-faculty-showcase-nav"
                            onClick={() => setShowFacultyModal(true)}
                            title="Open Academic Project Architecture & Viva Overview"
                        >
                            <Award size={16} />
                            <span>Faculty Showcase</span>
                        </button>

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
                                Citizen Portal
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
                            <span>Major Project — Academic &amp; Municipal E-Governance Hub</span>
                        </div>

                        <h1 className="hero-title">
                            Smart City Infrastructure <br />
                            <span className="highlight-text">&amp; Management System</span>
                        </h1>

                        <p className="hero-desc">
                            Next-generation urban infrastructure intelligence platform. Unifying computer vision defect detection, GIS spatial vulnerability weighting, real-time IoT sensor telemetry, and automated multi-departmental field dispatch to keep municipal roadways, bridges, and utilities resilient.
                        </p>

                        <div className="hero-buttons">
                            <Link to="/login" className="btn-hero-primary">
                                <span>Access Command Portal</span>
                                <ArrowRight size={18} />
                            </Link>

                            <button
                                className="btn-hero-viva"
                                onClick={() => setShowFacultyModal(true)}
                            >
                                <Award size={18} />
                                <span>Faculty Viva &amp; Architecture Hub</span>
                            </button>

                            <Link to="/signup" className="btn-hero-secondary">
                                <span>Report Defect</span>
                                <AlertTriangle size={18} />
                            </Link>
                        </div>

                        <div className="flex flex-wrap items-center gap-md text-xs text-muted">
                            <span className="flex items-center gap-xs">
                                <CheckCircle2 size={14} className="text-success" /> PostGIS Spatial Indexing
                            </span>
                            <span className="flex items-center gap-xs">
                                <CheckCircle2 size={14} className="text-success" /> AHP Dynamic Decision Matrix
                            </span>
                            <span className="flex items-center gap-xs">
                                <CheckCircle2 size={14} className="text-success" /> Real-Time IoT Telemetry
                            </span>
                        </div>
                    </div>

                    {/* Interactive AI Telemetry Simulation Visualizer */}
                    <div className="visualizer-card">
                        <div className="viz-facility-tabs">
                            <button
                                className={`viz-fac-btn ${activeFacility === 'roads' ? 'active' : ''}`}
                                onClick={() => setActiveFacility('roads')}
                            >
                                🛣️ Roads
                            </button>
                            <button
                                className={`viz-fac-btn ${activeFacility === 'bridges' ? 'active' : ''}`}
                                onClick={() => setActiveFacility('bridges')}
                            >
                                🌉 Bridges
                            </button>
                            <button
                                className={`viz-fac-btn ${activeFacility === 'water' ? 'active' : ''}`}
                                onClick={() => setActiveFacility('water')}
                            >
                                💧 Water
                            </button>
                            <button
                                className={`viz-fac-btn ${activeFacility === 'lighting' ? 'active' : ''}`}
                                onClick={() => setActiveFacility('lighting')}
                            >
                                💡 Lighting
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
                                alt="Smart City Infrastructure AI Scan"
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
                                <p className="viz-metric-label">Assigned Department</p>
                                <p className="viz-metric-val">
                                    <span>{currentViz.dept}</span>
                                </p>
                            </div>
                            <div className="viz-metric-item">
                                <p className="viz-metric-label">Citizen Sentiment</p>
                                <p className="viz-metric-val">
                                    <span>{currentViz.sentiment}</span>
                                </p>
                            </div>
                        </div>

                        <div className="viz-footer-strip">
                            <span>Status: <strong>AI Triage &amp; Crew Dispatched</strong></span>
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
                            <span className="stat-number">14,850+</span>
                            <span className="stat-label-text">Monitored Civic Assets</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">98.4%</span>
                            <span className="stat-label-text">AI Defect Classification</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">&lt; 3.8 hrs</span>
                            <span className="stat-label-text">Critical Hazard Response</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">100%</span>
                            <span className="stat-label-text">GIS Spatial Auditability</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Core Architecture Pillars */}
            <section className="pillars-section">
                <div className="container">
                    <div className="section-header-center">
                        <p className="section-eyebrow">Academic &amp; Municipal Excellence</p>
                        <h2 className="section-heading">Architected for Resilient Smart City Operations</h2>
                        <p className="section-subtext">
                            From citizen mobile reporting to high-precision AI vision scoring, IoT telemetry streams, and field crew dispatch.
                        </p>
                    </div>

                    <div className="pillars-grid">
                        <div className="pillar-card">
                            <div className="pillar-icon-box">
                                <Cpu size={24} />
                            </div>
                            <h3 className="pillar-title">AI Computer Vision</h3>
                            <p className="pillar-desc">
                                Automated defect boundary and spread analysis using OpenCV neural models to instantly determine defect surface area and hazard index.
                            </p>
                        </div>

                        <div className="pillar-card">
                            <div className="pillar-icon-box">
                                <MapPin size={24} />
                            </div>
                            <h3 className="pillar-title">GIS Spatial Weighting</h3>
                            <p className="pillar-desc">
                                Dynamic risk calculation with PostGIS R-Tree spatial indexing considering proximity to schools, hospitals, and transit arteries.
                            </p>
                        </div>

                        <div className="pillar-card">
                            <div className="pillar-icon-box">
                                <TrendingUp size={24} />
                            </div>
                            <h3 className="pillar-title">AHP Dynamic Prioritization</h3>
                            <p className="pillar-desc">
                                Multi-variable Analytic Hierarchy Process factoring in severity scores, citizen sentiment, traffic density, and repair SLAs.
                            </p>
                        </div>

                        <div className="pillar-card">
                            <div className="pillar-icon-box">
                                <CheckCircle2 size={24} />
                            </div>
                            <h3 className="pillar-title">Proof-of-Work Loop</h3>
                            <p className="pillar-desc">
                                Field officers submit geo-tagged resolution proof images, and citizens verify or dispute closures with 100% transparency.
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
                            Choose your operational role to access dedicated dashboards, triage workflows, and management modules.
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
                                    City-wide oversight, AHP priority weight calibration, officer provisioning, and real-time municipal health analytics.
                                </p>
                                <ul className="portal-features-list">
                                    <li className="portal-feature-item">
                                        <CheckCircle2 size={15} /> Multi-facility defect heatmaps
                                    </li>
                                    <li className="portal-feature-item">
                                        <CheckCircle2 size={15} /> Departmental resource allocation
                                    </li>
                                    <li className="portal-feature-item">
                                        <CheckCircle2 size={15} /> Officer roster &amp; performance audits
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
                                <h3 className="portal-name">Field Officer</h3>
                                <p className="portal-desc">
                                    Queue triage, GPS routing navigation, live repair status updates (In-Progress, Resolved), and inspection photo upload.
                                </p>
                                <ul className="portal-features-list">
                                    <li className="portal-feature-item">
                                        <CheckCircle2 size={15} /> Assigned dispatch queue
                                    </li>
                                    <li className="portal-feature-item">
                                        <CheckCircle2 size={15} /> Turn-by-turn map navigation
                                    </li>
                                    <li className="portal-feature-item">
                                        <CheckCircle2 size={15} /> Citizen email outreach &amp; proof logs
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
                                    Report potholes, broken streetlights, water bursts, and civic defects with image uploads, GPS auto-locating, and tracking.
                                </p>
                                <ul className="portal-features-list">
                                    <li className="portal-feature-item">
                                        <CheckCircle2 size={15} /> Instant AI scan preview
                                    </li>
                                    <li className="portal-feature-item">
                                        <CheckCircle2 size={15} /> Community voting &amp; GIS map
                                    </li>
                                    <li className="portal-feature-item">
                                        <CheckCircle2 size={15} /> Real-time resolution notifications
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
                        Powered by AI Computer Vision, Geo-Spatial GIS Analytics, Real-Time IoT Telemetry &amp; Municipal E-Governance.
                    </p>
                </div>
            </footer>

            {/* Faculty & Academic Viva Showcase Modal */}
            <FacultyShowcaseModal
                isOpen={showFacultyModal}
                onClose={() => setShowFacultyModal(false)}
            />
        </div>
    );
};

export default Welcome;
