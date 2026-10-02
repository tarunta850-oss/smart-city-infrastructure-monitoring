import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, UserPlus, Shield, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/shared/Button';
import Card from '../../components/shared/Card';
import './Auth.css';
import { getApiBaseUrl } from '../../api';

const Signup = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            // Public sign-ups are strictly registered as citizen
            const user = await signup(formData.name, formData.email, formData.password, 'citizen');
            if (user.role === 'officer') {
                navigate('/officer/dashboard');
            } else if (user.role === 'admin') {
                navigate('/admin/dashboard');
            } else {
                navigate('/citizen/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Signup failed. Please try again.');
        } finally {
            setLoading(false);
        }
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
                    <span className="auth-badge-pill">CITIZEN ENGAGEMENT NETWORK</span>
                    <h1 className="auth-title">Smart City Infrastructure</h1>
                    <p className="auth-subtitle">&amp; Management System</p>
                </div>

                <Card className="auth-card">
                    <div className="auth-card-title-box">
                        <h2 className="text-xl font-bold">Create Citizen Account</h2>
                        <p className="text-xs text-muted">Join the municipal network to report defects, track repairs, and improve urban infrastructure</p>
                    </div>

                    {error && (
                        <div style={{
                            padding: '0.75rem',
                            marginBottom: '1rem',
                            backgroundColor: '#fee',
                            color: '#c00',
                            borderRadius: '0.25rem',
                            fontSize: '0.875rem'
                        }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="name" className="form-label">Full Name</label>
                            <div className="input-with-icon">
                                <User size={18} className="input-icon" />
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    className="form-input"
                                    placeholder="Enter your full name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="email" className="form-label">Email</label>
                            <div className="input-with-icon">
                                <Mail size={18} className="input-icon" />
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    className="form-input"
                                    placeholder="Enter your email"
                                    value={formData.email}
                                    onChange={handleChange}
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
                                    name="password"
                                    type="password"
                                    className="form-input"
                                    placeholder="Create a password (min. 6 characters)"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                            <div className="input-with-icon">
                                <Lock size={18} className="input-icon" />
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    className="form-input"
                                    placeholder="Confirm your password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            fullWidth
                            size="lg"
                            disabled={loading}
                            icon={UserPlus}
                        >
                            {loading ? 'Creating Citizen Account...' : 'Sign Up as Citizen'}
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
                            Sign up with Google
                        </Button>
                    </form>

                    <div className="auth-footer">
                        <p className="text-sm text-muted">
                            Already have an account? <Link to="/login" className="auth-link">Sign In</Link>
                        </p>
                        <p className="text-xs text-muted mt-sm flex items-center justify-center gap-1">
                            <Shield size={13} className="text-primary" /> Municipal officer accounts are provisioned by City Administration.
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Signup;
