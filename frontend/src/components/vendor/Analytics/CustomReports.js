import React from 'react';
import Layout from '../../layout/Layout';
import { Card, CardContent } from '../../common/Card';
import { FileText, Download, Plus } from 'lucide-react';

const CustomReports = () => {
  const savedReports = [
    {
      id: 1,
      name: 'Monthly Performance Summary',
      type: 'Performance',
      lastGenerated: '2024-03-15',
      schedule: 'Monthly',
      format: 'PDF'
    },
    {
      id: 2,
      name: 'Candidate Progress Report',
      type: 'Candidates',
      lastGenerated: '2024-03-14',
      schedule: 'Weekly',
      format: 'Excel'
    }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">Custom Reports</h1>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create New Report
            </button>
          </div>
        </div>

        {/* Saved Reports */}
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Report Name</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Type</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Last Generated</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Schedule</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Format</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {savedReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-800">{report.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-600">{report.type}</td>
                    <td className="p-4 text-sm text-gray-600">{report.lastGenerated}</td>
                    <td className="p-4 text-sm text-gray-600">{report.schedule}</td>
                    <td className="p-4 text-sm text-gray-600">{report.format}</td>
                    <td className="p-4">
                      <button className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1">
                        <Download className="h-4 w-4" />
                        Download
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

export default CustomReports;