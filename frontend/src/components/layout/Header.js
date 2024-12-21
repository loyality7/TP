import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';
import { 
  ChevronDown, 
  BarChart, 
  FileText, 
  Settings, 
  Users,  
  Layout,
  HelpCircle,
} from 'lucide-react';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const location = useLocation();

  const navigation = {
    vendor: [
      { name: 'Dashboard', path: '/vendor/dashboard', icon: Layout },
      { name: 'My Tests', path: '/vendor/tests', icon: FileText },
      { name: 'Analytics', path: '/vendor/analytics', icon: BarChart },
      { name: 'Candidates', path: '/vendor/candidates', icon: Users },
    ],
    candidate: [
      { name: 'Dashboard', path: '/dashboard/user', icon: Layout },
      // { name: 'Available Tests', path: '/tests', icon: BookOpen },
      
    ]
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="header">
      <nav className="nav-container">
        <div className="flex justify-between items-center w-full">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <img 
              src="https://res.cloudinary.com/dfdtxogcl/images/c_scale,w_248,h_180,dpr_1.25/f_auto,q_auto/v1706606519/Picture1_215dc6b/Picture1_215dc6b.png"
              alt="Test Platform Logo"
              className="w-10 h-10 object-contain"
            />
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Test Platform
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {user && (
              <div className="flex items-center space-x-6">
                {(user.role === 'vendor' ? navigation.vendor : navigation.candidate).map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`nav-link flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                      isActive(item.path)
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700 hover:text-blue-600'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right Section */}
          <div className="hidden lg:flex items-center space-x-6">
            {/* Help button only */}
            {user && (
              <button className="text-gray-600 hover:text-blue-600">
                <HelpCircle className="w-5 h-5" />
              </button>
            )}

            {/* User Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-3 text-gray-700 hover:text-blue-600"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-medium">{user.name}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="dropdown-menu absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-1 border">
                    <div className="px-4 py-2 border-b">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <Link
                      to="/profile"
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Profile Settings</span>
                    </Link>
                    <button
                      onClick={logout}
                      className="flex items-center space-x-2 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                    >
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login">
                  <Button className="text-gray-600 hover:text-blue-600">Log in</Button>
                </Link>
                <Link to="/register">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="lg:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 top-[70px] bg-white z-50">
            <div className="p-4">
              {user && (
                <>
                  <div className="flex items-center space-x-3 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-lg font-medium text-blue-600">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  {(user.role === 'vendor' ? navigation.vendor : navigation.candidate).map((item) => (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={`flex items-center space-x-2 px-4 py-3 rounded-lg ${
                        isActive(item.path)
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Link>
                  ))}
                  <div className="border-t border-gray-200 mt-6 pt-6">
                    <Link to="/profile" className="flex items-center space-x-2 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg">
                      <Settings className="w-5 h-5" />
                      <span>Settings</span>
                    </Link>
                    <button 
                      onClick={logout}
                      className="flex items-center space-x-2 w-full px-4 py-3 text-red-600 hover:bg-gray-50 rounded-lg"
                    >
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}
              {!user && (
                <div className="space-y-4 p-4">
                  <Link to="/login" className="block w-full py-3 text-center text-gray-600 hover:text-blue-600 border rounded-lg">
                    Log in
                  </Link>
                  <Link to="/register" className="block w-full py-3 text-center text-white bg-blue-600 hover:bg-blue-700 rounded-lg">
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
