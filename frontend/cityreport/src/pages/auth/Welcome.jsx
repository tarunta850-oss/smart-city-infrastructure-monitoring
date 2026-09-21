import React from 'react';
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
    Eye
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import Button from '../../components/shared/Button';
import './Welcome.css';

const Welcome = () => {
    const { theme, toggleTheme, isDark } = useTheme();
    const navigate = useNavigate();

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
                            <span className="brand-name">Smart Civic</span>
                            <span className="brand-tag">Infrastructure System</span>
                        </div>
                    </Link>

                    <div className="telemetry-pill hidden md:flex">
                        <span className="pulse-dot"></span>
                        <span>AI DEFECT &amp; REPAIR PRIORITIZATION ENGINE ACTIVE</span>
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
                                Register
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
                            <Zap size={14} />
                            <span>Municipal AI Telemetry &amp; Geo-Spatial Prioritization</span>
                        </div>

                        <h1 className="hero-title">
                            Smart Civic Infrastructure <br />
                            <span className="highlight-text">Monitoring &amp; Repair Prioritization</span> System
                        </h1>

                        <p className="hero-desc">
                            Next-generation urban infrastructure intelligence platform. Combines computer vision defect detection, GIS-based spatial vulnerability weighting, and automated multi-departmental field dispatch to keep municipal roadways and assets safe.
                        </p>

                        <div className="hero-buttons">
                            <Link to="/login" className="btn-hero-primary">
                                <span>Access Command Portal</span>
                                <ArrowRight size={18} />
                            </Link>

                            <Link to="/signup" className="btn-hero-secondary">
                                <span>Report Civic Issue</span>
                                <AlertTriangle size={18} />
                            </Link>
                        </div>

                        <div className="flex items-center gap-md text-xs text-muted">
                            <span className="flex items-center gap-xs">
                                <CheckCircle2 size={14} className="text-success" /> PostGIS Spatial Indexing
                            </span>
                            <span className="flex items-center gap-xs">
                                <CheckCircle2 size={14} className="text-success" /> Computer Vision Severity
                            </span>
                            <span className="flex items-center gap-xs">
                                <CheckCircle2 size={14} className="text-success" /> Role-Based Access Control
                            </span>
                        </div>
                    </div>

                    {/* Interactive AI Telemetry Simulation Visualizer */}
                    <div className="visualizer-card">
                        <div className="viz-header">
                            <div className="viz-title-box">
                                <Activity size={18} className="text-primary" />
                                <span>Live Defect Telemetry</span>
                            </div>
                            <span className="viz-badge">PRIORITY 1 - CRITICAL</span>
                        </div>

                        <div className="viz-image-container">
                            <img
                                src="https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80"
                                alt="Civic Road Defect AI Scan"
                                className="viz-image"
                            />
                            <div className="viz-ai-box">
                                <span className="viz-ai-tag">POTHOLE SPREAD: 0.74m²</span>
                            </div>
                        </div>

                        <div className="viz-metrics-grid">
                            <div className="viz-metric-item">
                                <p className="viz-metric-label">Composite AI Severity</p>
                                <p className="viz-metric-val critical">
                                    <span>88.5 / 100</span>
                                    <span className="text-xs">[Critical]</span>
                                </p>
                            </div>
                            <div className="viz-metric-item">
                                <p className="viz-metric-label">Spatial Proximity</p>
                                <p className="viz-metric-val">
                                    <MapPin size={14} className="text-danger" />
                                    <span>85m to Hospital Zone</span>
                                </p>
                            </div>
                            <div className="viz-metric-item">
                                <p className="viz-metric-label">Assigned Department</p>
                                <p className="viz-metric-val">
                                    <span>Roads &amp; Infra (Alpha Team)</span>
                                </p>
                            </div>
                            <div className="viz-metric-item">
                                <p className="viz-metric-label">Citizen Sentiment</p>
                                <p className="viz-metric-val">
                                    <span>Urgent (+15 weight)</span>
                                </p>
                            </div>
                        </div>

                        <div className="viz-footer-strip">
                            <span>Status: <strong>Triage &amp; Dispatched</strong></span>
                            <span className="text-muted">Target SLA: &lt; 4.0 Hours</span>
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
                        <p className="section-eyebrow">End-to-End Civic Engineering</p>
                        <h2 className="section-heading">Architected for Smarter Municipal Operations</h2>
                        <p className="section-subtext">
                            From citizen mobile reporting to high-precision AI vision scoring and field team execution, every step is optimized for city infrastructure resilience.
                        </p>
                    </div>

                    <div className="pillars-grid">
                        <div className="pillar-card">
                            <div className="pillar-icon-box">
                                <Cpu size={24} />
                            </div>
                            <h3 className="pillar-title">AI Computer Vision</h3>
                            <p className="pillar-desc">
                                Automated defect boundary and spread analysis using neural models to instantly determine pothole surface area and structural hazard.
                            </p>
                        </div>

                        <div className="pillar-card">
                            <div className="pillar-icon-box">
                                <MapPin size={24} />
                            </div>
                            <h3 className="pillar-title">GIS Spatial Weighting</h3>
                            <p className="pillar-desc">
                                Dynamic risk calculation considering proximity to schools, hospitals, transit arteries, and high-density commuter corridors.
                            </p>
                        </div>

                        <div className="pillar-card">
                            <div className="pillar-icon-box">
                                <TrendingUp size={24} />
                            </div>
                            <h3 className="pillar-title">Dynamic Prioritization</h3>
                            <p className="pillar-desc">
                                Multi-variable prioritization matrix factoring in severity scores, citizen upvotes, traffic density, and historical repair SLAs.
                            </p>
                        </div>

                        <div className="pillar-card">
                            <div className="pillar-icon-box">
                                <CheckCircle2 size={24} />
                            </div>
                            <h3 className="pillar-title">Proof-of-Work Loop</h3>
                            <p className="pillar-desc">
                                Field officers submit resolution proof images, and citizens verify or dispute closures with 100% transparency.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Direct Role Portals */}
            <section className="portals-section">
                <div className="container">
                    <div className="section-header-center">
                        <p className="section-eyebrow">Role-Based Access</p>
                        <h2 className="section-heading">Dedicated Portals for Every Stakeholder</h2>
                        <p className="section-subtext">
                            Choose your operational role to access dedicated dashboards, triage workflows, and reporting tools.
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
                                    <span className="portal-badge">Command Center</span>
                                </div>
                                <h3 className="portal-name">Super Admin</h3>
                                <p className="portal-desc">
                                    Municipal oversight, priority weight calibration, officer provisioning, and real-time city-wide analytics.
                                </p>
                                <ul className="portal-features-list">
                                    <li className="portal-feature-item">
                                        <CheckCircle2 size={15} /> System-wide defect heatmaps
                                    </li>
                                    <li className="portal-feature-item">
                                        <CheckCircle2 size={15} /> Departmental resource allocation
                                    </li>
                                    <li className="portal-feature-item">
                                        <CheckCircle2 size={15} /> Officer &amp; team management
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
                                <h3 className="portal-name">Department Officer</h3>
                                <p className="portal-desc">
                                    Field triage queue, location routing, status updates (In-Progress, Resolved), and resolution proof upload.
                                </p>
                                <ul className="portal-features-list">
                                    <li className="portal-feature-item">
                                        <CheckCircle2 size={15} /> Real-time assigned task queue
                                    </li>
                                    <li className="portal-feature-item">
                                        <CheckCircle2 size={15} /> Google Maps GPS navigation
                                    </li>
                                    <li className="portal-feature-item">
                                        <CheckCircle2 size={15} /> Direct citizen communication
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
                                    Report potholes and civic defects in seconds with image uploads, pinpoint GPS, community upvoting, and live tracking.
                                </p>
                                <ul className="portal-features-list">
                                    <li className="portal-feature-item">
                                        <CheckCircle2 size={15} /> Instant AI issue preview
                                    </li>
                                    <li className="portal-feature-item">
                                        <CheckCircle2 size={15} /> Community upvoting &amp; map view
                                    </li>
                                    <li className="portal-feature-item">
                                        <CheckCircle2 size={15} /> Real-time notification updates
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
                        Smart Civic Infrastructure Monitoring and Repair Prioritization System
                    </p>
                    <p className="footer-copy">
                        Powered by AI Computer Vision, Geo-Spatial GIS Analytics &amp; Municipal Response Infrastructure.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Welcome;
