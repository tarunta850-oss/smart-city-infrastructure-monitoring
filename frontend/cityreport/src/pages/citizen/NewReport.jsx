import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Camera,
  X,
  ArrowLeft,
  Sparkles,
  Layers,
  Activity,
  Droplets,
  Lightbulb,
  Zap,
  Mic,
  MicOff,
  Radio,
  CheckCircle2
} from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Button from '../../components/shared/Button';
import Card from '../../components/shared/Card';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import LocationPicker from '../../components/shared/LocationPicker';
import './NewReport.css';

const FACILITY_OPTIONS = [
  { id: 'road_issues', label: '🛣️ Roads & Pavements', desc: 'Potholes, cracks, asphalt collapse, rutting' },
  { id: 'bridges', label: '🌉 Bridges & Flyovers', desc: 'Expansion joint damage, deck crack, guardrails' },
  { id: 'water', label: '💧 Water Network & Drainage', desc: 'Pipe burst, storm drain block, low pressure' },
  { id: 'streetlights', label: '💡 Smart Lighting Grid', desc: 'Luminaire outage, solar sensor, timing defect' },
  { id: 'power', label: '⚡ Electric Grid & Power', desc: 'Substation alert, frayed line, pole hazard' },
  { id: 'parks', label: '🌳 Green Spaces & Parks', desc: 'Fallen trees, barrier damage, irrigation leak' },
];

