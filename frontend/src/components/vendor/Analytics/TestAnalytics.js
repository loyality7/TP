import React, { useEffect, useState } from 'react';
import Layout from '../../layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '../../common/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Filter } from 'lucide-react';
import { apiService } from '../../../services/api';

const TestAnalytics = () => {
  const defaultAnalytics = {
    overview: {
      tests: { total: 0, active: 0 },
      submissions: { 
        total: 0, 
        uniqueCandidates: 0, 
        averageScore: 0,
        recent: 0 
      },
      trends: { 
        daily: [
          { date: 'No data', count: 0 }
        ] 
      },
      performance: {
        recentActivity: [
          { candidateName: 'No data', score: 0, testTitle: 'No data', completedAt: new Date() }
        ]
      }
    }
  };

  const [analyticsData, setAnalyticsData] = useState(defaultAnalytics);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try { 
        const [overviewResponse, performanceResponse] = await Promise.all([
          apiService.get('vendor/analytics/overview', { params: { period } }),
          apiService.get('vendor/analytics/performance', { params: { period } })
        ]);

        setAnalyticsData({
          overview: overviewResponse.data,
          performance: performanceResponse.data
        });
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [period]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading analytics...</div>;
  }

  if (!analyticsData) {
    return <div>Loading...</div>;
  }

  const testMetrics = [
    {
      title: 'Total Tests Created',
      value: analyticsData.overview.tests.total,
      change: `${analyticsData.overview.tests.active} active`,
      trend: 'up'
    },
    {
      title: 'Total Submissions',
      value: analyticsData.overview.submissions.total,
      change: `${analyticsData.overview.submissions.uniqueCandidates} candidates`,
      trend: 'up'
    },
    {
      title: 'Average Score',
      value: `${analyticsData.overview.submissions.averageScore}%`,
      change: '+5%',
      trend: 'up'
    },
    {
      title: 'Recent Activity',
      value: analyticsData.overview.submissions.recent,
      change: 'Last 24h',
      trend: 'up'
    }
  ];

  // Transform daily trends data for the chart
  const trendData = analyticsData.overview.trends.daily.map(item => ({
    date: item.date,
    submissions: item.count
  }));

  // Transform performance data for the chart
  const performanceData = analyticsData.overview.performance.recentActivity.map(activity => ({
    name: activity.candidateName,
    score: activity.score,
    test: activity.testTitle,
    date: new Date(activity.completedAt).toLocaleDateString()
  }));

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">Test Analytics</h1>
          <div className="flex gap-3">
            <select 
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-4 gap-6">
          {testMetrics.map((metric, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">{metric.title}</p>
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

        {/* Charts */}
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader className="border-b p-6">
              <CardTitle>Submission Trends</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="submissions" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b p-6">
              <CardTitle>Recent Performance</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#10b981" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default TestAnalytics; 