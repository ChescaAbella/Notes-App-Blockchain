import React from "react";

import Header from "../components/header";
import Hero from "../components/hero";
import Features from "../components/features";
import Demo from "../components/demo";
import CTA from "../components/cta";
import Footer from "../components/footer";
import "../styles/landingStyles.css";

const Landing = () => {
  return (
    <>
        <Header />
        <Hero />
        <Features />
        <Demo />
        <CTA />
        <Footer />
    </>
  );
};

export default Landing;
