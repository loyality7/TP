import React from 'react';
import Layout from '../../layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '../../common/Card';
import { Search, Filter, UserPlus, Mail, MoreVertical } from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiService } from '../../../services/api';
import * as XLSX from 'xlsx';

const AllCandidates = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const response = await apiService.getCandidates();
        const formattedCandidates = response.data.candidates.map(candidate => ({
          name: candidate.name,
          email: candidate.email,
          status: 'Active',
          testsCompleted: candidate.totalAttempts,
          averageScore: parseFloat(candidate.averageScore),
          lastActive: new Date(candidate.lastAttempt).toLocaleDateString()
        }));
        setCandidates(formattedCandidates);
      } catch (error) {
        console.error('Error fetching candidates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, []);

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(candidates);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Candidates");
    XLSX.writeFile(workbook, "candidates.xlsx");
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">All Candidates</h1>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Add Candidate
            </button>
            <button 
              onClick={handleExport} 
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              Export
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search candidates..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-100 outline-none"
                />
              </div>
              <button className="px-4 py-2 border rounded-lg flex items-center gap-2 hover:bg-gray-50">
                <Filter className="h-4 w-4" />
                Filters
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Candidates Table */}
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Name</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Email</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Tests Completed</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Avg. Score</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Last Active</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {candidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-gray-50">
                    <td className="p-4 text-sm">
                      <span className="font-medium text-gray-800">{candidate.name}</span>
                    </td>
                    <td className="p-4 text-sm text-gray-600">{candidate.email}</td>
                    <td className="p-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        candidate.status === 'Active' 
                          ? 'bg-green-50 text-green-600' 
                          : 'bg-gray-50 text-gray-600'
                      }`}>
                        {candidate.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600">{candidate.testsCompleted}</td>
                    <td className="p-4 text-sm">
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full">
                        {candidate.averageScore}%
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600">{candidate.lastActive}</td>
                    <td className="p-4">
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <MoreVertical className="h-4 w-4 text-gray-400" />
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

export default AllCandidates; 