import React from 'react';
import Layout from '../../layout/Layout';
import { Card, CardContent } from '../../common/Card';
import { Calendar, Clock, Users2, Filter, Download, ChevronRight } from 'lucide-react';

const PastTests = () => {
  const pastTests = [
    {
      id: 1,
      testName: 'Backend Developer Assessment',
      date: '2024-03-10',
      time: '11:00 AM',
      duration: '90 mins',
      candidates: 12,
      completed: 11,
      averageScore: 82
    },
    {
      id: 2,
      testName: 'Java Programming Test',
      date: '2024-03-08',
      time: '2:00 PM',
      duration: '60 mins',
      candidates: 15,
      completed: 15,
      averageScore: 78
    }
  ];

  return (
    <Layout>
      <div className="space-y-6 relative">
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="text-2xl font-semibold text-gray-800">Coming Soon</div>
        </div>

        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">Past Tests</h1>
          <div className="flex gap-3">
            <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Results
            </button>
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search past tests..."
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

        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Test Name</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Date & Time</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Duration</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Candidates</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Avg. Score</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pastTests.map((test) => (
                  <tr key={test.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <span className="font-medium text-gray-800">{test.testName}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        {test.date} {test.time}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        {test.duration}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Users2 className="h-4 w-4" />
                        {test.completed}/{test.candidates}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full text-sm">
                        {test.averageScore}%
                      </span>
                    </td>
                    <td className="p-4">
                      <button className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1">
                        View Details
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PastTests; 