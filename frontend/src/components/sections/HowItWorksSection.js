import React from 'react';
import { motion } from 'framer-motion';

const HowItWorksSection = () => {
  const steps = [
    {
      step: "01",
      title: "Create Account",
      description: "Sign up and tell us about your goals and experience level",
      icon: (
        <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M20 21C20 18.2386 16.4183 16 12 16C7.58172 16 4 18.2386 4 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      gradient: "from-[#FF6B6B] to-[#FF8E8E]",
      shadow: "shadow-red-500/20"
    },
    {
      step: "02",
      title: "Choose Your Path",
      description: "Select from various programming languages and learning tracks",
      icon: (
        <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 3L12 7L16 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 7V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 12H7L10 15H14L17 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      gradient: "from-[#4E6FFF] to-[#8A9FFF]",
      shadow: "shadow-blue-500/20"
    },
    {
      step: "03",
      title: "Start Practice",
      description: "Begin coding with interactive exercises and real-time feedback",
      icon: (
        <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 18L22 12L16 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 6L2 12L8 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      gradient: "from-[#38D9A9] to-[#69F0AE]",
      shadow: "shadow-green-500/20"
    }
  ];

  return (
    <section className="py-8 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 md:mb-20"
        >
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-transparent bg-clip-text">
              How It Works
            </span>
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
            We've simplified the learning process to help you focus on what matters most - your growth
          </p>
        </motion.div>

        <div className="max-w-6xl mx-auto relative">
          {/* Connecting Lines - Only visible on medium screens and up */}
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="relative"
              >
                {/* Hexagon Container */}
                <div className="relative group">
                  {/* Background Glow */}
                  <div className={`absolute -inset-0.5 bg-gradient-to-r ${step.gradient} rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000`}></div>
                  
                  {/* Main Content */}
                  <div className="relative bg-white rounded-2xl p-6 md:p-8">
                    {/* Step Number */}
                    <div className={`absolute -top-4 right-4 md:-right-4 w-12 h-12 rounded-xl bg-gradient-to-r ${step.gradient} flex items-center justify-center text-white font-bold shadow-lg transform -rotate-6 group-hover:rotate-0 transition duration-300`}>
                      {step.step}
                    </div>

                    {/* Icon */}
                    <div className={`mb-6 p-3 md:p-4 rounded-xl bg-gradient-to-r ${step.gradient} text-white transform -rotate-6 group-hover:rotate-0 transition duration-300 ${step.shadow} flex items-center justify-center`}>
                      {step.icon}
                    </div>

                    {/* Content */}
                    <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-gray-900">
                      {step.title}
                    </h3>
                    <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                      {step.description}
                    </p>

                    {/* Decorative Elements - Hidden on mobile */}
                    <div className="hidden md:block absolute bottom-4 right-4 w-12 h-12 rounded-full bg-gray-50 opacity-30"></div>
                    <div className="hidden md:block absolute bottom-8 right-8 w-8 h-8 rounded-full bg-gray-50 opacity-20"></div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;