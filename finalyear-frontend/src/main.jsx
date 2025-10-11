import "./polyfills";  // Import polyfills first
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App";
import Login from "./pages/Login";
import MemberDashboard from "./pages/MemberDashboard";
import LeadDashboard from "./pages/LeadDashboard";
import PMDashboard from "./pages/PMDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/member/*" element={
            <ProtectedRoute role="team_member">
              <App />
            </ProtectedRoute>
          } />
        <Route path="/lead/*" element={
          <ProtectedRoute role="team_lead">
            <App />
          </ProtectedRoute>
        } />
        <Route path="/pm/*" element={
          <ProtectedRoute role="project_manager">
            <App />
          </ProtectedRoute>
        } />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
