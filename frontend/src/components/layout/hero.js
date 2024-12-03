import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRightIcon } from '@radix-ui/react-icons';
import Button from '../common/Button';

const HeroSection = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-background">
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col justify-center space-y-4"
          >
            <div className="space-y-2">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none"
              >
                Welcome to Our Amazing Platform
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400"
              >
                Discover the future of technology with our innovative solutions. Start your journey today.
              </motion.p>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex flex-col gap-2 min-[400px]:flex-row"
            >
              <Button className="inline-flex items-center">
                Get Started
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Button>
              <Button className="bg-transparent border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white">
                Learn More
              </Button>
            </motion.div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center justify-center"
          >
            <div className="relative h-[400px] w-full overflow-hidden rounded-xl bg-gradient-to-br from-purple-800 to-blue-600">
              {/* Add your hero image or illustration here */}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
