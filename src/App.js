import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProtectedRoute, Login, AdminLayout, Dashboard, InstagramHome } from "./components/admin";

import { Places, Guides, YouTube } from "./components/admin";

import './App.css';
import './index.css'; // Import global styles

import Navbar from "./components/navebar/navebar";
import FeaturesSection from "./components/feature/feature";
import HomePage from "./components/condentscroll/condent";
import Footer from "./components/footer/footer";
import Home from "./components/navebar/home";
import FeaturesSections from "./components/section/FeaturesSection";
import ScrollAnimationSection from "./components/condent/ScrollAnimationSection";
import AboutSection from "./components/about/about";
import Countdown from "./components/countdown/Countdown";
import StatePlacesPage from "./components/homepage/StatePlacesPage";
import CountryStatesPage from "./components/homepage/CountryStatesPage";

// Main Website Component
const MainWebsite = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/home", { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  return (
    <div className="App">
      {/* <Countdown /> */}
      {/* <Navbar/> */}
      <Home />
      <ScrollAnimationSection />
      <FeaturesSections />
      <FeaturesSection />

      <HomePage />
      <AboutSection />
      <Footer />
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Main Website Route */}
          <Route path="/" element={<MainWebsite />} />
          
          {/* User Home Route */}
          <Route path="/home" element={<InstagramHome />} />
          <Route path="/home/country/:country" element={<CountryStatesPage />} />
          <Route path="/home/state/:country/:state" element={<StatePlacesPage />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin/dashboard" element={
            <ProtectedRoute>
              <AdminLayout>
                <Dashboard />
              </AdminLayout>
            </ProtectedRoute>
          } />

          <Route path="/admin/places" element={
            <ProtectedRoute>
              <AdminLayout>
                <Places />
              </AdminLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/admin/guides" element={
            <ProtectedRoute>
              <AdminLayout>
                <Guides />
              </AdminLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/admin/youtube" element={
            <ProtectedRoute>
              <AdminLayout>
                <YouTube />
              </AdminLayout>
            </ProtectedRoute>
          } />
          
          {/* Catch all route - redirect to main website */}
          <Route path="*" element={<MainWebsite />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;

