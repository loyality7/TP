import React from 'react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import HeroSection from '../../components/layout/hero';
import FeaturesSection from './sections/Features';
import TestTypesSection from './sections/TestTypes';

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <HeroSection />
        <FeaturesSection />
        <TestTypesSection />
      </main>
      <Footer />
    </div>
  );
};

export default Home;
