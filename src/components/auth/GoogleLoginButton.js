import React, { useState, useEffect } from 'react';
import { FaGoogle, FaUser, FaSignOutAlt } from 'react-icons/fa';
import UserProfileModal from './UserProfileModal';
import './GoogleLoginButton.css';

const GoogleLoginButton = ({ variant = 'primary' }) => {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const buttonRef = React.useRef(null);

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = () => {
      const userData = localStorage.getItem('user');
      const token = localStorage.getItem('userToken');
      
      if (userData && token) {
        try {
          setUser(JSON.parse(userData));
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }
    };

    checkAuth();
    
    // Listen for storage changes from other tabs
    window.addEventListener('storage', checkAuth);
    
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');

    try {
      // Load Google Identity Services
      if (!window.google) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
        
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
      }

      // Initialize Google Identity Services
      window.google.accounts.id.initialize({
        client_id: '1008509074936-rg8ffmhn16hivb6l7d4joqh24vqa6gnb.apps.googleusercontent.com',
        callback: handleGoogleCallback
      });

      // Trigger the Google Sign-In popup
      window.google.accounts.id.prompt();
    } catch (error) {
      console.error('Google login error:', error);
      setError('Failed to initialize Google login. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleCallback = async (response) => {
    try {
      setGoogleLoading(true);
      
      // Send the Google ID token to your backend
      const apiResponse = await fetch('https://zypsii.com/api/user/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ googleToken: response.credential })
      });

      const data = await apiResponse.json();
      
      if (apiResponse.ok && !data.error) {
        const { token, userDetails } = data;
        
        // Store token and user data
        localStorage.setItem('token', token);
        localStorage.setItem('userToken', token);
        localStorage.setItem('user', JSON.stringify(userDetails));
        
        // Update user state
        setUser(userDetails);
        
        // Redirect to /home after successful login
        console.log('✅ User login successful, redirecting to /home');
        window.location.href = '/home';
      } else {
        setError(data.message || 'Google authentication failed');
        alert(data.message || 'Google authentication failed');
      }
    } catch (error) {
      console.error('Google callback error:', error);
      setError('Google authentication failed. Please try again.');
      alert('Google authentication failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userToken');
    localStorage.removeItem('adminUser');
    setUser(null);
    setShowDropdown(false);
    window.location.reload();
  };

  // If user is logged in, show profile button with modal
  if (user) {
    return (
      <>
        <div className={`user-profile-wrapper ${variant}`}>
          <button 
            ref={buttonRef}
            onClick={() => setShowDropdown(true)}
            className={`user-profile-btn ${variant}`}
          >
            {user.profilePicture ? (
              <img 
                src={user.profilePicture} 
                alt="Profile" 
                className="user-profile-img"
              />
            ) : (
              <div className="user-profile-avatar">
                <FaUser />
              </div>
            )}
            <span className="user-name">{user.name || user.email?.split('@')[0] || 'User'}</span>
          </button>
        </div>
        
        <UserProfileModal 
          show={showDropdown}
          onClose={() => setShowDropdown(false)}
          user={user}
          onLogout={handleLogout}
          buttonRef={buttonRef}
        />
      </>
    );
  }

  // If not logged in, show login button
  return (
    <div className={`google-login-wrapper ${variant}`}>
      <button 
        onClick={handleGoogleLogin}
        className={`google-login-btn ${variant}`}
        disabled={googleLoading}
      >
        <FaGoogle className="google-icon" />
        <span>{googleLoading ? 'Signing in...' : 'Login'}</span>
      </button>
    </div>
  );
};

export default GoogleLoginButton;
