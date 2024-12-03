import React from 'react';
import Layout from '../../layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '../../common/Card';
import { Code, Copy, Key, RefreshCw, Shield } from 'lucide-react';

const APIAccess = () => {
  const apiKeys = [
    {
      id: 1,
      name: 'Production Key',
      key: 'sk_prod_2024xxxxxxxxxxxx',
      created: '2024-03-01',
      lastUsed: '2024-03-15',
      status: 'Active'
    },
    {
      id: 2,
      name: 'Development Key',
      key: 'sk_dev_2024xxxxxxxxxxxx',
      created: '2024-03-10',
      lastUsed: '2024-03-14',
      status: 'Active'
    }
  ];

  return (
    <Layout>
      <div className="relative">
        <div className="space-y-6 blur-sm">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-800">API Access</h1>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center gap-2">
                <Key className="h-4 w-4" />
                Generate New Key
              </button>
            </div>
          </div>

          {/* API Keys */}
          <Card>
            <CardHeader className="border-b p-6">
              <CardTitle>API Keys</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Name</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">API Key</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Created</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Last Used</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {apiKeys.map((key) => (
                    <tr key={key.id} className="hover:bg-gray-50">
                      <td className="p-4">
                        <span className="font-medium text-gray-800">{key.name}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <code className="px-2 py-1 bg-gray-100 rounded text-sm">{key.key}</code>
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <Copy className="h-4 w-4 text-gray-400" />
                          </button>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-600">{key.created}</td>
                      <td className="p-4 text-sm text-gray-600">{key.lastUsed}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full text-sm">
                          {key.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <button className="text-sm text-blue-500 hover:text-blue-600">
                          Regenerate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* API Documentation Quick Access */}
          <div className="grid grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Code className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800 mb-1">API Reference</h3>
                    <p className="text-sm text-gray-500 mb-3">
                      Complete API documentation with examples
                    </p>
                    <button className="text-sm text-emerald-600 hover:text-emerald-700">
                      View Documentation →
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Shield className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800 mb-1">Authentication</h3>
                    <p className="text-sm text-gray-500 mb-3">
                      Learn about API authentication
                    </p>
                    <button className="text-sm text-emerald-600 hover:text-emerald-700">
                      View Guide →
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <RefreshCw className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800 mb-1">Rate Limits</h3>
                    <p className="text-sm text-gray-500 mb-3">
                      Understanding API rate limits
                    </p>
                    <button className="text-sm text-emerald-600 hover:text-emerald-700">
                      Learn More →
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <h2 className="text-4xl font-bold text-gray-800">Coming Soon</h2>
        </div>
      </div>
    </Layout>
  );
};

export default APIAccess; 