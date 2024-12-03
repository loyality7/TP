import React from 'react';
import Layout from '../../layout/Layout';
import { Card, CardContent } from '../../common/Card';
import { Calendar, Clock, Users2, Filter, Bell } from 'lucide-react';

const UpcomingTests = () => {
  const upcomingTests = [
    {
      id: 1,
      testName: 'Frontend Developer Assessment',
      date: '2024-03-20',
      time: '10:00 AM',
      duration: '120 mins',
      candidates: 15,
      status: 'Scheduled'
    },
    {
      id: 2,
      testName: 'Python Programming Test',
      date: '2024-03-21',
      time: '2:00 PM',
      duration: '90 mins',
      candidates: 8,
      status: 'Pending'
    }
  ];

  return (
    <Layout>
      <div className="space-y-6 relative">
        {/* Single blur and overlay for entire content */}
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="text-2xl font-semibold text-gray-800">Coming Soon</div>
        </div>

        {/* Rest of the content without individual overlays */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">Upcoming Tests</h1>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Schedule Test
            </button>
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search tests..."
                  className="w-full pl-4 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-100 outline-none"
                />
              </div>
              <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {upcomingTests.map((test) => (
            <Card key={test.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-lg font-medium text-gray-800">{test.testName}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {test.date}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {test.time} ({test.duration})
                      </div>
                      <div className="flex items-center gap-1">
                        <Users2 className="h-4 w-4" />
                        {test.candidates} candidates
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      test.status === 'Scheduled' 
                        ? 'bg-emerald-50 text-emerald-600' 
                        : 'bg-amber-50 text-amber-600'
                    }`}>
                      {test.status}
                    </span>
                    <button className="p-2 hover:bg-gray-50 rounded-full">
                      <Bell className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default UpcomingTests; 