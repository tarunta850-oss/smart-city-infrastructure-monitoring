import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, LogIn, Shield, Users, User, ArrowLeft, KeyRound } from 'lucide-react';
import Button from '../../components/shared/Button';
import Card from '../../components/shared/Card';
import './Auth.css';
import { getApiBaseUrl } from '../../api';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        if (e) e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const userInfo = await login(email, password);
            const role = userInfo?.role;
            if (role === 'admin') {
                navigate('/admin/dashboard');
            } else if (role === 'officer') {
                navigate('/officer/dashboard');
            } else {
                navigate('/citizen/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleQuickFill = (demoEmail, demoPw) => {
        setEmail(demoEmail);
        setPassword(demoPw);
        setError('');
    };

    return (
        <div className="auth-container">
            <div className="auth-content">
                <div className="auth-top-bar">
                    <Link to="/" className="back-link">
                        <ArrowLeft size={16} />
                        <span>Back to Home</span>
                    </Link>
                </div>

                <div className="auth-header">
                    <div className="logo-large">
                        <Shield size={32} />
                    </div>
                    <span className="auth-badge-pill">MUNICIPAL COMMAND ACCESS PORTAL</span>
                    <h1 className="auth-title">Smart City Infrastructure</h1>
                    <p className="auth-subtitle">&amp; Management System</p>
                </div>

                <Card className="auth-card">
                    <div className="auth-card-title-box">
                        <h2 className="text-xl font-bold">Sign In to Command Portal</h2>
                        <p className="text-xs text-muted">Enter your registered credentials or select a demo role below</p>
                    </div>

                    {/* Quick Demo Fill Selector */}
                    <div className="quick-demo-section">
                        <span className="quick-demo-label">
                            <KeyRound size={13} />
                            <span>Quick Demo Accounts:</span>
                        </span>
                        <div className="demo-pills-row">
                            <button
                                type="button"
                                className="demo-pill admin"
                                onClick={() => handleQuickFill('tarunta850@gmail.com', 'password123')}
                                title="Fill Tarun (Admin) credentials"
                            >
                                👑 Super Admin
                            </button>
                            <button
                                type="button"
                                className="demo-pill officer"
                                onClick={() => handleQuickFill('priya.officer@city.gov', 'password123')}
                                title="Fill Priya (Officer) credentials"
                            >
                                👮 Officer
                            </button>
                            <button
                                type="button"
                                className="demo-pill citizen"
                                onClick={() => handleQuickFill('citizen@example.com', 'citizen123')}
                                title="Fill Citizen credentials"
                            >
                                👤 Citizen
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="auth-error-banner">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="email" className="form-label">Email Address</label>
                            <div className="input-with-icon">
                                <Mail size={18} className="input-icon" />
                                <input
                                    id="email"
                                    type="email"
                                    className="form-input"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="password" className="form-label">Password</label>
                            <div className="input-with-icon">
                                <Lock size={18} className="input-icon" />
                                <input
                                    id="password"
                                    type="password"
                                    className="form-input"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            fullWidth
                            size="lg"
                            disabled={loading}
                            icon={LogIn}
                        >
                            {loading ? 'Authenticating...' : 'Sign In'}
                        </Button>

                        <div className="auth-divider">
                            <span>OR</span>
                        </div>

                        <Button
                            variant="outline"
                            fullWidth
                            size="lg"
                            onClick={() => window.location.href = `${getApiBaseUrl()}/auth/google/login`}
                            type="button"
                        >
                            <svg className="btn-icon" width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fillRule="evenodd" fillOpacity="1" fill="#4285F4" stroke="none"></path>
                                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.715H.957v2.332A8.997 8.997 0 0 0 9 18z" fillRule="evenodd" fillOpacity="1" fill="#34A853" stroke="none"></path>
                                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fillRule="evenodd" fillOpacity="1" fill="#FBBC05" stroke="none"></path>
                                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fillRule="evenodd" fillOpacity="1" fill="#EA4335" stroke="none"></path>
                            </svg>
                            Sign in with Google
                        </Button>
                    </form>

                    <div className="auth-footer">
                        <p className="text-sm text-muted">
                            Need a citizen account? <Link to="/signup" className="auth-link">Sign Up Here</Link>
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Login;
