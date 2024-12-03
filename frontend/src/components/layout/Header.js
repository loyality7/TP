import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';

const Header = () => {
  const { user, logout } = useAuth();
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-md fixed w-full top-0 z-50">
      <nav className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="https://res.cloudinary.com/dfdtxogcl/images/c_scale,w_248,h_180,dpr_1.25/f_auto,q_auto/v1706606519/Picture1_215dc6b/Picture1_215dc6b.png"
              alt="Test Platform Logo"
              className="w-8 h-8 object-contain"
            />
            <span className="text-xl font-bold">Test Platform</span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <div className="relative">
              <button 
                className="flex items-center space-x-1 hover:text-blue-600"
                onMouseEnter={() => setIsExploreOpen(true)}
                onMouseLeave={() => setIsExploreOpen(false)}
              >
                <span>Explore</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isExploreOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white shadow-lg rounded-md py-2">
                  <Link to="/mcq-tests" className="block px-4 py-2 hover:bg-gray-100">MCQ Tests</Link>
                  <Link to="/coding-challenges" className="block px-4 py-2 hover:bg-gray-100">Coding Challenges</Link>
                  <Link to="/practice-tests" className="block px-4 py-2 hover:bg-gray-100">Practice Tests</Link>
                </div>
              )}
            </div>
            <Link to="/directory" className="hover:text-blue-600">Directory</Link>
            <Link to="/resources" className="hover:text-blue-600">Resources</Link>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-gray-600">Welcome, {user.name}</span>
                <Button onClick={logout} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                  Logout
                </Button>
              </>
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

          <button 
            className="md:hidden p-2"
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

        {isMobileMenuOpen && (
          <div className="md:hidden pt-4 pb-3 border-t border-gray-200">
            <Link to="/mcq-tests" className="block px-4 py-2 hover:bg-gray-100">MCQ Tests</Link>
            <Link to="/coding-challenges" className="block px-4 py-2 hover:bg-gray-100">Coding Challenges</Link>
            <Link to="/practice-tests" className="block px-4 py-2 hover:bg-gray-100">Practice Tests</Link>
            <Link to="/directory" className="block px-4 py-2 hover:bg-gray-100">Directory</Link>
            <Link to="/resources" className="block px-4 py-2 hover:bg-gray-100">Resources</Link>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              {user ? (
                <>
                  <span className="block px-4 py-2 text-gray-600">Welcome, {user.name}</span>
                  <button 
                    onClick={logout}
                    className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="block px-4 py-2 hover:bg-gray-100">Log in</Link>
                  <Link to="/register" className="block px-4 py-2 text-blue-600 hover:bg-gray-100">Sign Up</Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
