import React from 'react';
import Layout from '../../layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '../../common/Card';
import { Search, Filter, Clock, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiService } from '../../../services/api';

const ActiveCandidates = () => {
  const [activeCandidates, setActiveCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveCandidates = async () => {
      try {
        const response = await apiService.getCandidateMetrics({ status: 'in_progress' });
        const formattedCandidates = response.data.candidates.map(candidate => ({
          id: candidate.candidateId,
          name: candidate.candidateName,
          email: candidate.email,
          testName: candidate.testType,
          startTime: new Date(candidate.testPeriod.start).toLocaleString(),
          timeSpent: `${Math.round(candidate.timeSpent / 60)} mins`,
          progress: candidate.progress || 0,
          status: 'In Progress'
        }));
        setActiveCandidates(formattedCandidates);
      } catch (error) {
        console.error('Error fetching active candidates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveCandidates();
  }, []);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">Active Candidates</h1>
          <div className="flex gap-3">
            <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search active candidates..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-100 outline-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Active Candidates Table */}
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Name</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Test Name</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Start Time</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Time Spent</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Progress</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activeCandidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div>
                        <div className="font-medium text-gray-800">{candidate.name}</div>
                        <div className="text-sm text-gray-500">{candidate.email}</div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-600">{candidate.testName}</td>
                    <td className="p-4 text-sm text-gray-600">{candidate.startTime}</td>
                    <td className="p-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        {candidate.timeSpent}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div 
                          className="bg-emerald-500 h-2 rounded-full" 
                          style={{ width: `${candidate.progress}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{candidate.progress}% completed</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                        {candidate.status}
                      </span>
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

export default ActiveCandidates; 