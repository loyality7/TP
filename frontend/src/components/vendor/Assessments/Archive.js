import React from 'react';
import Layout from '../../layout/Layout';
import { Card, CardContent } from '../../common/Card';
import { Search, Filter, Archive as ArchiveIcon, RefreshCw, Trash2 } from 'lucide-react';

const Archive = () => {
  const archivedTests = [
    {
      id: 1,
      title: 'Frontend Developer Assessment 2023',
      category: 'Web Development',
      archivedDate: '2024-01-15',
      lastActive: '2023-12-31',
      completions: 156,
      averageScore: 78
    },
    {
      id: 2,
      title: 'Database Design Test v1',
      category: 'Database',
      archivedDate: '2024-02-01',
      lastActive: '2024-01-28',
      completions: 89,
      averageScore: 82
    }
  ];

  return (
    <Layout>
      <div className="space-y-6 relative">
        {/* Blur overlay */}
        <div className="absolute inset-0 backdrop-blur-sm bg-white/50 z-10 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Coming Soon</h2>
            <p className="text-gray-600">This feature is currently under development</p>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">Archived Tests</h1>
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
                placeholder="Search archived tests..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-100 outline-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Archived Tests Table */}
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Test Name</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Category</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Archived Date</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Last Active</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Completions</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Avg. Score</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {archivedTests.map((test) => (
                  <tr key={test.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <ArchiveIcon className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-800">{test.title}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-600">{test.category}</td>
                    <td className="p-4 text-sm text-gray-600">{test.archivedDate}</td>
                    <td className="p-4 text-sm text-gray-600">{test.lastActive}</td>
                    <td className="p-4 text-sm text-gray-600">{test.completions}</td>
                    <td className="p-4 text-sm">
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full">
                        {test.averageScore}%
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button className="p-1 hover:bg-emerald-50 rounded" title="Restore">
                          <RefreshCw className="h-4 w-4 text-emerald-500" />
                        </button>
                        <button className="p-1 hover:bg-red-50 rounded" title="Delete Permanently">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
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

export default Archive; 