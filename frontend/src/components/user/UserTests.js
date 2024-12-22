import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Clock, Calendar, 
  Eye, PlayCircle, CheckCircle, 
} from 'lucide-react';
import { testService } from '../../services/test.service';
import SideBar from './SideBar';

const UserTests = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  // Add toggleSidebar function
  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  // Fetch tests
  useEffect(() => {
    const fetchTests = async () => {
      try {
        const response = await testService.getUserTests();
        // Update to handle the new response structure with results array
        if (response?.data?.results && Array.isArray(response.data.results)) {
          setTests(response.data.results);
        } else {
          setTests([]);
        }
      } catch (error) {
        console.error('Error fetching tests:', error);
        setTests([]);
      }
    };

    fetchTests();
  }, []);

  // Search functionality
  const filteredTests = tests
    .filter(test => test.title.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

  const TestCard = ({ test }) => (
    <div className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100">
      {/* Status Badge */}
      <div className="absolute top-4 right-4">
        <span className={`px-3 py-1 rounded-full text-xs font-medium
          ${test.status === 'completed' 
            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
            : 'bg-blue-50 text-blue-600 border border-blue-200'}`}>
          {test.status === 'completed' ? 'Completed' : 'In Progress'}
        </span>
      </div>

      <div className="p-6">
        {/* Test Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 pr-20">
          {test.title}
        </h3>

        {/* Test Details */}
        <div className="space-y-3">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
            {new Date(test.startTime).toLocaleDateString()}
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-2 text-gray-400" />
            {new Date(test.startTime).toLocaleTimeString()}
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <CheckCircle className="h-4 w-4 mr-2 text-gray-400" />
            Passing Score: {test.passingScore}/{test.maxScore}
          </div>

          {test.totalScore !== undefined && (
            <div className="mt-4">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Score</span>
                <span className="text-sm font-medium text-gray-700">
                  {((test.totalScore / test.maxScore) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(test.totalScore / test.maxScore) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            if (test.status === 'completed') {
              // Navigate to test results page using the new route
              navigate(`/dashboard/user/test-results/${test.testId}`);
            } else {
              // Navigate to continue test page
              navigate(`/test/shared/${test.uuid}`);
            }
          }}
          className={`mt-6 w-full py-2.5 px-4 rounded-lg text-white font-medium
            flex items-center justify-center gap-2 transition-all duration-300
            ${test.status === 'completed'
              ? 'bg-emerald-500 hover:bg-emerald-600'
              : 'bg-blue-500 hover:bg-blue-600'
            }`}
        >
          {test.status === 'completed' ? (
            <>
              <Eye className="h-4 w-4" />
              View Results
            </>
          ) : (
            <>
              <PlayCircle className="h-4 w-4" />
              Continue Test
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <SideBar isOpen={isSidebarOpen} onClose={toggleSidebar} />
      
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : ''}`}>
        <div className="p-6 space-y-6">
          {/* Header with Search */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900">My Tests</h1>
            <div className="relative w-full md:w-96">
              <Search className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 
                  focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
                  transition-all duration-300"
              />
            </div>
          </div>

          {/* Test Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTests.map((test) => (
              <TestCard key={test.testId} test={test} />
            ))}
          </div>

          {/* Empty State */}
          {filteredTests.length === 0 && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tests found</h3>
              <p className="text-gray-500">Try adjusting your search term</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserTests;
