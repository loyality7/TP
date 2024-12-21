import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, FileText, Users2, LogOut, ChevronDown, 
  Code, BarChart2, Calendar, Database, Activity,
  CreditCard
} from 'lucide-react';
import { motion } from 'framer-motion';

// Add this style block at the top of your component
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

const Sidebar = ({ isOpen, setIsOpen, onLogout }) => {
  const [openMenus, setOpenMenus] = useState({});
  const location = useLocation();

  const menuItems = useMemo(() => [
    {
      label: "Dashboard",
      icon: Home,
      isExpanded: true,
      children: [
        { 
          label: "Overview",  
          path: "/vendor/dashboard", 
          icon: Activity
        }
        // { 
        //   label: "Statistics", 
        //   path: "/vendor/dashboard/statistics", 
        //   icon: PieChart 
        // },
        // { 
        //   label: "Reports", 
        //   path: "/vendor/dashboard/reports", 
        //   icon: FileText 
        // }
      ]
    },
    {
      label: "Assessments",
      icon: FileText,
      children: [
        { label: "All Tests", path: "/vendor/tests" },
        { label: "Create New", path: "/vendor/tests/create" },
        { label: "Edit Test", path: "/vendor/tests/edit/:testId" },
        // { label: "Templates", path: "/vendor/tests/templates" },
        { label: "Question Bank", path: "/vendor/tests/questions" },
        { label: "Archive", path: "/vendor/tests/archive" }
      ]
    },
    {
      label: "Candidates",
      icon: Users2,
      children: [
        { label: "All Candidates", path: "/vendor/candidates" },
        { label: "Active", path: "/vendor/candidates/active" },
        { label: "Completed", path: "/vendor/candidates/completed" },
        // { label: "Pending", path: "/vendor/candidates/pending" }
      ]
    },
    {
      label: "Analytics",
      icon: BarChart2,
      children: [
        { label: "Test Analytics", path: "/vendor/analytics/tests" },
        { label: "Candidate Analytics", path: "/vendor/analytics/candidates" }
        // { label: "Performance Insights", path: "/vendor/analytics/insights" },
        // { label: "Custom Reports", path: "/vendor/analytics/reports" }
      ]
    },
    {
      label: "Schedule",
      icon: Calendar,
      children: [
        { label: "Upcoming Tests", path: "/vendor/schedule/upcoming" },
        { label: "Past Tests", path: "/vendor/schedule/past" },
        { label: "Calendar View", path: "/vendor/schedule/calendar" }
      ]
    },
    {
      label: "Payments",
      icon: CreditCard,
      children: [
        // { label: "Billing", path: "/vendor/payments/billing" },
        { label: "Invoices", path: "/vendor/payments/invoices" },
        // { label: "Subscription", path: "/vendor/payments/subscription" },
        // { label: "Payment History", path: "/vendor/payments/history" },
        { label: "Wallet", path: "/vendor/payments/wallet" }
      ]
    },
    {
      label: "Resources",
      icon: Database,
      children: [
        { label: "Documentation", path: "/vendor/resources/docs" },
        { label: "API Access", path: "/vendor/resources/api" },
        { label: "Guides", path: "/vendor/resources/guides" },
        { label: "Support", path: "/vendor/resources/support" }
      ]
    }
  ], []);

  // Fix useEffect dependency
  useEffect(() => {
    const currentPath = location.pathname;
    const updateOpenMenus = () => {
      menuItems.forEach(item => {
        if (item.children?.some(child => currentPath.startsWith(child.path))) {
          setOpenMenus(prev => ({ ...prev, [item.label]: true }));
        }
      });
    };
    updateOpenMenus();
  }, [location.pathname, menuItems]); // Add menuItems to dependencies

  const toggleMenu = (menu) => {
    setOpenMenus(prev => ({...prev, [menu]: !prev[menu]}));
  };

  const MenuItem = ({ item }) => {
    const Icon = item.icon;
    const isOpen = openMenus[item.label];
    const hasChildren = item.children?.length > 0;
    const isActive = location.pathname === item.path;
    
    return (
      <div className="group">
        <motion.button
          onClick={() => toggleMenu(item.label)}
          className={`w-full flex items-center px-3 py-2 text-sm
            ${isOpen ? 'bg-emerald-50' : ''}
            ${isActive ? 'bg-emerald-50' : 'hover:bg-gray-50'}
            text-gray-700 rounded-md group transition-colors duration-150`}
        >
          <div className={`p-1.5 rounded-md mr-2.5 ${
            isOpen || isActive ? 'bg-emerald-100' : 'group-hover:bg-gray-100'
          }`}>
            <Icon className={`h-4 w-4 ${
              isOpen || isActive ? 'text-emerald-600' : 'text-gray-500'
            }`} />
          </div>
          <span className={`font-medium ${isOpen || isActive ? 'text-emerald-600' : ''}`}>
            {item.label}
          </span>
          {hasChildren && (
            <ChevronDown className={`h-3.5 w-3.5 ml-auto transition-transform duration-200
              ${isOpen ? 'rotate-180' : ''} 
              ${isOpen ? 'text-emerald-500' : 'text-gray-400'}`} 
            />
          )}
        </motion.button>
        
        {hasChildren && isOpen && (
          <div className="mt-1 space-y-1">
            {item.children.map((child, index) => (
              <Link
                key={index}
                to={child.path}
                className={`flex items-center pl-8 pr-3 py-2 text-sm rounded-md
                  ${location.pathname === child.path 
                    ? 'bg-emerald-50 text-emerald-600' 
                    : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {child.icon && (
                  <child.icon className={`h-3.5 w-3.5 mr-2.5 ${
                    location.pathname === child.path 
                      ? 'text-emerald-500' 
                      : 'text-gray-400'
                  }`} />
                )}
                <span>{child.label}</span>
                {child.badge && (
                  <span className="ml-auto px-1.5 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-600 rounded-full">
                    {child.badge.text}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.div 
      initial={false}
      animate={{ x: isOpen ? 0 : -256 }}
      className="fixed inset-y-0 left-0 bg-white border-r border-gray-100 w-64 z-30"
    >
      <style jsx global>{scrollbarStyles}</style>
      
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="px-4 py-4 flex items-center border-b border-gray-100">
          <div className="p-1.5 bg-emerald-100 rounded-lg mr-3">
            <Code className="h-5 w-5 text-emerald-600" />
          </div>
          <span className="font-semibold text-gray-800">
            Eval8
            </span>
        </div>
        
        {/* Updated Menu Items container with new scrollbar class */}
        <div className="flex-1 py-4 overflow-y-auto sidebar-scroll">
          <div className="space-y-1 px-3">
            {menuItems.map((item, index) => (
              <MenuItem key={index} item={item} />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-100">
          <button 
            onClick={onLogout}
            className="w-full flex items-center px-3 py-2 text-sm text-red-500 hover:bg-gray-50 rounded-md group"
          >
            <div className="p-1.5 rounded-md mr-2.5 group-hover:bg-red-50">
              <LogOut className="h-4 w-4" />
            </div>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar; 