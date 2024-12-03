import React from 'react';
import Card from '../../common/Card';

const CandidateDashboard = () => {
  return (
    <div className="p-4 bg-gray-50">
      {/* Work in Progress Banner */}
      <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <span className="text-yellow-400 text-xl">⚠️</span>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <span className="font-medium">Work in Progress:</span> This platform is still under development. Please contact your vendor for test assignments.
            </p>
          </div>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Welcome to Your Test Center</h1>
        <p className="opacity-90">Ready to showcase your skills?</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card 
          title="Tests Waiting" 
          value="0" 
          icon="🎯"
          className="border-l-4 border-blue-500"
        />
        <Card 
          title="Tests Completed" 
          value="0" 
          icon="✅"
          className="border-l-4 border-green-500"
        />
        <Card 
          title="Overall Performance" 
          value="0%" 
          icon="📊"
          className="border-l-4 border-purple-500"
        />
      </div>

      {/* Upcoming Tests */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <span className="mr-2">📝</span> Upcoming Tests
          </h2>
          <div className="space-y-4">
            <div className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
              No upcoming tests scheduled
            </div>
          </div>
        </div>

        {/* Recent Results */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <span className="mr-2">🏆</span> Recent Results
          </h2>
          <div className="space-y-4">
            <div className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
              Complete your first test to see results
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 bg-indigo-50 rounded-lg text-indigo-600 hover:bg-indigo-100 transition-all">
            View Available Tests
          </button>
          <button className="p-4 bg-green-50 rounded-lg text-green-600 hover:bg-green-100 transition-all">
            Resume Test
          </button>
          <button className="p-4 bg-purple-50 rounded-lg text-purple-600 hover:bg-purple-100 transition-all">
            Practice Tests
          </button>
          <button className="p-4 bg-blue-50 rounded-lg text-blue-600 hover:bg-blue-100 transition-all">
            View Certificates
          </button>
        </div>
      </div>
    </div>
  );
};

export default CandidateDashboard;
