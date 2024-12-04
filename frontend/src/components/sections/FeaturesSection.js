import React from 'react';
import { motion } from 'framer-motion';
import { Code, Brain, Book, Zap, Users } from 'lucide-react';

const FeaturesSection = () => {
  const features = [  
    {
      icon: <Code className="h-8 w-8" />,
      title: "Advanced Code Testing",
      description: "Enterprise-grade testing environment supporting 20+ programming languages with real-time compilation and execution.",
      color: "bg-blue-500",
      lightColor: "bg-blue-50",
      gradient: "from-blue-200/40 to-blue-300/40"
    },
    {
      icon: <Brain className="h-8 w-8" />,
      title: "AI-Powered Assessment",
      description: "Intelligent evaluation system that analyzes code quality, complexity, and performance metrics for detailed insights.",
      color: "bg-purple-500",
      lightColor: "bg-purple-50",
      gradient: "from-purple-200/40 to-purple-300/40"
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Automated Proctoring",
      description: "State-of-the-art proctoring system with AI-powered monitoring and advanced plagiarism detection features.",
      color: "bg-orange-500",
      lightColor: "bg-orange-50",
      gradient: "from-orange-200/40 to-orange-300/40"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-gray-50/80 to-white" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50/40 via-purple-50/40 to-transparent" />
      
      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-block mb-4">
            <span className="px-4 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-blue-50 to-purple-50 border border-gray-100 text-gray-600">
              Platform Features
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
            Everything You Need to{' '}
            <span className="relative inline-block">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Excel
              </span>
              <motion.span
                className="absolute -bottom-1.5 left-0 w-full h-[3px] bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </span>
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            Comprehensive features designed to enhance your learning experience and accelerate your growth
          </p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="group relative rounded-2xl p-8 transition-all duration-300 text-center"
              whileHover={{ y: -5 }}
            >
              <div className="absolute inset-0 bg-white rounded-2xl shadow-lg border border-gray-100/50 transition-all duration-300 group-hover:shadow-xl" />
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300`} />
              
              <div className="relative z-10">
                <div className={`w-16 h-16 ${feature.lightColor} rounded-xl flex items-center justify-center mb-6 mx-auto transition-transform duration-300 group-hover:scale-110`}>
                  <div className={`text-${feature.color.split('-')[1]}-500`}>
                    {React.cloneElement(feature.icon, { className: "h-8 w-8" })}
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection; 