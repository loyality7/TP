import React from 'react';
import { Routes, Route } from 'react-router-dom';
import SideBar from './SideBar';
import UserTests from './UserTests';
import UserReports from './UserReports';
import UserTestResult from './UserTestResult';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from 'react-query';
import apiService from '../../services/api';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Award, 
  TrendingUp,
  CheckCircle,
  Code,
  ListChecks,
  Brain,
  Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "../common/Card";

const getColorForCategory = (category) => {
  if (!category) return { name: 'gray', classes: { bg: 'bg-gray-500', light: 'bg-gray-50', text: 'text-gray-600' } };
  
  const colors = {
    blue: { bg: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-600' },
    emerald: { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-600' },
    violet: { bg: 'bg-violet-500', light: 'bg-violet-50', text: 'text-violet-600' },
    amber: { bg: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-600' },
    rose: { bg: 'bg-rose-500', light: 'bg-rose-50', text: 'text-rose-600' },
    cyan: { bg: 'bg-cyan-500', light: 'bg-cyan-50', text: 'text-cyan-600' },
    fuchsia: { bg: 'bg-fuchsia-500', light: 'bg-fuchsia-50', text: 'text-fuchsia-600' },
    lime: { bg: 'bg-lime-500', light: 'bg-lime-50', text: 'text-lime-600' },
    orange: { bg: 'bg-orange-500', light: 'bg-orange-50', text: 'text-orange-600' },
    teal: { bg: 'bg-teal-500', light: 'bg-teal-50', text: 'text-teal-600' }
  };
  
  const colorNames = Object.keys(colors);
  const index = [...category].reduce((acc, char) => acc + char.charCodeAt(0), 0) % colorNames.length;
  return { name: colorNames[index], classes: colors[colorNames[index]] };
};

const getDummyData = () => {
  return {
    overview: {
      totalTestsTaken: 0,
      thisMonthTests: 0,
      averageScore: 0,
      completedTests: 0,
      upcomingTests: 0,
      lastTestScore: 0
    },
    performanceByCategory: {},
    recentTests: []
  };
};

const DashboardHome = () => {
  const { isAuthenticated, token } = useAuth();

  const { data: dashboardData, isLoading, error } = useQuery(
    'userDashboard',
    async () => {
      if (!isAuthenticated || !token) {
        throw new Error('Not authenticated');
      }
      
      try {
        const response = await apiService.get('user/dashboard');
        return response?.data || getDummyData();
      } catch (err) {
        console.error('Dashboard fetch error details:', {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data
        });
        
        return getDummyData();
      }
    },
    {
      retry: 1,
      enabled: isAuthenticated,
      initialData: getDummyData()
    }
  );

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-500">
        Error loading dashboard: {error.message}
      </div>
    );
  }

  const overviewStats = [
    {
      title: 'Tests Taken',
      value: dashboardData?.overview?.totalTestsTaken || 0,
      icon: FileText,
      color: 'blue',
      subtitle: `+${dashboardData?.overview?.thisMonthTests || 0} this month`
    },
    {
      title: 'MCQ Performance',
      value: `${(dashboardData?.overview?.mcqPerformance || 0).toFixed(1)}%`,
      icon: Award,
      color: 'amber',
      subtitle: 'Average Score'
    },
    {
      title: 'Coding Performance',
      value: `${(dashboardData?.overview?.codingPerformance || 0).toFixed(1)}%`,
      icon: TrendingUp,
      color: 'violet',
      subtitle: 'Success Rate'
    },
    {
      title: 'Success Rate',
      value: `${(dashboardData?.overview?.successRate || 0).toFixed(1)}%`,
      icon: CheckCircle,
      color: 'green',
      subtitle: `${(dashboardData?.overview?.improvement || 0).toFixed(1)}% improvement`
    }
  ];

  const performanceStats = Object.entries(dashboardData?.performanceByCategory || {})
    .filter(([category]) => category)
    .map(([category, data]) => ({
      category,
      count: data?.count || 0,
      avgScore: parseFloat(data?.avgScore || 0),
      successRate: parseFloat(data?.passRate || 0),
      color: getColorForCategory(category)
    }));

  const mappedRecentTests = (dashboardData?.recentTests || []).map(test => ({
    id: test?.testId,
    title: test?.title || 'Untitled Test',
    type: 'assessment',
    date: test?.startTime || new Date(),
    duration: test?.endTime ? new Date(test?.endTime) - new Date(test?.startTime) : null,
    status: test?.completionStatus || 'unknown',
    progress: {
      mcq: {
        completed: test?.progress?.answeredMCQs || 0,
        total: test?.progress?.totalMCQs || 0,
        percentage: test?.progress?.totalMCQs ? 
          Math.round((test?.progress?.answeredMCQs / test?.progress?.totalMCQs) * 100) : 0
      },
      coding: {
        completed: test?.progress?.completedChallenges || 0,
        total: test?.progress?.totalCodingChallenges || 0,
        percentage: test?.progress?.totalCodingChallenges ? 
          Math.round((test?.progress?.completedChallenges / test?.progress?.totalCodingChallenges) * 100) : 0
      }
    },
    topics: [test?.category].filter(Boolean),
    score: {
      mcq: test?.mcqScore || 0,
      coding: test?.codingScore || 0,
      total: test?.totalScore || 0,
      max: test?.maxScore || 0
    }
  }));

  return (
    <div className="space-y-8">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {overviewStats.map((metric, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -2 }}
          >
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl bg-${metric.color}-50 ring-1 ring-${metric.color}-100`}>
                      <metric.icon className={`h-5 w-5 text-${metric.color}-500`} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-800">{metric.title}</span>
                      <span className="text-sm text-gray-500">{metric.subtitle}</span>
                    </div>
                  </div>
                </div>
                <div className={`text-3xl font-bold text-${metric.color}-600`}>
                  {metric.value}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Test Results Section - Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Test Results Card */}
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader className="border-b p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Test Results</CardTitle>
                <p className="text-sm text-gray-500 mt-1">Your assessment performance</p>
              </div>
              <ListChecks className="h-5 w-5 text-gray-500" />
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mappedRecentTests.map((test, index) => (
                <motion.div
                  key={test.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2 rounded-lg ${
                        test.type === 'assessment' ? 'bg-violet-50' : 'bg-emerald-50'
                      }`}>
                        {test.type === 'assessment' ? (
                          <Brain className={`h-5 w-5 ${
                            test.type === 'assessment' ? 'text-violet-500' : 'text-emerald-500'
                          }`} />
                        ) : (
                          <Code className="h-5 w-5 text-emerald-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700">
                          {test.badge}
                        </span>
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                          test.status === 'completed' ? 'bg-green-50 text-green-700' :
                          test.status === 'in_progress' ? 'bg-yellow-50 text-yellow-700' :
                          'bg-gray-50 text-gray-700'
                        }`}>
                          {test.status === 'in_progress' ? 'In Progress' : 
                           test.status === 'completed' ? 'Completed' : 
                           test.status}
                        </span>
                      </div>
                    </div>

                    {/* Title and Date */}
                    <div className="mb-3">
                      <h3 className="font-semibold text-gray-900 line-clamp-1">{test.title}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(test.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>

                    {/* Progress Bars */}
                    <div className="space-y-2">
                      {/* MCQ Progress */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-600 w-12">MCQ</span>
                        <div className="flex-1">
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-violet-500 rounded-full transition-all duration-500"
                              style={{ width: `${test.progress.mcq.percentage}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-xs font-medium text-gray-900 w-16 text-right">
                          {test.progress.mcq.completed}/{test.progress.mcq.total}
                        </span>
                      </div>

                      {/* Coding Progress */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-600 w-12">Coding</span>
                        <div className="flex-1">
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                              style={{ width: `${test.progress.coding.percentage}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-xs font-medium text-gray-900 w-16 text-right">
                          {test.progress.coding.completed}/{test.progress.coding.total}
                        </span>
                      </div>
                    </div>

                    {/* Topics */}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {test.topics.map((topic, i) => (
                        <span 
                          key={i}
                          className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Stats Card */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Performance Stats</CardTitle>
                <p className="text-sm text-gray-500 mt-1">Your test statistics</p>
              </div>
              <Target className="h-5 w-5 text-gray-500" />
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Test Completion Stats */}
              <div className="space-y-4">
                {[
                  {
                    label: 'Tests Completed',
                    value: dashboardData?.overview?.totalTestsTaken || '0',
                    icon: CheckCircle,
                    color: 'green',
                    trend: `+${dashboardData?.overview?.thisMonthTests || 0} this month`
                  },
                  {
                    label: 'Average Score',
                    value: `${dashboardData?.overview?.averageScore || 0}%`,
                    icon: Target,
                    color: 'blue',
                    trend: `${dashboardData?.overview?.improvement || 0}% improvement`
                  },
                  {
                    label: 'Coding Challenges',
                    value: dashboardData?.overview?.codingTestsTaken || '0',
                    icon: Code,
                    color: 'violet',
                    trend: `${dashboardData?.overview?.codingPerformance || 0}% success rate`
                  }
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-50 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-${stat.color}-50`}>
                          <stat.icon className={`h-5 w-5 text-${stat.color}-500`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                          <p className="text-lg font-semibold text-gray-900">{stat.value}</p>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        {stat.trend}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Test Categories - New Section */}
              <div className="mt-6">
                <h4 className="font-medium text-gray-700 mb-4">Test Categories</h4>
                <div className="space-y-3">
                  {performanceStats.map((category, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`${category.color.classes.light} rounded-lg p-3`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-800">
                          {category.category}
                        </span>
                        <span className={`text-xs font-medium ${category.color.classes.text} ${category.color.classes.light} px-2 py-1 rounded-full`}>
                          {category.count} tests
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${category.color.classes.bg} rounded-full transition-all duration-500`}
                              style={{ 
                                width: `${Math.max(category.avgScore, 2)}%`,
                                transition: 'width 1s ease-in-out'
                              }}
                            />
                          </div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {category.avgScore.toFixed(1)}%
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const UserDashboard = () => {
  const [isSidebarOpen, setSidebarOpen] = React.useState(true);

  return (
    <div className="min-h-screen bg-gray-100">
      <SideBar 
        isOpen={isSidebarOpen} 
        onClose={() => setSidebarOpen(false)}
      />
      <div className={`transition-all duration-200 ${isSidebarOpen ? 'lg:ml-64' : ''}`}>
        <div className="p-4 lg:p-6">
          <Routes>
            <Route index element={<DashboardHome />} />
            <Route path="tests" element={<UserTests />} />
            <Route path="reports" element={<UserReports />} />
            <Route path="results" element={<UserTestResult />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;

