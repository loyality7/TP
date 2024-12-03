import React from 'react';
import { motion } from 'framer-motion';
import { CodeIcon, BrainCircuitIcon, ShieldCheckIcon, BarChart3Icon } from 'lucide-react';

const features = [
  {
    icon: <CodeIcon className="w-6 h-6" />,
    title: "Coding Challenges",
    description: "Practice with real-world coding problems across multiple programming languages."
  },
  {
    icon: <BrainCircuitIcon className="w-6 h-6" />,
    title: "MCQ Assessments",
    description: "Comprehensive multiple-choice questions to test theoretical knowledge."
  },
  {
    icon: <ShieldCheckIcon className="w-6 h-6" />,
    title: "Secure Proctoring",
    description: "AI-powered proctoring ensures test integrity and prevents cheating."
  },
  {
    icon: <BarChart3Icon className="w-6 h-6" />,
    title: "Detailed Analytics",
    description: "Get comprehensive insights into your performance and progress."
  }
];

const FeaturesSection = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4">Platform Features</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Everything you need to assess and improve your technical skills
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 text-blue-600">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection; 