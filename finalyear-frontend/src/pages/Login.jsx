import { useNavigate } from "react-router-dom";
import axios from "../config/axios";

function Login() {
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      const res = await axios.get("/api/auth/google/url");
      if (res.data.success && res.data.authUrl) {
        window.location.href = res.data.authUrl;
      } else {
        throw new Error('Invalid response from auth endpoint');

      const { token, role, email: userEmail, username } = res.data;

      // Validate token data
      if (!token || !role || !userEmail) {
        console.error('Invalid login response:', res.data);
        throw new Error('Server returned incomplete login data');
      }

      // Decode token to verify its contents
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        
        // Verify token contains required fields
        if (!payload.email || !payload.role || !payload.id) {
          console.error('Invalid token payload:', payload);
          throw new Error('Invalid token structure');
        }

        // Verify token data matches response data
        if (payload.email !== userEmail || payload.role !== role) {
          console.error('Token data mismatch:', {
            token: payload,
            response: { email: userEmail, role }
          });
          throw new Error('Token data mismatch');
        }
      } catch (e) {
        console.error('Token validation failed:', e);
        throw new Error('Invalid token received from server');
      }

      // Store validated data
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("email", userEmail);
      localStorage.setItem("username", username);

      // Log successful login
      console.log('Login successful:', {
        role,
        email: userEmail,
        username
      });

      // Redirect by role
      if (role === "team_member") navigate("/member");
      else if (role === "team_lead") navigate("/lead");
      else if (role === "project_manager") navigate("/pm");
    } catch (err) {
      console.error('Login error:', err);
      let errorMessage;
      if (!err.response) {
        errorMessage = "Network error. Please check if the server is running.";
      } else if (err.response.status === 400) {
        errorMessage = "Invalid email or password.";
      } else {
        errorMessage = err.response.data.message || "An unknown error occurred.";
      }
      alert("Login failed: " + errorMessage);
    }
  };

    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed: ' + (error.response?.data?.message || error.message || 'An unknown error occurred'));
    }
  };

  return (
    <div className="login-container" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <h2 style={{ marginBottom: '20px' }}>Team Metrics Dashboard</h2>
      <button 
        onClick={handleGoogleLogin}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 20px',
          fontSize: '16px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          backgroundColor: '#fff',
          cursor: 'pointer',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          transition: 'all 0.3s ease'
        }}
      >
        <img 
          src="https://www.google.com/favicon.ico" 
          alt="Google"
          style={{ width: '20px', marginRight: '10px' }}
        />
        Sign in with Google
      </button>
    </div>
  );
}

export default Login;
