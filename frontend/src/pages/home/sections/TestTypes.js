import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const testTypes = [
  {
    title: "Technical MCQs",
    description: "Multiple choice questions covering various technical domains",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40",
    features: ["Instant Results", "Detailed Explanations", "Progress Tracking"]
  },
  {
    title: "Coding Challenges",
    description: "Real-world programming problems with automated evaluation",
    image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6",
    features: ["Multiple Languages", "Custom Test Cases", "Code Analysis"]
  },
  {
    title: "Practice Tests",
    description: "Full-length practice tests simulating real exam environment",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
    features: ["Timed Sessions", "Performance Analytics", "Difficulty Levels"]
  }
];

const TestTypesSection = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold mb-4">Available Test Types</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Choose from our variety of assessment formats designed to evaluate different aspects of technical expertise
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testTypes.map((type, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-xl overflow-hidden shadow-lg flex flex-col"
            >
              <div className="h-48 overflow-hidden">
                <img 
                  src={type.image} 
                  alt={type.title}
                  className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex-grow">
                  <h3 className="text-xl font-semibold mb-2">{type.title}</h3>
                  <p className="text-gray-600 mb-4">{type.description}</p>
                  <ul className="space-y-2 mb-6">
                    {type.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-gray-600">
                        <ArrowRight className="w-4 h-4 mr-2 text-blue-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Try Now
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestTypesSection; 