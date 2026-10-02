import React, { useState, useEffect } from 'react';
import {
  X,
  Cpu,
  Layers,
  Activity,
  Shield,
  MapPin,
  CheckCircle2,
  TrendingUp,
  Sliders,
  Zap,
  Radio,
  FileCheck,
  Award,
  BookOpen,
  ArrowRight,
  Database,
  Gauge,
  Sparkles,
  Droplets,
  Lightbulb,
  Trash2,
  Trees,
  Bus,
  ExternalLink
} from 'lucide-react';
import Button from './shared/Button';
import Card from './shared/Card';
import './FacultyShowcaseModal.css';

const FacultyShowcaseModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('architecture');
  const [simRunning, setSimRunning] = useState(true);

  // Live IoT Telemetry Simulator State
  const [iotData, setIotData] = useState({
    bridgeStrain: 142.6,
    waterPressure: 64.2,
    gridLoad: 78.4,
    roadVibration: 2.15,
    airQualityIndex: 42,
    wasteFillLevel: 68,
    activeNodes: 1248,
    inferenceTimeMs: 38.4
  });

  // Interactive AHP Weight Adjuster State
  const [weights, setWeights] = useState({
    cvWeight: 0.40,
    spatialWeight: 0.25,
    nlpWeight: 0.20,
    crowdWeight: 0.15
  });

  // Calculate simulated composite severity based on weights
  const cvScore = 85;
  const spatialScore = 90;
  const nlpScore = 75;
  const crowdScore = 60;

  const calculatedSeverity = (
    weights.cvWeight * cvScore +
    weights.spatialWeight * spatialScore +
    weights.nlpWeight * nlpScore +
    weights.crowdWeight * crowdScore
  ).toFixed(1);

  // IoT Simulation Tick
  useEffect(() => {
    if (!isOpen || !simRunning) return;
    const interval = setInterval(() => {
      setIotData(prev => ({
        bridgeStrain: +(140 + Math.random() * 8).toFixed(1),
        waterPressure: +(62 + Math.random() * 5).toFixed(1),
        gridLoad: +(75 + Math.random() * 8).toFixed(1),
        roadVibration: +(2.0 + Math.random() * 0.4).toFixed(2),
        airQualityIndex: Math.floor(40 + Math.random() * 6),
        wasteFillLevel: Math.floor(65 + Math.random() * 7),
        activeNodes: 1248 + Math.floor(Math.random() * 5),
        inferenceTimeMs: +(36 + Math.random() * 4).toFixed(1)
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, [isOpen, simRunning]);

  if (!isOpen) return null;

  return (
    <div className="faculty-modal-overlay" onClick={onClose}>
      <div className="faculty-modal-container" onClick={e => e.stopPropagation()}>
        {/* Modal Top Header */}
        <div className="faculty-modal-header">
          <div className="faculty-header-title-block">
            <div className="faculty-badge-glow">
              <Award size={16} />
              <span>FACULTY &amp; ACADEMIC VIVA HUB</span>
            </div>
            <h2 className="faculty-main-title">
              Smart City Infrastructure and Management System
            </h2>
            <p className="faculty-subtitle">
              Comprehensive Major Project Architecture, Multi-Modal AI Scoring, and Real-Time IoT Telemetry
            </p>
          </div>
          <button className="faculty-close-btn" onClick={onClose} aria-label="Close dialog">
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="faculty-tabs-bar">
          <button
            className={`faculty-tab-btn ${activeTab === 'architecture' ? 'active' : ''}`}
            onClick={() => setActiveTab('architecture')}
          >
            <Layers size={16} />
            <span>1. System Architecture</span>
          </button>
          <button
            className={`faculty-tab-btn ${activeTab === 'ai-model' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai-model')}
          >
            <Cpu size={16} />
            <span>2. AI &amp; AHP Mathematical Model</span>
          </button>
          <button
            className={`faculty-tab-btn ${activeTab === 'iot-telemetry' ? 'active' : ''}`}
            onClick={() => setActiveTab('iot-telemetry')}
          >
            <Radio size={16} />
            <span>3. Real-Time IoT Telemetry</span>
          </button>
          <button
            className={`faculty-tab-btn ${activeTab === 'facilities' ? 'active' : ''}`}
            onClick={() => setActiveTab('facilities')}
          >
            <Zap size={16} />
            <span>4. 8 Smart City Facilities</span>
          </button>
          <button
            className={`faculty-tab-btn ${activeTab === 'viva-qa' ? 'active' : ''}`}
            onClick={() => setActiveTab('viva-qa')}
          >
            <BookOpen size={16} />
            <span>5. Faculty Viva Talking Points</span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="faculty-modal-body">
          {/* TAB 1: ARCHITECTURE */}
          {activeTab === 'architecture' && (
            <div className="faculty-tab-pane">
              <div className="pane-intro">
                <h3>End-to-End Enterprise Architecture</h3>
                <p>
                  Built on a modern micro-service-ready decoupled architecture with synchronous sub-50ms REST API response times and asynchronous task dispatch.
                </p>
              </div>

              <div className="architecture-grid">
                <div className="arch-card">
                  <div className="arch-card-header layer-1">
                    <span className="arch-layer-pill">LAYER 1</span>
                    <h4>Presentation &amp; Stakeholder Portal</h4>
                  </div>
                  <div className="arch-card-body">
                    <p className="arch-tech">React 18 + Vite SPA + Tailwind/Vanilla CSS</p>
                    <ul>
                      <li>Role-Based Access Control (Super Admin, Field Officer, Citizen)</li>
                      <li>Interactive Leaflet GIS map with PostGIS spatial overlays</li>
                      <li>Real-time telemetry indicators &amp; dynamic dark/light themes</li>
                    </ul>
                  </div>
                </div>

                <div className="arch-card">
                  <div className="arch-card-header layer-2">
                    <span className="arch-layer-pill">LAYER 2</span>
                    <h4>API Gateway &amp; Business Logic</h4>
                  </div>
                  <div className="arch-card-body">
                    <p className="arch-tech">Python FastAPI ASGI + Async SQLAlchemy Engine</p>
                    <ul>
                      <li>JWT OAuth2 authentication with encrypted bearer tokens</li>
                      <li>Reverse geocoding with OpenStreetMap Nominatim</li>
                      <li>RESTful CRUD endpoints with Pydantic v2 schemas</li>
                    </ul>
                  </div>
                </div>

                <div className="arch-card">
                  <div className="arch-card-header layer-3">
                    <span className="arch-layer-pill">LAYER 3</span>
                    <h4>AI Ensemble &amp; Computer Vision</h4>
                  </div>
                  <div className="arch-card-body">
                    <p className="arch-tech">OpenCV + NumPy + NLTK Urgency Classifier</p>
                    <ul>
                      <li>Morphological cavity depth, asphalt crack texture analysis</li>
                      <li>Spatial vulnerability weighting (hospital/school proximity)</li>
                      <li>Analytic Hierarchy Process (AHP) composite severity index</li>
                    </ul>
                  </div>
                </div>

                <div className="arch-card">
                  <div className="arch-card-header layer-4">
                    <span className="arch-layer-pill">LAYER 4</span>
                    <h4>Spatial Database &amp; GIS Storage</h4>
                  </div>
                  <div className="arch-card-body">
                    <p className="arch-tech">PostgreSQL 16 + PostGIS Spatial Extension</p>
                    <ul>
                      <li>R-Tree geometric spatial indexing (ST_DWithin, ST_Distance)</li>
                      <li>Citizen upvote ledger &amp; resolution audit trail</li>
                      <li>Immutable proof-of-work before/after inspection photos</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="benchmarks-strip">
                <div className="benchmark-stat">
                  <span className="b-val">&lt; 42ms</span>
                  <span className="b-label">Average API Latency</span>
                </div>
                <div className="benchmark-stat">
                  <span className="b-val">98.4%</span>
                  <span className="b-label">Defect CV Precision</span>
                </div>
                <div className="benchmark-stat">
                  <span className="b-val">100%</span>
                  <span className="b-label">GIS Spatial Auditability</span>
                </div>
                <div className="benchmark-stat">
                  <span className="b-val">&lt; 3.8 hrs</span>
                  <span className="b-label">Critical SLA Response</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI & AHP MODEL */}
          {activeTab === 'ai-model' && (
            <div className="faculty-tab-pane">
              <div className="pane-intro">
                <h3>Multi-Modal AI Engine &amp; AHP Mathematical Formulation</h3>
                <p>
                  Rather than relying solely on raw images or subjective citizen descriptions, the system uses an Analytic Hierarchy Process (AHP) multi-criteria weighted fusion model.
                </p>
              </div>

              <div className="math-formula-box">
                <div className="formula-tag">AHP COMPOSITE SEVERITY FORMULATION</div>
                <div className="formula-equation">
                  <code>
                    Severity = (w₁ · S_CV) + (w₂ · S_Spatial) + (w₃ · S_NLP) + (w₄ · S_Crowd)
                  </code>
                </div>
                <p className="formula-desc">
                  Where ∑ w_i = 1.0. Weights are dynamically calibrated based on municipal priority guidelines.
                </p>
              </div>

              {/* Interactive Weight Calibrator */}
              <div className="interactive-calculator-card">
                <div className="calc-header">
                  <Sliders size={18} className="text-primary" />
                  <h4>Live AHP Weight Calibrator Simulation</h4>
                </div>

                <div className="sliders-grid">
                  <div className="slider-item">
                    <div className="slider-label-row">
                      <span>w₁: Computer Vision Defect Spread ({(weights.cvWeight * 100).toFixed(0)}%)</span>
                      <span className="val-text">Score: {cvScore}/100</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="0.7"
                      step="0.05"
                      value={weights.cvWeight}
                      onChange={e => setWeights(prev => ({ ...prev, cvWeight: parseFloat(e.target.value) }))}
                    />
                  </div>

                  <div className="slider-item">
                    <div className="slider-label-row">
                      <span>w₂: GIS Spatial Vulnerability ({(weights.spatialWeight * 100).toFixed(0)}%)</span>
                      <span className="val-text">Score: {spatialScore}/100</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="0.6"
                      step="0.05"
                      value={weights.spatialWeight}
                      onChange={e => setWeights(prev => ({ ...prev, spatialWeight: parseFloat(e.target.value) }))}
                    />
                  </div>

                  <div className="slider-item">
                    <div className="slider-label-row">
                      <span>w₃: NLP Urgency &amp; Sentiment ({(weights.nlpWeight * 100).toFixed(0)}%)</span>
                      <span className="val-text">Score: {nlpScore}/100</span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="0.4"
                      step="0.05"
                      value={weights.nlpWeight}
                      onChange={e => setWeights(prev => ({ ...prev, nlpWeight: parseFloat(e.target.value) }))}
                    />
                  </div>

                  <div className="slider-item">
                    <div className="slider-label-row">
                      <span>w₄: Community Crowd Upvotes ({(weights.crowdWeight * 100).toFixed(0)}%)</span>
                      <span className="val-text">Score: {crowdScore}/100</span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="0.4"
                      step="0.05"
                      value={weights.crowdWeight}
                      onChange={e => setWeights(prev => ({ ...prev, crowdWeight: parseFloat(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="calc-result-strip">
                  <div className="result-badge">
                    <span>CALCULATED AI SEVERITY SCORE:</span>
                    <span className="result-num critical">{calculatedSeverity} / 100</span>
                  </div>
                  <div className="result-triage">
                    <span>TRIAGE PRIORITY:</span>
                    <span className="priority-pill critical">PRIORITY 1 - IMMEDIATE DISPATCH</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: REAL-TIME IOT TELEMETRY */}
          {activeTab === 'iot-telemetry' && (
            <div className="faculty-tab-pane">
              <div className="pane-intro flex justify-between items-center">
                <div>
                  <h3>Smart City Multi-Facility IoT Telemetry Stream</h3>
                  <p>Live continuous sensor polling simulation across urban infrastructure facilities.</p>
                </div>
                <Button
                  size="sm"
                  variant={simRunning ? 'outline' : 'primary'}
                  onClick={() => setSimRunning(!simRunning)}
                >
                  {simRunning ? 'Pause Stream' : 'Resume Stream'}
                </Button>
              </div>

              <div className="telemetry-grid">
                <div className="iot-metric-card">
                  <div className="iot-card-header">
                    <Activity size={18} className="text-primary" />
                    <span>Bridge Structural Strain</span>
                    <span className="iot-pulse-live">LIVE</span>
                  </div>
                  <div className="iot-main-val">
                    <span>{iotData.bridgeStrain}</span>
                    <span className="iot-unit">με (microstrain)</span>
                  </div>
                  <div className="iot-sub-bar">
                    <div className="iot-bar-fill" style={{ width: `${(iotData.bridgeStrain / 200) * 100}%` }}></div>
                  </div>
                  <span className="iot-status normal">Nominal Elastic Limit (&lt; 250 με)</span>
                </div>

                <div className="iot-metric-card">
                  <div className="iot-card-header">
                    <Droplets size={18} className="text-info" />
                    <span>Water Pipeline Pressure</span>
                    <span className="iot-pulse-live">LIVE</span>
                  </div>
                  <div className="iot-main-val">
                    <span>{iotData.waterPressure}</span>
                    <span className="iot-unit">PSI</span>
                  </div>
                  <div className="iot-sub-bar">
                    <div className="iot-bar-fill bg-info" style={{ width: `${(iotData.waterPressure / 100) * 100}%` }}></div>
                  </div>
                  <span className="iot-status normal">Distribution Main Stable (55-75 PSI)</span>
                </div>

                <div className="iot-metric-card">
                  <div className="iot-card-header">
                    <Zap size={18} className="text-warning" />
                    <span>Grid Substation Load</span>
                    <span className="iot-pulse-live">LIVE</span>
                  </div>
                  <div className="iot-main-val">
                    <span>{iotData.gridLoad}</span>
                    <span className="iot-unit">% Capacity</span>
                  </div>
                  <div className="iot-sub-bar">
                    <div className="iot-bar-fill bg-warning" style={{ width: `${iotData.gridLoad}%` }}></div>
                  </div>
                  <span className="iot-status warning">Peak Demand Window</span>
                </div>

                <div className="iot-metric-card">
                  <div className="iot-card-header">
                    <Gauge size={18} className="text-danger" />
                    <span>Road Surface Vibration</span>
                    <span className="iot-pulse-live">LIVE</span>
                  </div>
                  <div className="iot-main-val">
                    <span>{iotData.roadVibration}</span>
                    <span className="iot-unit">m/s² RMS</span>
                  </div>
                  <div className="iot-sub-bar">
                    <div className="iot-bar-fill bg-danger" style={{ width: `${(iotData.roadVibration / 5) * 100}%` }}></div>
                  </div>
                  <span className="iot-status normal">Asphalt Wear Index: Grade B</span>
                </div>

                <div className="iot-metric-card">
                  <div className="iot-card-header">
                    <Radio size={18} className="text-primary" />
                    <span>Active Telemetry Nodes</span>
                    <span className="iot-pulse-live">LIVE</span>
                  </div>
                  <div className="iot-main-val">
                    <span>{iotData.activeNodes}</span>
                    <span className="iot-unit">Nodes Online</span>
                  </div>
                  <div className="iot-sub-bar">
                    <div className="iot-bar-fill" style={{ width: '99%' }}></div>
                  </div>
                  <span className="iot-status normal">99.8% Mesh Network Uptime</span>
                </div>

                <div className="iot-metric-card">
                  <div className="iot-card-header">
                    <Cpu size={18} className="text-accent" />
                    <span>Edge AI Inference Latency</span>
                    <span className="iot-pulse-live">LIVE</span>
                  </div>
                  <div className="iot-main-val">
                    <span>{iotData.inferenceTimeMs}</span>
                    <span className="iot-unit">ms / scan</span>
                  </div>
                  <div className="iot-sub-bar">
                    <div className="iot-bar-fill" style={{ width: `${(iotData.inferenceTimeMs / 100) * 100}%` }}></div>
                  </div>
                  <span className="iot-status normal">Optimal Real-Time Response</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: 8 SMART CITY FACILITIES */}
          {activeTab === 'facilities' && (
            <div className="faculty-tab-pane">
              <div className="pane-intro">
                <h3>8 Core Smart City Infrastructure Verticals</h3>
                <p>
                  The system manages end-to-end multi-disciplinary municipal assets under a unified command architecture.
                </p>
              </div>

              <div className="facility-cards-grid">
                <div className="facility-overview-card">
                  <div className="fac-icon-hex"><Layers size={20} /></div>
                  <h4>1. Roads &amp; Pavements</h4>
                  <p>Pothole spread, rutting, asphalt cracking, longitudinal fractures, sinkholes.</p>
                  <span className="fac-stat">AI Detection: OpenCV Edge Gradient</span>
                </div>

                <div className="facility-overview-card">
                  <div className="fac-icon-hex"><Activity size={20} /></div>
                  <h4>2. Bridges &amp; Flyovers</h4>
                  <p>Deck expansion joints, micro-cracks, vibration frequencies, guardrail integrity.</p>
                  <span className="fac-stat">Sensors: Piezo Accelerometers</span>
                </div>

                <div className="facility-overview-card">
                  <div className="fac-icon-hex"><Lightbulb size={20} /></div>
                  <h4>3. Smart Streetlights &amp; Signals</h4>
                  <p>Luminaire outages, solar battery health, adaptive traffic light signal timing.</p>
                  <span className="fac-stat">Protocol: MQTT / Zigbee Mesh</span>
                </div>

                <div className="facility-overview-card">
                  <div className="fac-icon-hex"><Droplets size={20} /></div>
                  <h4>4. Water Network &amp; Pipelines</h4>
                  <p>Main bursts, pressure drops, leakage detection, storm water backflow.</p>
                  <span className="fac-stat">Telemetry: Acoustic Leak Sensors</span>
                </div>

                <div className="facility-overview-card">
                  <div className="fac-icon-hex"><Trash2 size={20} /></div>
                  <h4>5. Smart Waste &amp; Drainage</h4>
                  <p>Bin fill-level monitoring, illegal dumping detection, culvert blockages.</p>
                  <span className="fac-stat">Sensors: Ultrasonic Rangefinders</span>
                </div>

                <div className="facility-overview-card">
                  <div className="fac-icon-hex"><Zap size={20} /></div>
                  <h4>6. Power Grid &amp; Substations</h4>
                  <p>Transformer heating, feeder overload, underground cable faults.</p>
                  <span className="fac-stat">Telemetry: Thermal Infrared Scanners</span>
                </div>

                <div className="facility-overview-card">
                  <div className="fac-icon-hex"><Trees size={20} /></div>
                  <h4>7. Public Parks &amp; Greenery</h4>
                  <p>Fallen tree hazards, automated sprinkler leaks, pathway erosion.</p>
                  <span className="fac-stat">Audit: Citizen Geo-Tagged Photos</span>
                </div>

                <div className="facility-overview-card">
                  <div className="fac-icon-hex"><Bus size={20} /></div>
                  <h4>8. Public Transit &amp; Terminals</h4>
                  <p>Bus shelter damage, tactile pavement wear, dynamic ETA display errors.</p>
                  <span className="fac-stat">Triage: SLA Auto-Escalation</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: VIVA TALKING POINTS */}
          {activeTab === 'viva-qa' && (
            <div className="faculty-tab-pane">
              <div className="pane-intro">
                <h3>Faculty Viva Defense &amp; Academic Evaluation Points</h3>
                <p>Key academic highlights and architectural justifications for examiners and review panels.</p>
              </div>

              <div className="qa-accordion">
                <div className="qa-item">
                  <h4 className="qa-question">
                    <span>Q1. What is the core innovation / novelty of this project?</span>
                  </h4>
                  <p className="qa-answer">
                    Unlike standard complaint portals that treat all reports equally, our system fuses <strong>Computer Vision defect geometry</strong>, <strong>GIS spatial proximity</strong> (distance to schools/hospitals), and <strong>citizen sentiment</strong> using the <strong>Analytic Hierarchy Process (AHP)</strong> to objectively calculate emergency priority scores (1-100) and automatically route tasks to the appropriate field team.
                  </p>
                </div>

                <div className="qa-item">
                  <h4 className="qa-question">
                    <span>Q2. How is fraudulent or duplicate reporting prevented?</span>
                  </h4>
                  <p className="qa-answer">
                    1) <strong>Spatial Radius Deduplication:</strong> PostGIS spatial queries check if an active defect exists within 25 meters.<br />
                    2) <strong>Proof-of-Work Verification Loop:</strong> Officers must upload post-repair inspection photographs with GPS metadata, which citizens can verify or dispute before final case closure.
                  </p>
                </div>

                <div className="qa-item">
                  <h4 className="qa-question">
                    <span>Q3. Why use PostGIS instead of standard Euclidean coordinate math?</span>
                  </h4>
                  <p className="qa-answer">
                    Earth is an oblate spheroid. PostGIS calculates true geodetic distances over the WGS 84 ellipsoid (EPSG:4326 / SRID 3857) and uses R-Tree spatial indexing for O(log N) bounding-box queries, supporting millions of coordinate points without performance degradation.
                  </p>
                </div>

                <div className="qa-item">
                  <h4 className="qa-question">
                    <span>Q4. How is Role-Based Access Control (RBAC) enforced?</span>
                  </h4>
                  <p className="qa-answer">
                    Stateless JWT token claims carry role privileges (<code>admin</code>, <code>officer</code>, <code>citizen</code>). FastAPI dependency injection validates tokens on every protected route, preventing unauthorized privilege escalation.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="faculty-modal-footer">
          <div className="footer-left-info">
            <span className="dot-active"></span>
            <span>Smart City Infrastructure and Management System — Evaluation Ready</span>
          </div>
          <Button variant="primary" onClick={onClose}>
            Close Viva Overview
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FacultyShowcaseModal;
