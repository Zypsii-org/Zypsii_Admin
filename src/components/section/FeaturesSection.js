import React, { useEffect, useRef, useState } from "react";
import "./FeaturesSection.css"; // Import CSS file
import { MdPersonalVideo, MdTravelExplore } from "react-icons/md";
import { TbMapSearch } from "react-icons/tb";
import { BiShareAlt } from "react-icons/bi";
import { BsPeopleFill } from "react-icons/bs";
import { IoChatbubblesSharp } from "react-icons/io5";
import { color } from "framer-motion";

const FeaturesSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  const features = [
    { title: "Personalized Itineraries", description: "Tailored trips based on your interests.", icon: <MdPersonalVideo size={60} /> },
    { title: "Real-Time Updates", description: "Weather and local places at your fingertips.", icon: <TbMapSearch size={60} /> },
    { title: "Share Your Moments", description: "Share your moments with the world! Upload reels, photos, and stories", icon: <BiShareAlt size={60} /> },
    { title: "Discover Places", description: "Explore and discover amazing places around you!", icon: <MdTravelExplore size={60} /> },
    { title: "Connect with Travelers", description: "Share your adventures with the community and inspire others to join your journey.", icon: <BsPeopleFill size={60} /> },
    { title: "Chat with Travelers", description: "Connect with friends or meet new explorers in real-time", icon: <IoChatbubblesSharp size={60} /> },
  ];

  return (
    <section ref={sectionRef} className="features-section text-center py-5" id="Features">
      <h6 className="text fw-bold" style={{ color: "#ff3873" }}>FEATURES</h6>

      <h2 className="fw-bold">Discover the amazing features that make your trip unforgettable</h2>
      {/* <p className="text-muted">
        Explore the powerful features that help your business grow with ease.
      </p> */}

      <div className="container">
        <div className="row justify-content-center mt-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`col-md-5 col-lg-3 mx-3 feature-card ${isVisible ? "fade-up" : ""}`}
              style={{ transitionDelay: `${index * 150}ms` }} // Staggered effect
            >
              <div className="feature-icon">{feature.icon}</div>
              <h5 className="fw-bold">{feature.title}</h5>
              <p className="text-muted">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
