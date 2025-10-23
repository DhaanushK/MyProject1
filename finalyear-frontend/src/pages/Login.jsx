import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../config/axios";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/api/auth/login", {
        email,
        password,
      }, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

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

  return (
    <form onSubmit={handleSubmit}>
      <h2>Login</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <br />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <br />
      <button type="submit">Login</button>
    </form>
  );
}

export default Login;
