import React from 'react';
import Layout from '../../layout/Layout';
import { Card, CardContent } from '../../common/Card';
import { BookOpen, Search, ExternalLink, Star } from 'lucide-react';

const Documentation = () => {
  const docs = [
    {
      id: 1,
      title: 'Getting Started',
      description: 'Learn the basics of setting up and configuring your assessment platform.',
      category: 'Basics',
      readTime: '5 min'
    },
    {
      id: 2,
      title: 'Creating Tests',
      description: 'Comprehensive guide on creating and managing assessment tests.',
      category: 'Tests',
      readTime: '10 min'
    },
    {
      id: 3,
      title: 'Managing Candidates',
      description: 'Learn how to invite and manage candidates for your assessments.',
      category: 'Candidates',
      readTime: '8 min'
    }
  ];

  return (
    <Layout>
      <div className="relative">
        <div className="space-y-6 blur-sm">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-800">Documentation</h1>
            <div className="flex gap-3">
              <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
                <Star className="h-4 w-4" />
                Favorites
              </button>
            </div>
          </div>

          {/* Search */}
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search documentation..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-100 outline-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Documentation Grid */}
          <div className="grid grid-cols-2 gap-6">
            {docs.map((doc) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-medium">
                        {doc.category}
                      </span>
                      <h3 className="text-lg font-medium text-gray-800">{doc.title}</h3>
                      <p className="text-sm text-gray-500">{doc.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          {doc.readTime} read
                        </span>
                      </div>
                    </div>
                    <button className="p-2 hover:bg-gray-50 rounded-full">
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <h2 className="text-4xl font-bold text-gray-800">Coming Soon</h2>
        </div>
      </div>
    </Layout>
  );
};

export default Documentation; 