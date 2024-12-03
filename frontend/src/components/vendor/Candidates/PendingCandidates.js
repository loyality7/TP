import React from 'react';
import Layout from '../../layout/Layout';
import { Card, CardContent } from '../../common/Card';
import { Search, Filter, Mail, Clock, RefreshCw } from 'lucide-react';

const PendingCandidates = () => {
  const pendingCandidates = [
    {
      id: 1,
      name: 'Alice Johnson',
      email: 'alice@example.com',
      testName: 'Frontend Development',
      invitedOn: '2024-03-12',
      expiresIn: '2 days',
      status: 'Not Started',
      remindersSent: 1
    },
    {
      id: 2,
      name: 'Robert Wilson',
      email: 'robert@example.com',
      testName: 'Java Programming',
      invitedOn: '2024-03-13',
      expiresIn: '3 days',
      status: 'Not Started',
      remindersSent: 2
    }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">Pending Candidates</h1>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Send Reminders
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
                  placeholder="Search pending candidates..."
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

        {/* Pending Candidates Table */}
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Candidate</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Test Name</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Invited On</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Expires In</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Reminders</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pendingCandidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div>
                        <div className="font-medium text-gray-800">{candidate.name}</div>
                        <div className="text-sm text-gray-500">{candidate.email}</div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-600">{candidate.testName}</td>
                    <td className="p-4 text-sm text-gray-600">{candidate.invitedOn}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-amber-600">{candidate.expiresIn}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-gray-50 text-gray-600 rounded-full text-xs font-medium">
                        {candidate.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {candidate.remindersSent} sent
                    </td>
                    <td className="p-4">
                      <button className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1">
                        <RefreshCw className="h-3 w-3" />
                        Resend Invite
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

export default PendingCandidates; 