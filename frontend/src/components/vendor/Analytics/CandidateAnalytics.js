import React, { useEffect, useState } from 'react';
import Layout from '../../layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '../../common/Card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Users2, Calendar, Search } from 'lucide-react';
import { apiService } from '../../../services/api';

const CandidateAnalytics = () => {
  const [metrics, setMetrics] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('24h');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsResponse, candidatesResponse] = await Promise.all([
          apiService.get('vendor/candidate-metrics', { 
            params: { 
              timeframe,
              search: searchTerm || undefined
            }
          }),
          apiService.get('vendor/candidates')
        ]);

        setMetrics(metricsResponse.data.metrics);
        setCandidates(candidatesResponse.data.candidates);
      } catch (error) {
        console.error('Error fetching candidate data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeframe, searchTerm]);

  if (loading) {
    return <div>Loading...</div>;
  }

  const candidateMetrics = [
    {
      title: 'Total Candidates',
      value: metrics.totalCandidates,
      icon: Users2,
      change: '+8%',
      trend: 'up'
    },
    {
      title: 'Active Test Takers',
      value: metrics.activeTestTakers,
      icon: Users2,
      change: '+12%',
      trend: 'up'
    },
    {
      title: 'Completed Tests',
      value: metrics.statusBreakdown.completed,
      icon: Calendar,
      change: '+5%',
      trend: 'up'
    },
    {
      title: 'In Progress',
      value: metrics.statusBreakdown.inProgress,
      icon: Calendar,
      change: '+3%',
      trend: 'up'
    }
  ];

  // Data for status distribution pie chart
  const statusData = [
    { name: 'Completed', value: metrics.statusBreakdown.completed },
    { name: 'In Progress', value: metrics.statusBreakdown.inProgress },
    { name: 'Pending', value: metrics.statusBreakdown.pending }
  ];

  const COLORS = ['#10B981', '#6366F1', '#F59E0B'];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">Candidate Analytics</h1>
          <div className="flex gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search candidates..."
                className="pl-10 pr-4 py-2 border rounded-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
            </div>
            <select 
              className="px-4 py-2 border rounded-lg"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-4 gap-6">
          {candidateMetrics.map((metric, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <metric.icon className="h-4 w-4 text-gray-400" />
                    <p className="text-sm text-gray-500">{metric.title}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-semibold text-gray-800">{metric.value}</h3>
                    <span className={`text-sm px-2 py-1 rounded-full ${
                      metric.trend === 'up' 
                        ? 'bg-green-50 text-green-600' 
                        : 'bg-red-50 text-red-600'
                    }`}>
                      {metric.change}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader className="border-b p-6">
              <CardTitle>Status Distribution</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b p-6">
              <CardTitle>Recent Candidates</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {candidates.slice(0, 5).map((candidate) => (
                  <div key={candidate._id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{candidate.name}</p>
                      <p className="text-sm text-gray-500">{candidate.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {candidate.testsAttempted.length} tests
                      </p>
                      <p className="text-sm text-gray-500">
                        Avg: {candidate.averageScore}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default CandidateAnalytics;