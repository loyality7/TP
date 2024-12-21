import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, Code, X, Menu, User } from 'lucide-react';
import { motion } from 'framer-motion';

// Add scrollbar styles
const scrollbarStyles = `
  .sidebar-scroll {
    scrollbar-width: thin;
    scrollbar-color: transparent transparent;
    transition: scrollbar-color 0.3s ease;
  }
  .sidebar-scroll::-webkit-scrollbar {
    width: 4px;
  }
  .sidebar-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
  .sidebar-scroll::-webkit-scrollbar-thumb {
    background-color: transparent;
    border-radius: 4px;
  }
  .sidebar-scroll:hover {
    scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
  }
  .sidebar-scroll:hover::-webkit-scrollbar-thumb {
    background-color: rgba(156, 163, 175, 0.5);
  }
`;

const SideBar = ({ isOpen = true, onClose }) => {
  const location = useLocation();
  
  const menuItems = [
    { path: '/dashboard/user', label: 'Dashboard', icon: Home },
    { path: '/dashboard/user/tests', label: 'My Tests', icon: FileText },
    // { path: '/dashboard/user/reports', label: 'Reports', icon: BarChart2 },
    // { path: '/dashboard/user/ai', label: 'Test AI', icon: Brain },
    { path: '/dashboard/user/profile', label: 'Profile', icon: User },

  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={onClose}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 rounded-md bg-white shadow-md hover:bg-gray-50"
      >
        <Menu className="h-5 w-5 text-gray-600" />
      </button>

      <motion.div 
        initial={false}
        animate={{ x: isOpen ? 0 : -256 }}
        className="fixed inset-y-0 left-0 bg-white border-r border-gray-100 w-64 z-30"
      >
        <style jsx global>{scrollbarStyles}</style>
        
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="px-4 py-4 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center">
              <div className="p-1.5 bg-emerald-100 rounded-lg mr-3">
                <Code className="h-5 w-5 text-emerald-600" />
              </div>
              <span className="font-semibold text-gray-800">Eval8</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors duration-150"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          
          {/* Menu Items */}
          <div className="flex-1 py-4 overflow-y-auto sidebar-scroll">
            <div className="space-y-1 px-3">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="group block"
                  >
                    <div className={`w-full flex items-center px-3 py-2 text-sm rounded-md
                      ${isActive ? 'bg-emerald-50' : 'hover:bg-gray-50'}
                      text-gray-700 transition-colors duration-150`}
                    >
                      <div className={`p-1.5 rounded-md mr-2.5 ${
                        isActive ? 'bg-emerald-100' : 'group-hover:bg-gray-100'
                      }`}>
                        <Icon className={`h-4 w-4 ${
                          isActive ? 'text-emerald-600' : 'text-gray-500'
                        }`} />
                      </div>
                      <span className={`font-medium ${isActive ? 'text-emerald-600' : ''}`}>
                        {item.label}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default SideBar;
