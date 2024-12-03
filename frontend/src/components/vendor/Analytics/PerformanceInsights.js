import React from 'react';
import Layout from '../../layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '../../common/Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Target, TrendingUp, Calendar, Filter } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

const PerformanceInsights = () => {
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/vendor/performance/metrics?period=${period}`);
        setMetrics(response.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [period]);

  // Transform API data for charts
  const performanceData = metrics?.trends?.monthly?.map(item => ({
    month: item.month.slice(-2), // Get last 2 chars of YYYY-MM
    avgScore: item.averageScore,
    passRate: metrics.overall.passRate,
    completion: metrics.overall.completionRate
  })) || [];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">Performance Insights</h1>
          <div className="flex gap-3">
            <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Last 6 Months
            </button>
            <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-80">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        ) : error ? (
          <div className="text-red-500 text-center">{error}</div>
        ) : (
          <>
            {/* Performance Trends Chart */}
            <Card>
              <CardHeader className="border-b p-6">
                <CardTitle>Performance Trends</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="avgScore" stroke="#8b5cf6" name="Average Score" />
                      <Line type="monotone" dataKey="passRate" stroke="#10b981" name="Pass Rate" />
                      <Line type="monotone" dataKey="completion" stroke="#3b82f6" name="Completion Rate" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Key Insights */}
            <div className="grid grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Top Performing Areas</h3>
                  <div className="space-y-4">
                    {metrics?.skills && Object.entries(metrics.skills)
                      .sort((a, b) => b[1].score - a[1].score)
                      .slice(0, 3)
                      .map(([skill, data]) => (
                        <div key={skill} className="flex justify-between items-center">
                          <span className="capitalize">{skill.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="font-medium">{data.score}%</span>
                        </div>
                      ))
                    }
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Areas for Improvement</h3>
                  <div className="space-y-4">
                    {metrics?.skills && Object.entries(metrics.skills)
                      .sort((a, b) => a[1].score - b[1].score)
                      .slice(0, 3)
                      .map(([skill, data]) => (
                        <div key={skill} className="flex justify-between items-center">
                          <span className="capitalize">{skill.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="font-medium">{data.score}%</span>
                        </div>
                      ))
                    }
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Recommendations</h3>
                  <div className="space-y-4">
                    {metrics?.skills && Object.entries(metrics.skills)
                      .filter(([_, data]) => data.score < 70)
                      .map(([skill]) => (
                        <div key={skill} className="text-sm text-gray-600">
                          Consider focusing on improving {skill.replace(/([A-Z])/g, ' $1').toLowerCase()} skills
                        </div>
                      ))
                    }
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default PerformanceInsights;