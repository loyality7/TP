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
  if (!category) return 'gray';
  
  const colors = [
    'blue',
    'emerald',
    'violet',
    'amber',
    'rose',
    'cyan',
    'fuchsia',
    'lime',
    'orange',
    'teal'
  ];
  
  const index = [...category].reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
};

const getBadgeForDifficulty = (difficulty) => {
  const badgeMap = {
    'beginner': 'Beginner',
    'intermediate': 'Intermediate',
    'advanced': 'Advanced',
    'expert': 'Expert'
  };
  
  return badgeMap[difficulty?.toLowerCase()] || 'N/A';
};

const getDummyData = () => {
  return {
    overview: {
      totalTestsTaken: 0,
      thisMonthTests: 0,
      mcqPerformance: 0,
      codingPerformance: 0,
      successRate: 0,
      improvement: 0,
      averageScore: 0,
      codingTestsTaken: 0
    },
    performanceMetrics: {
      'JavaScript': {
        count: 0,
        avgScore: 0,
        successRate: 0
      },
      'Python': {
        count: 0,
        avgScore: 0,
        successRate: 0
      },
      'Data Structures': {
        count: 0,
        avgScore: 0,
        successRate: 0
      }
    },
    recentTests: []  // Empty array for tests
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
      value: `${dashboardData?.overview?.mcqPerformance || 0}%`,
      icon: Award,
      color: 'amber',
      subtitle: 'Average Score'
    },
    {
      title: 'Coding Performance',
      value: `${dashboardData?.overview?.codingPerformance || 0}%`,
      icon: TrendingUp,
      color: 'violet',
      subtitle: 'Success Rate'
    },
    {
      title: 'Success Rate',
      value: `${dashboardData?.overview?.successRate || 0}%`,
      icon: CheckCircle,
      color: 'green',
      subtitle: `${dashboardData?.overview?.improvement || 0}% improvement`
    }
  ];

  const performanceStats = Object.entries(dashboardData?.performanceMetrics || {})
    .filter(([category]) => category)
    .map(([category, data]) => ({
      category,
      count: data?.count || 0,
      avgScore: parseFloat(data?.avgScore || 0),
      successRate: parseFloat(data?.successRate || 0),
      color: getColorForCategory(category)
    }));

  const mappedRecentTests = (dashboardData?.recentTests || []).map(test => ({
    id: test?._id,
    title: test?.test?.title || 'Untitled Test',
    type: test?.test?.type || 'unknown',
    date: test?.endTime || test?.startTime || new Date(),
    duration: test?.test?.duration,
    score: {
      total: test?.totalScore || 0,
      mcq: test?.mcqSubmission?.totalScore || 0,
      coding: test?.codingSubmission?.totalScore || 0
    },
    status: test?.status || 'unknown',
    topics: [test?.test?.category].filter(Boolean),
    badge: getBadgeForDifficulty(test?.test?.difficulty)
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
                        <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-green-50 text-green-700">
                          {test.score.total}%
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

                    {/* Scores */}
                    <div className="space-y-2">
                      {/* MCQ Score */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-600 w-12">MCQ</span>
                        <div className="flex-1">
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-violet-500 rounded-full transition-all duration-500"
                              style={{ width: `${test.score.mcq}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-xs font-medium text-gray-900 w-8 text-right">
                          {test.score.mcq}%
                        </span>
                      </div>

                      {/* Coding Score */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-600 w-12">Coding</span>
                        <div className="flex-1">
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                              style={{ width: `${test.score.coding}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-xs font-medium text-gray-900 w-8 text-right">
                          {test.score.coding}%
                        </span>
                      </div>
                    </div>

                    {/* Topics */}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {test.topics.slice(0, 3).map((topic, i) => (
                        <span 
                          key={i}
                          className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600"
                        >
                          {topic}
                        </span>
                      ))}
                      {test.topics.length > 3 && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                          +{test.topics.length - 3}
                        </span>
                      )}
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
                      className={`bg-${category.color}-50 rounded-lg p-3`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-800">
                          {category.category}
                        </span>
                        <span className={`text-xs font-medium text-${category.color}-600 bg-${category.color}-100 px-2 py-1 rounded-full`}>
                          {category.count} tests
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className={`h-1.5 bg-${category.color}-100 rounded-full overflow-hidden`}>
                            <div 
                              className={`h-full bg-${category.color}-500 rounded-full transition-all duration-500`}
                              style={{ width: `${category.avgScore}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {category.avgScore}%
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