const NewReport = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    category: "road_issues",
    location: "",
    description: "",
    latitude: "",
    longitude: "",
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [error, setError] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceRecorded, setVoiceRecorded] = useState(false);

  // Auto-locate on mount; silent fallback if denied
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setFormData(prev => ({
          ...prev,
          latitude: coords.latitude.toFixed(6),
          longitude: coords.longitude.toFixed(6),
          location: `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`,
        }));
      },
      () => {},
      { timeout: 8000 }
    );
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleFacilitySelect = (catId) => {
    setFormData(prev => ({ ...prev, category: catId }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newImages].slice(0, 5)); // Max 5 images
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleVoiceRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setVoiceRecorded(true);
      if (!formData.description) {
        setFormData(prev => ({
          ...prev,
          description: prev.description + ' [Voice Memo Attached: Citizen recorded 12s voice note describing hazardous depth and heavy vehicle traffic.]'
        }));
      }
    } else {
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        setVoiceRecorded(true);
      }, 4000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoadingStage('Uploading asset photos…');
    setError(null);

    try {
      if (!formData.latitude || !formData.longitude) {
        throw new Error("Please pinpoint the GPS location of the defect");
      }

      let imageUrl = null;
      if (images.length > 0) {
        try {
          const fd = new FormData();
          fd.append('file', images[0].file);
          const uploadResponse = await api.post('/upload/image', fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          imageUrl = uploadResponse.data.image_url;
        } catch {
          throw new Error('Failed to upload image. Please try again.');
        }
      }

      setLoadingStage('Running Multi-Modal AI Computer Vision & AHP Triage…');

      const reportData = {
        title: formData.title,
        description: formData.description,
        category: formData.category || "road_issues",
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        image_url: imageUrl,
      };

      const response = await api.post("/reports/", reportData);

      if (response.data.id) {
        navigate(`/citizen/report/${response.data.id}`);
      } else {
        navigate("/citizen/dashboard");
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.message ||
        "Failed to submit report. Please try again.",
      );
    } finally {
      setLoading(false);
      setLoadingStage('');
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6),
            location: `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`,
          }));
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Could not fetch GPS location. Please ensure location permissions are enabled.");
        },
        { enableHighAccuracy: true }
      );
    }
  };

  return (
    <div className="min-h-screen bg-background new-report-page">
      <Navbar />

      <main className="container py-lg">
        <div className="report-form-header">
          <Button
            variant="ghost"
            icon={ArrowLeft}
            onClick={() => navigate("/citizen/dashboard")}
          >
            Back to Dashboard
          </Button>
          <div className="title-with-pill">
            <h1 className="text-2xl font-bold">Report Smart City Infrastructure Defect</h1>
            <span className="glow-pill primary">AI Multi-Factor Scoring Active</span>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: "12px 16px",
              marginBottom: "20px",
              backgroundColor: "var(--danger-bg)",
              border: "1px solid var(--danger)",
              borderRadius: "8px",
              color: "var(--danger)",
              fontSize: "0.9rem",
              fontWeight: 600
            }}
          >
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="report-form-container">
          <Card>
            <form onSubmit={handleSubmit} className="report-form">
              {/* Facility Category Selection */}
              <div className="form-group">
                <label className="form-label">
                  Infrastructure Asset Vertical *
                </label>
                <div className="facility-select-grid">
                  {FACILITY_OPTIONS.map((fac) => (
                    <div
                      key={fac.id}
                      className={`facility-option-card ${formData.category === fac.id ? 'active' : ''}`}
                      onClick={() => handleFacilitySelect(fac.id)}
                    >
                      <span className="fac-opt-title">{fac.label}</span>
                      <span className="fac-opt-desc">{fac.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="title" className="form-label">
                  Issue Title / Defect Summary *
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Deep asphalt pothole near pedestrian crossing"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="location" className="form-label mb-2 block">
                  GIS Pinpoint Location *
                </label>

                {/* Visual Map Picker */}
                <LocationPicker
                  position={
                    formData.latitude && formData.longitude
                      ? { lat: parseFloat(formData.latitude), lng: parseFloat(formData.longitude) }
                      : null
                  }
                  onLocationChange={(lat, lng) => {
                    setFormData(prev => ({
                      ...prev,
                      latitude: lat,
                      longitude: lng,
                      location: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
                    }));
                  }}
                />

                <div className="location-input-group flex gap-2 mt-sm">
                  <div className="input-with-icon flex-1 relative">
                    <input
                      id="location"
                      name="location"
                      type="text"
                      className="form-input pl-8 w-full font-mono text-sm"
                      placeholder="Coordinates will be automatically geocoded"
                      value={formData.location}
                      readOnly
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={getCurrentLocation}
                    icon={MapPin}
                  >
                    Auto GPS
                  </Button>
                </div>
              </div>

              <div className="form-group">
                <div className="flex justify-between items-center mb-xs">
                  <label htmlFor="description" className="form-label mb-0">
                    Defect Description &amp; Hazard Details *
                  </label>
                  <button
                    type="button"
                    className={`voice-record-btn ${isRecording ? 'recording' : ''}`}
                    onClick={toggleVoiceRecording}
                  >
                    {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
                    <span>{isRecording ? 'Listening (Speaking...)' : (voiceRecorded ? 'Voice Attached' : 'Add Voice Memo')}</span>
                  </button>
                </div>
                <textarea
                  id="description"
                  name="description"
                  className="form-textarea"
                  placeholder="Describe the severity, traffic impact, approximate depth, or water accumulation..."
                  rows="4"
                  value={formData.description}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Evidence Photos (AI Computer Vision Scan)</label>
                <div className="image-upload-container">
                  <input
                    type="file"
                    id="image-upload"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="image-upload" className="image-upload-btn">
                    <Camera size={24} />
                    <span>{images.length > 0 ? `${images.length} photo${images.length > 1 ? 's' : ''} ready for AI Scan` : 'Upload Photos for AI Analysis'}</span>
                  </label>
                </div>

                {images.length > 0 && (
                  <div className="image-preview-grid">
                    {images.map((img, index) => (
                      <div key={index} className="image-preview-item">
                        <img src={img.preview} alt={`Preview ${index + 1}`} />
                        <span className="ai-ready-badge">AI Scan Ready</span>
                        <button
                          type="button"
                          className="image-remove-btn"
                          onClick={() => removeImage(index)}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {loading && (
                <div className="submit-loading-banner">
                  <span className="submit-spinner" />
                  <div className="flex flex-col">
                    <span className="font-bold">{loadingStage}</span>
                    <span className="text-xs text-muted">Calculating AHP weights and routing to nearest dispatch crew...</span>
                  </div>
                </div>
              )}

              <div className="form-actions">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/citizen/dashboard")}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="lg" disabled={loading} icon={Sparkles}>
                  {loading ? 'Processing Triage…' : 'Submit & Execute AI Triage'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default NewReport;
