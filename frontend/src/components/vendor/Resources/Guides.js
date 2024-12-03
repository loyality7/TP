import React from 'react';
import Layout from '../../layout/Layout';
import { Card, CardContent } from '../../common/Card';
import { BookOpen, Search, Play, FileText, Users2, BarChart2, Clock } from 'lucide-react';

const Guides = () => {
  const guides = [
    {
      id: 1,
      title: 'Getting Started Guide',
      description: 'Learn the basics of our platform and how to set up your first assessment.',
      category: 'Basics',
      duration: '15 min',
      icon: BookOpen
    },
    {
      id: 2,
      title: 'Advanced Test Creation',
      description: 'Master the art of creating comprehensive and effective assessments.',
      category: 'Tests',
      duration: '20 min',
      icon: FileText
    },
    {
      id: 3,
      title: 'Candidate Management',
      description: 'Learn how to effectively manage and track candidates.',
      category: 'Candidates',
      duration: '12 min',
      icon: Users2
    },
    {
      id: 4,
      title: 'Analytics & Reporting',
      description: 'Get insights from your assessment data with advanced analytics.',
      category: 'Analytics',
      duration: '18 min',
      icon: BarChart2
    }
  ];

  return (
    <Layout>
      <div className="relative">
        <div className="space-y-6 blur-sm">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-800">Guides & Tutorials</h1>
          </div>

          {/* Search */}
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search guides..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-100 outline-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Guides Grid */}
          <div className="grid grid-cols-2 gap-6">
            {guides.map((guide) => (
              <Card key={guide.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <guide.icon className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-medium">
                            {guide.category}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {guide.duration}
                        </span>
                      </div>
                      <h3 className="text-lg font-medium text-gray-800 mb-2">{guide.title}</h3>
                      <p className="text-sm text-gray-500 mb-4">{guide.description}</p>
                      <button className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700">
                        <Play className="h-4 w-4" />
                        Start Guide
                      </button>
                    </div>
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

export default Guides; 