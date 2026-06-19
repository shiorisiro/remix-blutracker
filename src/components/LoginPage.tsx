import React, { useState } from 'react';
import { signInWithEmail, signUpWithEmail } from '../auth';

export const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [emailError, setEmailError] = useState(false);
    const [passwordError, setPasswordError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [generalError, setGeneralError] = useState('');
    const [isRegisterMode, setIsRegisterMode] = useState(false);

    const validateEmail = (email: string) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const validatePasswordStrength = (password: string) => {
        // Minimum 8 characters, at least one uppercase, one lowercase, one digit, one special character
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password);
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
        if (emailError) {
            setEmailError(!validateEmail(e.target.value));
        }
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
        if (passwordError) {
            setPasswordError(!validatePasswordStrength(e.target.value));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const isEmailValid = validateEmail(email);
        const isPasswordValid = validatePasswordStrength(password);

        setEmailError(!isEmailValid);
        setPasswordError(!isPasswordValid);

        if (isEmailValid && isPasswordValid) {
            setIsLoading(true);
            setGeneralError('');
            try {
                if (isRegisterMode) {
                    await signUpWithEmail(email.trim(), password.trim(), email.split('@')[0]);
                } else {
                    await signInWithEmail(email.trim(), password.trim());
                }
                // Success - App.tsx onAuthStateChanged will handle the rest
            } catch (err: any) {
                console.log(err);
                let errMsg = err.message || '';
                if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || errMsg.includes('Invalid credentials')) {
                    errMsg = "Email atau kata sandi salah. Silakan periksa kembali.";
                } else if (err.code === 'auth/email-already-in-use') {
                    errMsg = "Email sudah digunakan oleh akun lain.";
                }
                // We'll just show the error message in the form
                setGeneralError(errMsg);
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <>
            <style>{`
                :root {
                    --bg-color: #08090B;
                    --card-bg: #0D0F12;
                    --text-main: #FFFFFF;
                    --text-muted: #9CA3AF;
                    --border-color: #22272F;
                    --border-focus: #CFFF0F;
                    --primary-btn: #CFFF0F;
                    --primary-btn-hover: #E4FF54;
                    --error-color: #EF4444;
                    --radius: 24px;
                    --transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    
                    /* Border Draw Animation Properties */
                    --border-thickness: 1.5px;
                    --anim-duration: 4s;
                }
                
                .login-page-body {
                    background-color: var(--bg-color);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    padding: 24px;
                    font-family: 'Outfit', 'Inter', sans-serif;
                }
 
                .login-card-container {
                    position: relative;
                    width: 100%;
                    max-width: 380px;
                    padding: var(--border-thickness);
                    border-radius: calc(var(--radius) + var(--border-thickness));
                    overflow: hidden;
                    background: var(--border-color);
                    opacity: 0;
                    transform: translateY(10px);
                    animation: fadeIn 0.5s ease forwards;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
                }
 
                .login-card-container::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: conic-gradient(
                        transparent, 
                        transparent, 
                        transparent, 
                        var(--border-focus)
                    );
                    animation: rotateBorder var(--anim-duration) linear infinite;
                }
 
                @keyframes rotateBorder {
                    100% {
                        transform: rotate(360deg);
                    }
                }
 
                @keyframes fadeIn {
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
 
                .login-card {
                    position: relative;
                    background: var(--card-bg);
                    border-radius: var(--radius);
                    padding: 40px 32px;
                    z-index: 1;
                }
 
                .login-header {
                    margin-bottom: 32px;
                    text-align: center;
                }
 
                .login-header h1 {
                    font-size: 28px;
                    font-weight: 700;
                    color: var(--text-main);
                    letter-spacing: -0.5px;
                    margin-bottom: 8px;
                    line-height: 1.2;
                    font-family: 'Space Grotesk', sans-serif;
                }
 
                .login-header p {
                    font-size: 14px;
                    color: var(--text-muted);
                    margin: 0;
                }
 
                .form-group {
                    position: relative;
                    margin-bottom: 24px;
                }
 
                .form-group label {
                    display: block;
                    font-size: 13px;
                    font-weight: 500;
                    color: var(--text-main);
                    margin-bottom: 8px;
                }
 
                .input-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                }
 
                .form-control {
                    width: 100%;
                    padding: 12px 16px;
                    font-size: 14px;
                    color: var(--text-main);
                    background-color: #14181E;
                    border: 1px solid var(--border-color);
                    border-radius: 16px;
                    outline: none;
                    transition: var(--transition);
                }
 
                .form-control:focus {
                    border-color: var(--border-focus);
                    box-shadow: 0 0 0 3px rgba(207, 255, 15, 0.1);
                }
 
                .form-control.has-error {
                    border-color: var(--error-color);
                }
 
                .password-toggle {
                    position: absolute;
                    right: 16px;
                    background: none;
                    border: none;
                    color: var(--text-muted);
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 600;
                    padding: 4px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
 
                .error-message {
                    position: absolute;
                    bottom: -18px;
                    left: 0;
                    font-size: 11px;
                    color: var(--error-color);
                    opacity: 0;
                    transform: translateY(-2px);
                    transition: var(--transition);
                    pointer-events: none;
                }
 
                .error-message.visible {
                    opacity: 1;
                    transform: translateY(0);
                }
 
                .login-actions {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-top: 24px;
                    margin-bottom: 24px;
                }
 
                .remember-me {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    font-size: 13px;
                    color: var(--text-muted);
                    user-select: none;
                    margin: 0;
                }
 
                .remember-me input {
                    accent-color: var(--primary-btn);
                    cursor: pointer;
                    margin: 0;
                }
 
                .forgot-password {
                    font-size: 13px;
                    color: var(--primary-btn);
                    font-weight: 650;
                    text-decoration: none;
                    transition: var(--transition);
                }
 
                .forgot-password:hover {
                    color: var(--primary-btn-hover);
                }
 
                .btn-submit {
                    width: 100%;
                    padding: 14px;
                    background-color: var(--primary-btn);
                    color: #000000;
                    border: none;
                    border-radius: 16px;
                    font-size: 15px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: var(--transition);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    box-shadow: 0 4px 20px rgba(207, 255, 15, 0.15);
                }
 
                .btn-submit:hover {
                    background-color: var(--primary-btn-hover);
                    transform: translateY(-1px);
                    box-shadow: 0 6px 24px rgba(207, 255, 15, 0.25);
                }
                 
                .btn-submit:active {
                    transform: translateY(0);
                }
 
                .btn-submit:disabled {
                    background-color: var(--border-color);
                    color: var(--text-muted);
                    cursor: not-allowed;
                    box-shadow: none;
                }
                 
                .spinner {
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(0, 0, 0, 0.2);
                    border-radius: 50%;
                    border-top-color: #000;
                    animation: spin 0.6s linear infinite;
                    display: none;
                }
 
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
 
                .btn-submit.loading .spinner {
                    display: block;
                }
 
                .btn-submit.loading .btn-text {
                    display: none;
                }
 
                .general-error {
                    color: var(--error-color);
                    font-size: 13px;
                    margin-bottom: 20px;
                    text-align: center;
                    background: rgba(239, 68, 68, 0.1);
                    padding: 10px;
                    border-radius: 12px;
                    border: 1px solid rgba(239, 68, 68, 0.15);
                }
            `}</style>
            <div className="login-page-body">
                <div className="login-card-container">
                    <div className="login-card">
                        <div className="login-header">
                            <h1>{isRegisterMode ? 'Create Account' : 'Welcome back'}</h1>
                            <p>{isRegisterMode ? 'Enter your details to create an account' : 'Enter your details to access your account'}</p>
                        </div>

                        {generalError && (
                            <div className="general-error">{generalError}</div>
                        )}

                        <form onSubmit={handleSubmit} autoComplete="off" noValidate>
                            <div className="form-group">
                                <label htmlFor="email">Email</label>
                                <div className="input-wrapper">
                                    <input 
                                        type="email" 
                                        id="email" 
                                        className={`form-control ${emailError ? 'has-error' : ''}`} 
                                        placeholder="name@example.com"
                                        value={email}
                                        onChange={handleEmailChange}
                                        required 
                                    />
                                </div>
                                <span className={`error-message ${emailError ? 'visible' : ''}`}>
                                    Please enter a valid email address
                                </span>
                            </div>

                            <div className="form-group">
                                <label htmlFor="password">Password</label>
                                <div className="input-wrapper">
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        id="password" 
                                        className={`form-control ${passwordError ? 'has-error' : ''}`} 
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={handlePasswordChange}
                                        required 
                                    />
                                    {password.length > 0 && (
                                        <button 
                                            type="button" 
                                            className="password-toggle" 
                                            onClick={() => setShowPassword(!showPassword)}
                                            tabIndex={-1}
                                        >
                                            {showPassword ? 'Hide' : 'Show'}
                                        </button>
                                    )}
                                </div>
                                <span className={`error-message ${passwordError ? 'visible' : ''}`}>
                                    Password must be at least 8 characters and include uppercase, lowercase, a number, and a symbol
                                </span>
                            </div>

                            <div className="login-actions">
                                <label className="remember-me">
                                    <input type="checkbox" id="remember" />
                                    <span>Remember me</span>
                                </label>
                                <a href="#" className="forgot-password" onClick={(e) => {
                                    e.preventDefault();
                                    setIsRegisterMode(!isRegisterMode);
                                }}>
                                    {isRegisterMode ? 'Sign in instead' : 'Create account'}
                                </a>
                            </div>

                            <button type="submit" className={`btn-submit ${isLoading ? 'loading' : ''}`} disabled={isLoading}>
                                <span className="spinner"></span>
                                <span className="btn-text">{isRegisterMode ? 'Sign up' : 'Sign in'}</span>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};
