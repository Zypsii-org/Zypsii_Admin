import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./ScrollAnimationSection.css";
import img from "../../assert/app-ss1.png"
import mobileIcon from "../../assert/mobile-icon.png";
import { TbBackground } from "react-icons/tb";
import { FaSearch, FaCalendarAlt, FaMapMarkerAlt } from "react-icons/fa";
import SearchSection from "../homepage/SearchSection";
import ScheduleSection from "../homepage/ScheduleSection";
import PlacesSection from "../homepage/PlacesSection";

const ScrollAnimation = () => {
  const [activeCategory, setActiveCategory] = useState(null);

  const categories = [
    {
      id: "search",
      icon: FaSearch,
      title: "Search",
      description: "Discover amazing places and connect with travelers worldwide",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    },
    {
      id: "schedule",
      icon: FaCalendarAlt,
      title: "Schedule",
      description: "Plan your perfect trip with personalized itineraries",
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
    },
    {
      id: "places",
      icon: FaMapMarkerAlt,
      title: "Places",
      description: "Explore destinations and find hidden gems",
      gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
    }
  ];
  useEffect(() => {
    const elements = document.querySelectorAll(".animate-on-scroll");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate");
          } else {
            entry.target.classList.remove("animate");
          }
        });
      },
      { threshold: 0.2 }
    );

    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <section className="scroll-section">
      <div className="container py-5">
        <div className="row align-items-center justify-content-between g-4">
          {/* Left Side - Image */}
          <div className="col-lg-6 col-md-6 image-container animate-on-scroll fade-right">
            <img
              src={img}
              alt="Feature"
              className="feature-image"
            />
          </div>

          {/* Right Side - Text */}
          <div className="col-lg-6 col-md-6 content-container animate-on-scroll fade-left">
            <div className="text-container">
              <h2 className="fw-bold mb-3">
                <img 
                  src={mobileIcon} 
                  alt="Mobile App" 
                  style={{ 
                    width: '70px', 
                    height: '70px', 
                    marginRight: '12px',
                    verticalAlign: 'middle'
                  }} 
                />
                Available Now<span className="logo-text ms-2 fw-bold" style={{color:"#ff3873"}}>!</span>
              </h2>
              <p className="mb-4">
                Download the app & explore the world with ease.
              </p>
              <a 
                href="https://play.google.com/store/apps/details?id=com.SmartKal.founder" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn bttn btn-lg"
                style={{backgroundColor: '#ff3873', color: 'white', border: 'none'}}
              >
                Download on Google Play
              </a>
            </div>
          </div>
        </div>

        {/* Category Cards Section */}
        <div className="row mt-5 animate-on-scroll fade-up">
          <div className="col-12">
            <h3 className="text-center mb-4" style={{ color: '#333', fontWeight: '700' }}>
              Explore Our Features
            </h3>
            <div className="category-cards-container">
              {categories.map((category, index) => {
                const IconComponent = category.icon;
                return (
                  <div
                    key={category.id}
                    className={`category-card ${activeCategory === index ? 'active' : ''}`}
                    style={{ background: category.gradient }}
                    onClick={() => setActiveCategory(activeCategory === index ? null : index)}
                  >
                    <div className="category-icon-wrapper">
                      <IconComponent className="category-icon" />
                    </div>
                    <h4 className="category-title">{category.title}</h4>
                    <p className="category-description">{category.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Conditionally render content based on active category */}
        {activeCategory !== null && (
          <div className="category-content-container">
            {activeCategory === 0 && <SearchSection />}
            {activeCategory === 1 && <ScheduleSection />}
            {activeCategory === 2 && <PlacesSection />}
          </div>
        )}
      </div>
    </section>
  );
};

export default ScrollAnimation;
