import React, { useState } from 'react';
import {
  Cpu,
  Layers,
  Maximize2,
  Activity,
  Sparkles,
  Info,
  Gauge,
  MapPin,
  Building2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Card from './shared/Card';
import './AIAnalysisCard.css';

const ROAD_LABELS = {
  motorway: 'Motorway',
  motorway_link: 'Motorway Link',
  trunk: 'Trunk Road',
  trunk_link: 'Trunk Link',
  primary: 'Primary Road',
  primary_link: 'Primary Link',
  secondary: 'Secondary Road',
  secondary_link: 'Secondary Link',
  tertiary: 'Tertiary Road',
  tertiary_link: 'Tertiary Link',
  unclassified: 'Unclassified Road',
  residential: 'Residential Road',
  service: 'Service Road',
  track: 'Track',
  path: 'Path',
};

const DAMAGE_LABELS = {
  pothole: 'Pothole',
  longitudinal_crack: 'Longitudinal Crack',
  transverse_crack: 'Transverse Crack',
  alligator_crack: 'Alligator Crack',
  surface_failure: 'Surface Failure',
  waterlogging: 'Waterlogging',
  debris: 'Debris',
  other: 'Other',
};

const scoreColor = (pct) => {
  if (pct >= 75) return '#ef4444';
  if (pct >= 50) return '#f59e0b';
  if (pct >= 25) return '#3b82f6';
  return '#10b981';
};

const severityColor = (level) => {
  switch ((level || '').toLowerCase()) {
    case 'critical': return '#ef4444';
    case 'high': return '#f59e0b';
    case 'medium': return '#3b82f6';
    default: return '#10b981';
  }
};

const ScoreBar = ({ label, value, weight, subtext }) => {
  const pct = Math.round(Math.min(Math.max(value ?? 0, 0), 100));
  const color = scoreColor(pct);
  return (
    <div className="ahp-factor-row">
      <div className="ahp-factor-header">
        <div className="ahp-factor-title">
          <span className="ahp-factor-label">{label}</span>
          {weight && <span className="ahp-factor-weight">{weight} weight</span>}
        </div>
        <span className="ahp-factor-score" style={{ color }}>{pct}/100</span>
      </div>
      <div className="ahp-bar-track">
        <div className="ahp-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      {subtext && <div className="ahp-factor-subtext">{subtext}</div>}
    </div>
  );
};

const StatChip = ({ icon: Icon, label, value, color }) => (
  <div className="stat-chip" style={{ borderColor: color + '55', background: color + '0f' }}>
    <span className="stat-chip-icon" style={{ color }}>
      <Icon size={16} />
    </span>
    <div className="stat-chip-body">
      <span className="stat-chip-label">{label}</span>
      <span className="stat-chip-value" style={{ color }}>{value}</span>
    </div>
  </div>
);

const AIAnalysisCard = ({ report }) => {
  const [expanded, setExpanded] = useState(true);

  if (!report.ai_severity_score) return null;

  const sentimentMeta = (() => {
    try {
      return typeof report.sentiment_meta === 'string'
        ? JSON.parse(report.sentiment_meta)
        : report.sentiment_meta || {};
    } catch { return {}; }
  })();

  const locationMeta = (() => {
    try {
      return typeof report.location_meta === 'string'
        ? JSON.parse(report.location_meta)
        : report.location_meta || {};
    } catch { return {}; }
  })();

  const isGroq = sentimentMeta.source === 'groq-vision-ahp';
  const score = Math.round(report.ai_severity_score ?? 0);
  const level = (report.ai_severity_level || 'low').toLowerCase();
  const circleColor = severityColor(level);
  const circumference = 2 * Math.PI * 45;
  const dashOffset = circumference - (score / 100) * circumference;

  const imageScore = sentimentMeta.image_score ?? (
    sentimentMeta.visual_score !== undefined
      ? sentimentMeta.visual_score
      : ((report.pothole_spread_score ?? 0.5) * 100)
  );
  const locationScore = sentimentMeta.location_score ?? ((report.location_score ?? 0.5) * 100);
  const trafficScore = sentimentMeta.traffic_score ?? locationMeta.traffic_score ?? 45;
  const upvoteScore = sentimentMeta.upvote_score ?? ((report.upvote_score ?? 0) * 100);
  const descScore = sentimentMeta.description_score ?? sentimentMeta.sentiment_score ?? ((report.emotion_score ?? 0.5) * 100);

  // Physical damage metrics
  const depthPct = Math.round(sentimentMeta.vision?.cavity_score ? sentimentMeta.vision.cavity_score * 100 : (report.pothole_depth_score ?? 0.7) * 100);
  const spreadPct = Math.round(sentimentMeta.spread_score ?? (report.pothole_spread_score ? report.pothole_spread_score * 100 : 65));

  // Pothole count: available from YOLO detector or CV in heuristic path
  const detectorMeta = sentimentMeta.visual_meta?.detector || sentimentMeta.vision;
  const potholeCount = detectorMeta?.count ?? (sentimentMeta.vision ? 1 : null);
  const maxAreaRatio = detectorMeta?.max_area_ratio ?? sentimentMeta.vision?.dark_ratio ?? null;

  const trafficLabel = locationMeta.traffic_label;
  const nearbyPois = locationMeta.nearby_pois || {};
  const nearbySummary = locationMeta.nearby_critical_places;
  const damageType = sentimentMeta.damage_type || sentimentMeta.vision?.damage_label || 'pothole';
  const explanation = sentimentMeta.explanation;
  const confidence = sentimentMeta.confidence ?? 0.92;

  const hasPois = Object.keys(nearbyPois).length > 0;

  return (
    <Card className="ai-card">

      {/* ── Header ── */}
      <div className="ai-card-header">
        <div className="ai-card-title">
          <div className="ai-icon-wrapper">
            <Cpu size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="ai-heading">AI Severity Analysis</h3>
            <span className={`ai-source-badge ${isGroq ? 'groq' : 'heuristic'}`}>
              {isGroq
                ? 'AI Vision Model + AHP'
                : 'CV Vision Engine + AHP'}
            </span>
          </div>
        </div>
        <button className="ai-toggle-btn" onClick={() => setExpanded(e => !e)} aria-label="Toggle details">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* ── Score gauge + summary ── */}
      <div className="ai-gauge-row">
        <div className="ai-gauge">
          <svg viewBox="0 0 100 100" className="ai-gauge-svg">
            <circle cx="50" cy="50" r="45" className="gauge-bg" />
            <circle
              cx="50" cy="50" r="45"
              className="gauge-fill"
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: dashOffset,
                stroke: circleColor,
              }}
            />
          </svg>
          <div className="ai-gauge-text">
            <span className="ai-gauge-value" style={{ color: circleColor }}>{score}</span>
            <span className="ai-gauge-denom">/100</span>
          </div>
        </div>
        <div className="ai-gauge-summary">
          <div
            className="ai-severity-badge"
            style={{ background: circleColor + '20', border: `1.5px solid ${circleColor}`, color: circleColor }}
          >
            {level.toUpperCase()}
          </div>
          {damageType && (
            <div>
              <span className="ai-detail-label">Damage Classification</span>
              <span className="ai-damage-value">{DAMAGE_LABELS[damageType] || damageType}</span>
            </div>
          )}
          {confidence !== undefined && (
            <div>
              <span className="ai-detail-label">Model Confidence</span>
              <span className="ai-confidence-value">{Math.round(confidence * 100)}%</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Physical Damage Stats ── */}
      <div className="ai-stat-row">
        {potholeCount !== null && (
          <StatChip
            icon={Layers}
            label="Potholes Detected"
            value={`${potholeCount}`}
            color={scoreColor(potholeCount >= 3 ? 80 : potholeCount >= 2 ? 55 : 30)}
          />
        )}
        {isGroq && potholeCount === null && (
          <StatChip
            icon={Layers}
            label="Defect Verification"
            value="AI Analyzed"
            color="#7c3aed"
          />
        )}
        <StatChip
          icon={Maximize2}
          label="Depth Score"
          value={`${depthPct}%`}
          color={scoreColor(depthPct)}
        />
        <StatChip
          icon={Activity}
          label="Spread Score"
          value={`${spreadPct}%`}
          color={scoreColor(spreadPct)}
        />
        {maxAreaRatio !== null && (
          <StatChip
            icon={Sparkles}
            label="Surface Area Ratio"
            value={`${(maxAreaRatio * 100).toFixed(1)}%`}
            color={scoreColor(maxAreaRatio * 400)}
          />
        )}
      </div>

      {/* ── AI Explanation ── */}
      {explanation && (
        <div className="ai-explanation">
          <div className="ai-explanation-icon">
            <Info size={16} />
          </div>
          <p className="ai-explanation-text">{explanation}</p>
        </div>
      )}

      {expanded && (
        <>
          {/* ── AHP Factor Breakdown ── */}
          <div className="ai-section">
            <div className="ai-section-title">AHP Score Breakdown</div>
            <div className="ahp-factors">
              <ScoreBar
                label="Image Defect Analysis"
                value={imageScore}
                weight="40%"
                subtext={
                  isGroq
                    ? 'Vision model analyzed the uploaded damage photo directly'
                    : 'Pixel heuristics: depression cavity, edge fractures, surface contrast'
                }
              />
              <ScoreBar
                label="Location & Infrastructure Risk"
                value={locationScore}
                weight="20%"
                subtext={
                  nearbySummary && nearbySummary !== 'no critical locations nearby'
                    ? nearbySummary
                    : 'No critical facilities detected within 500 m'
                }
              />
              <ScoreBar
                label="Traffic Density"
                value={trafficScore}
                weight="20%"
                subtext={trafficLabel ? (ROAD_LABELS[trafficLabel] || trafficLabel) : undefined}
              />
              <ScoreBar
                label="Community Upvotes"
                value={upvoteScore}
                weight="10%"
                subtext={`${report.upvotes ?? 0} citizen upvote${(report.upvotes ?? 0) !== 1 ? 's' : ''} recorded`}
              />
              <ScoreBar
                label="Description & Urgency"
                value={descScore}
                weight="10%"
              />
            </div>
          </div>

          {/* ── Traffic Details ── */}
          {trafficLabel && (
            <div className="ai-section">
              <div className="ai-section-title">Traffic Assessment</div>
              <div className="ai-traffic-card">
                <div className="ai-traffic-icon">
                  <Gauge size={18} />
                </div>
                <div className="ai-traffic-info">
                  <span className="ai-traffic-road">{ROAD_LABELS[trafficLabel] || trafficLabel}</span>
                  <span className="ai-traffic-score">
                    Traffic density score: <strong>{Math.round(trafficScore)}/100</strong>
                  </span>
                  {locationMeta.coordinates_supplied && (
                    <span className="ai-traffic-coords">
                      GPS: {locationMeta.latitude?.toFixed(5)}, {locationMeta.longitude?.toFixed(5)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Nearby Critical Places ── */}
          {hasPois && (
            <div className="ai-section">
              <div className="ai-section-title">Nearby Critical Facilities</div>
              <div className="ai-poi-grid">
                {Object.entries(nearbyPois).map(([type, names]) => (
                  <div key={type} className="ai-poi-chip">
                    <span className="ai-poi-icon">
                      <Building2 size={15} />
                    </span>
                    <div className="ai-poi-details">
                      <span className="ai-poi-type">{type.replace('_', ' ')}</span>
                      {Array.isArray(names) && names.slice(0, 2).map((name, i) => (
                        <span key={i} className="ai-poi-name">{name}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Footer ── */}
          <div className="ai-footer">
            <span className="ai-footer-mode">
              {isGroq ? 'AI Vision + OSM Geospatial' : 'CV Heuristic + OSM Geospatial'}
            </span>
            {locationMeta.geospatial_enrichment && (
              <span className="ai-footer-tag">OSM Enriched</span>
            )}
            {isGroq && (
              <span className="ai-footer-tag ai-footer-tag-groq">AI Image Analysis</span>
            )}
          </div>
        </>
      )}
    </Card>
  );
};

export default AIAnalysisCard;
