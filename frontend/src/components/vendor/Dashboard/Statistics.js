import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Layout from '../../layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '../../common/Card';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, Legend, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart, Scatter,
  Line
} from 'recharts';
import { 
  Download, Clock, Brain, Target, Zap, BookOpen, 
  AlertCircle, TrendingUp, ChevronDown, FileText, Share2, Printer, 
  Sliders, RefreshCw, ArrowUpRight, ArrowDownRight,
  Award, Users, CheckCircle, XCircle, AlertTriangle, Shield
} from 'lucide-react';
import { motion } from 'framer-motion';

// Move metric configurations outside the component
const metricConfigs = {
  completionRate: {
    ranges: [
      { min: 90, color: 'emerald', label: 'Excellent', icon: Award },
      { min: 75, color: 'blue', label: 'Good', icon: CheckCircle },
      { min: 0, color: 'amber', label: 'Needs Improvement', icon: AlertCircle }
    ],
    gradient: 'from-emerald-400 to-emerald-500',
    type: 'completionRate'
  },
  avgTime: {
    ranges: [
      { max: 30, color: 'emerald', label: 'Fast', icon: Zap },
      { max: 45, color: 'blue', label: 'Average', icon: Clock },
      { max: 999, color: 'amber', label: 'Slow', icon: AlertCircle }
    ],
    gradient: 'from-blue-400 to-blue-500',
    type: 'avgTime'
  },
  dropoutRate: {
    ranges: [
      { max: 10, color: 'emerald', label: 'Low', icon: Shield },
      { max: 20, color: 'amber', label: 'Moderate', icon: AlertTriangle },
      { max: 999, color: 'red', label: 'High', icon: AlertCircle }
    ],
    gradient: 'from-red-400 to-red-500',
    type: 'dropoutRate'
  },
  skillImprovement: {
    ranges: [
      { min: 80, color: 'emerald', label: 'High', icon: TrendingUp },
      { min: 60, color: 'blue', label: 'Moderate', icon: ArrowUpRight },
      { min: 0, color: 'amber', label: 'Low', icon: Target }
    ],
    gradient: 'from-violet-400 to-violet-500',
    type: 'skillImprovement'
  }
};

// Helper function to get metric status
const getMetricStatus = (value, type) => {
  const config = metricConfigs[type];
  if (!config) return null;

  const range = config.ranges.find(r => {
    if ('min' in r) return value >= r.min;
    if ('max' in r) return value <= r.max;
    return false;
  });

  return range || config.ranges[config.ranges.length - 1];
};

// Add default data structures
const defaultSkillPerformanceData = [
  { skill: 'Problem Solving', value: 85 },
  { skill: 'Code Quality', value: 78 },
  { skill: 'Time Management', value: 82 },
  { skill: 'Algorithm Knowledge', value: 75 },
  { skill: 'Debug Skills', value: 88 },
  { skill: 'Code Optimization', value: 72 }
];

const defaultPerformanceDistribution = [
  { range: '90-100', count: 35, label: 'Excellent' },
  { range: '80-89', count: 58, label: 'Very Good' },
  { range: '70-79', count: 72, label: 'Good' },
  { range: '60-69', count: 45, label: 'Average' },
  { range: 'Below 60', count: 30, label: 'Need Improvement' }
];

const defaultDifficultyLevels = [
  { level: 'Easy', count: 100, successRate: 92, avgTime: 25, totalAttempts: 120 },
  { level: 'Medium', count: 150, successRate: 78, avgTime: 35, totalAttempts: 180 },
  { level: 'Hard', count: 75, successRate: 65, avgTime: 45, totalAttempts: 100 },
  { level: 'Expert', count: 35, successRate: 52, avgTime: 55, totalAttempts: 60 }
];

// Update the data generator functions
const generateSkillPerformanceData = (timeRange) => {
  switch (timeRange) {
    case 'week':
      return [
        { skill: 'Problem Solving', value: 82 },
        { skill: 'Code Quality', value: 75 },
        { skill: 'Time Management', value: 80 },
        { skill: 'Algorithm Knowledge', value: 70 },
        { skill: 'Debug Skills', value: 85 },
        { skill: 'Code Optimization', value: 68 }
      ];
    case 'month':
      return defaultSkillPerformanceData;
    case 'quarter':
      return [
        { skill: 'Problem Solving', value: 88 },
        { skill: 'Code Quality', value: 82 },
        { skill: 'Time Management', value: 85 },
        { skill: 'Algorithm Knowledge', value: 78 },
        { skill: 'Debug Skills', value: 90 },
        { skill: 'Code Optimization', value: 76 }
      ];
    case 'year':
      return [
        { skill: 'Problem Solving', value: 90 },
        { skill: 'Code Quality', value: 85 },
        { skill: 'Time Management', value: 87 },
        { skill: 'Algorithm Knowledge', value: 82 },
        { skill: 'Debug Skills', value: 92 },
        { skill: 'Code Optimization', value: 80 }
      ];
    default:
      return defaultSkillPerformanceData;
  }
};

const generatePerformanceDistribution = (timeRange) => {
  switch (timeRange) {
    case 'week':
      return [
        { range: '90-100', count: 25, label: 'Excellent' },
        { range: '80-89', count: 48, label: 'Very Good' },
        { range: '70-79', count: 62, label: 'Good' },
        { range: '60-69', count: 35, label: 'Average' },
        { range: 'Below 60', count: 20, label: 'Need Improvement' }
      ];
    case 'month':
      return defaultPerformanceDistribution;
    case 'quarter':
      return [
        { range: '90-100', count: 45, label: 'Excellent' },
        { range: '80-89', count: 68, label: 'Very Good' },
        { range: '70-79', count: 82, label: 'Good' },
        { range: '60-69', count: 55, label: 'Average' },
        { range: 'Below 60', count: 40, label: 'Need Improvement' }
      ];
    case 'year':
      return [
        { range: '90-100', count: 55, label: 'Excellent' },
        { range: '80-89', count: 78, label: 'Very Good' },
        { range: '70-79', count: 92, label: 'Good' },
        { range: '60-69', count: 65, label: 'Average' },
        { range: 'Below 60', count: 50, label: 'Need Improvement' }
      ];
    default:
      return defaultPerformanceDistribution;
  }
};

const generateDifficultyAnalysis = (timeRange) => {
  switch (timeRange) {
    case 'week':
      return [
        { level: 'Easy', count: 80, successRate: 94, avgTime: 22, totalAttempts: 100 },
        { level: 'Medium', count: 120, successRate: 82, avgTime: 32, totalAttempts: 150 },
        { level: 'Hard', count: 55, successRate: 68, avgTime: 42, totalAttempts: 90 },
        { level: 'Expert', count: 25, successRate: 55, avgTime: 52, totalAttempts: 50 }
      ];
    case 'month':
      return defaultDifficultyLevels;
    case 'quarter':
      return [
        { level: 'Easy', count: 120, successRate: 96, avgTime: 20, totalAttempts: 140 },
        { level: 'Medium', count: 180, successRate: 85, avgTime: 30, totalAttempts: 200 },
        { level: 'Hard', count: 95, successRate: 72, avgTime: 40, totalAttempts: 120 },
        { level: 'Expert', count: 45, successRate: 58, avgTime: 50, totalAttempts: 70 }
      ];
    case 'year':
      return [
        { level: 'Easy', count: 150, successRate: 97, avgTime: 18, totalAttempts: 170 },
        { level: 'Medium', count: 220, successRate: 88, avgTime: 28, totalAttempts: 250 },
        { level: 'Hard', count: 125, successRate: 75, avgTime: 38, totalAttempts: 150 },
        { level: 'Expert', count: 65, successRate: 62, avgTime: 48, totalAttempts: 90 }
      ];
    default:
      return defaultDifficultyLevels;
  }
};

// First, let's add new chart data generators
const generateSkillTrendData = (timeRange) => {
  switch (timeRange) {
    case 'week':
      return [
        { name: 'Problem Solving', current: 82, previous: 78, improvement: 5.1 },
        { name: 'Code Quality', current: 75, previous: 70, improvement: 7.1 },
        { name: 'Time Management', current: 80, previous: 75, improvement: 6.7 },
        { name: 'Algorithm Knowledge', current: 70, previous: 65, improvement: 7.7 },
        { name: 'Debug Skills', current: 85, previous: 80, improvement: 6.3 }
      ];
    case 'month':
      return [
        { name: 'Problem Solving', current: 85, previous: 80, improvement: 6.3 },
        { name: 'Code Quality', current: 78, previous: 72, improvement: 8.3 },
        { name: 'Time Management', current: 82, previous: 76, improvement: 7.9 },
        { name: 'Algorithm Knowledge', current: 75, previous: 68, improvement: 10.3 },
        { name: 'Debug Skills', current: 88, previous: 82, improvement: 7.3 }
      ];
    // Add more cases for quarter and year
    default:
      return [];
  }
};

const generateCandidateProgressData = (timeRange) => {
  switch (timeRange) {
    case 'week':
      return [
        { category: 'Rapid Progress', count: 45, percentage: 30 },
        { category: 'Steady Growth', count: 60, percentage: 40 },
        { category: 'Gradual Improvement', count: 30, percentage: 20 },
        { category: 'Needs Support', count: 15, percentage: 10 }
      ];
    case 'month':
      return [
        { category: 'Rapid Progress', count: 150, percentage: 35 },
        { category: 'Steady Growth', count: 180, percentage: 42 },
        { category: 'Gradual Improvement', count: 70, percentage: 16 },
        { category: 'Needs Support', count: 30, percentage: 7 }
      ];
    // Add more cases for quarter and year
    default:
      return [];
  }
};

const generateLearningPathData = (timeRange) => {
  switch (timeRange) {
    case 'week':
      return [
        { path: 'Frontend Dev', completionRate: 85, avgTime: 24, totalEnrolled: 120 },
        { path: 'Backend Dev', completionRate: 78, avgTime: 32, totalEnrolled: 90 },
        { path: 'Full Stack', completionRate: 72, avgTime: 40, totalEnrolled: 70 },
        { path: 'DevOps', completionRate: 68, avgTime: 36, totalEnrolled: 50 },
        { path: 'Mobile Dev', completionRate: 82, avgTime: 28, totalEnrolled: 80 }
      ];
    case 'month':
      return [
        { path: 'Frontend Dev', completionRate: 88, avgTime: 22, totalEnrolled: 450 },
        { path: 'Backend Dev', completionRate: 82, avgTime: 30, totalEnrolled: 380 },
        { path: 'Full Stack', completionRate: 75, avgTime: 38, totalEnrolled: 280 },
        { path: 'DevOps', completionRate: 72, avgTime: 34, totalEnrolled: 220 },
        { path: 'Mobile Dev', completionRate: 85, avgTime: 26, totalEnrolled: 320 }
      ];
    // Add more cases for quarter and year
    default:
      return [];
  }
};

const Statistics = () => {
  const [timeRanges, setTimeRanges] = useState({
    overview: 'month',
    skillGrowth: 'month',
    performance: 'month',
    difficulty: 'month',
    progress: 'month',
    learningPath: 'month'
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState(['completionRate', 'avgScore', 'dropoutRate']);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  // Available time range options
  const timeRangeOptions = ['week', 'month', 'quarter', 'year'];

  const handleExport = useCallback((format) => {
    // Implementation for different export formats
    console.log(`Exporting in ${format} format`);
  }, []);

  // Refresh data
  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLastUpdated(new Date());
    } finally {
      setIsLoading(false);
    }
  };

  // Update the metrics options with proper mapping and colors
  const metricOptions = [
    { label: 'Completion Rate', key: 'completionRate', color: '#818cf8' },
    { label: 'Average Score', key: 'avgScore', color: '#34d399' },
    { label: 'Dropout Rate', key: 'dropoutRate', color: '#fb7185' },
    { label: 'Time Spent', key: 'avgTime', color: '#fbbf24' },
    { label: 'Candidates', key: 'totalCandidates', color: '#a78bfa' }
  ];

  // Generate data based on selected time range for each chart
  const generateTimeRangeData = useCallback((chartId) => {
    let data;
    const selectedRange = timeRanges[chartId];

    switch (selectedRange) {
      case 'week':
        data = [
          { label: 'Monday', completionRate: 88, avgScore: 82, dropoutRate: 8, avgTime: 40, totalCandidates: 145 },
          { label: 'Tuesday', completionRate: 92, avgScore: 85, dropoutRate: 6, avgTime: 38, totalCandidates: 160 },
          { label: 'Wednesday', completionRate: 85, avgScore: 79, dropoutRate: 10, avgTime: 42, totalCandidates: 138 },
          { label: 'Thursday', completionRate: 90, avgScore: 83, dropoutRate: 7, avgTime: 39, totalCandidates: 152 },
          { label: 'Friday', completionRate: 94, avgScore: 86, dropoutRate: 5, avgTime: 37, totalCandidates: 165 },
          { label: 'Saturday', completionRate: 82, avgScore: 78, dropoutRate: 12, avgTime: 43, totalCandidates: 120 },
          { label: 'Sunday', completionRate: 80, avgScore: 77, dropoutRate: 14, avgTime: 44, totalCandidates: 110 }
        ];
        break;

      case 'month':
        data = [
          { label: 'Jan 1-7', completionRate: 85, avgScore: 80, dropoutRate: 10, avgTime: 41, totalCandidates: 320 },
          { label: 'Jan 8-14', completionRate: 88, avgScore: 82, dropoutRate: 8, avgTime: 40, totalCandidates: 350 },
          { label: 'Jan 15-21', completionRate: 92, avgScore: 85, dropoutRate: 6, avgTime: 38, totalCandidates: 380 },
          { label: 'Jan 22-31', completionRate: 90, avgScore: 83, dropoutRate: 7, avgTime: 39, totalCandidates: 360 }
        ];
        break;

      case 'quarter':
        data = [
          { label: 'January', completionRate: 86, avgScore: 81, dropoutRate: 9, avgTime: 40, totalCandidates: 1200 },
          { label: 'February', completionRate: 89, avgScore: 83, dropoutRate: 7, avgTime: 39, totalCandidates: 1350 },
          { label: 'March', completionRate: 93, avgScore: 86, dropoutRate: 5, avgTime: 37, totalCandidates: 1500 }
        ];
        break;

      case 'year':
        data = [
          { label: 'Q1 2024', completionRate: 88, avgScore: 82, dropoutRate: 8, avgTime: 40, totalCandidates: 3800 },
          { label: 'Q2 2024', completionRate: 91, avgScore: 84, dropoutRate: 6, avgTime: 38, totalCandidates: 4200 },
          { label: 'Q3 2024', completionRate: 94, avgScore: 87, dropoutRate: 4, avgTime: 36, totalCandidates: 4600 },
          { label: 'Q4 2024', completionRate: 92, avgScore: 85, dropoutRate: 5, avgTime: 37, totalCandidates: 4400 }
        ];
        break;

      default:
        data = [
          { label: 'Jan 1-7', completionRate: 85, avgScore: 80, dropoutRate: 10, avgTime: 41, totalCandidates: 320 },
          { label: 'Jan 8-14', completionRate: 88, avgScore: 82, dropoutRate: 8, avgTime: 40, totalCandidates: 350 },
          { label: 'Jan 15-21', completionRate: 92, avgScore: 85, dropoutRate: 6, avgTime: 38, totalCandidates: 380 },
          { label: 'Jan 22-31', completionRate: 90, avgScore: 83, dropoutRate: 7, avgTime: 39, totalCandidates: 360 }
        ];
    }

    return data;
  }, [timeRanges]);

  const timeRangeData = useMemo(() => generateTimeRangeData(), [generateTimeRangeData]);

  const quickStatsData = useMemo(() => {
    const data = timeRangeData;
    if (!data?.length) return [];

    const calculateStat = (key, isInverse = false) => {
      const avg = Math.round(data.reduce((acc, curr) => acc + curr[key], 0) / data.length);
      const trend = Math.round(((data[data.length - 1][key] - data[0][key]) / data[0][key]) * 100);
      return {
        value: avg,
        trend: isInverse ? -trend : trend
      };
    };

    return [
      {
        title: 'Test Success Rate',
        ...calculateStat('completionRate'),
        type: 'completionRate',
        icon: CheckCircle
      },
      {
        title: 'Avg. Completion Time',
        ...calculateStat('avgTime', true),
        type: 'avgTime',
        icon: Clock
      },
      {
        title: 'Failed Attempts',
        ...calculateStat('dropoutRate', true),
        type: 'dropoutRate',
        icon: XCircle
      },
      {
        title: 'Skill Improvement',
        ...calculateStat('avgScore'),
        type: 'skillImprovement',
        icon: TrendingUp
      }
    ].map(stat => {
      const status = getMetricStatus(stat.value, stat.type);
      return {
        ...stat,
        color: status.color,
        label: status.label,
        value: `${stat.value}${stat.type === 'avgTime' ? 'min' : '%'}`,
        trend: `${stat.trend > 0 ? '+' : ''}${stat.trend}%`
      };
    });
  }, [timeRangeData]);

  // Add click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterOpen && !event.target.closest('.export-dropdown')) {
        setFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [filterOpen]);

  // Modified TimeRangeSelector component with dropdown
  const TimeRangeSelector = ({ chartId }) => (
    <div className="relative">
      <select
        value={timeRanges[chartId]}
        onChange={(e) => setTimeRanges(prev => ({ ...prev, [chartId]: e.target.value }))}
        className="appearance-none bg-white border rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {timeRangeOptions.map(range => (
          <option key={range} value={range}>
            {range.charAt(0).toUpperCase() + range.slice(1)}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
    </div>
  );

  // Add performanceDistribution constant
  const performanceDistribution = generatePerformanceDistribution(timeRanges.performance);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-3">
                Advanced Analytics
                {isLoading ? (
                  <RefreshCw className="h-5 w-5 animate-spin text-indigo-500" />
                ) : (
                  <button 
                    onClick={handleRefresh}
                    className="text-gray-400 hover:text-indigo-500 transition-colors"
                  >
                    <RefreshCw className="h-5 w-5" />
                  </button>
                )}
              </h1>
              <p className="text-gray-500 mt-1 flex items-center gap-2">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
            
            {/* Enhanced Controls */}
            <div className="flex items-center gap-4">
              {/* Time Range Selector */}
              <TimeRangeSelector chartId="overview" />

              {/* Export Options Dropdown */}
              <div className="relative export-dropdown">
                <button 
                  onClick={() => setFilterOpen(!filterOpen)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Export
                  <ChevronDown className="h-4 w-4" />
                </button>
                
                {filterOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-10">
                    <button 
                      onClick={() => handleExport('pdf')}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Export as PDF
                    </button>
                    <button 
                      onClick={() => handleExport('excel')}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Export as Excel
                    </button>
                    <button 
                      onClick={() => handleExport('print')}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Print Report
                    </button>
                    <button 
                      onClick={() => handleExport('share')}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Report
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickStatsData.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="relative overflow-hidden bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all duration-300"
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                  <motion.div 
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `radial-gradient(circle at 50% 50%, currentColor 1px, transparent 1px)`,
                      backgroundSize: '16px 16px'
                    }}
                    animate={{
                      backgroundPosition: ['0px 0px', '16px 16px'],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                </div>

                {/* Content */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-500 font-medium">{stat.title}</p>
                    <div className={`p-2 rounded-lg bg-${stat.color}-50 ring-1 ring-${stat.color}-100/30`}>
                      <stat.icon className={`w-4 h-4 text-${stat.color}-500`} />
                    </div>
                  </div>

                  <div className="flex items-end gap-2">
                    <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex items-center gap-0.5 text-sm font-medium ${
                        stat.trend.startsWith('+') ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {stat.trend.startsWith('+') ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                      {stat.trend}
                    </motion.div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full bg-gradient-to-r ${metricConfigs[stat.type].gradient}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${parseFloat(stat.value)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Enhanced Metric Filters */}
          <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600">
              <Sliders className="h-4 w-4" />
              <span className="text-sm font-medium">Metrics:</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {metricOptions.map((metric) => (
                <button
                  key={metric.key}
                  className={`px-3 py-1.5 text-sm rounded-full transition-all
                    ${selectedMetrics.includes(metric.key)
                      ? 'bg-indigo-100 text-indigo-600 ring-1 ring-indigo-200'
                      : 'bg-white text-gray-600 hover:bg-gray-100 ring-1 ring-gray-200'
                    }`}
                  onClick={() => {
                    setSelectedMetrics(prev => 
                      prev.includes(metric.key)
                        ? prev.filter(m => m !== metric.key)
                        : [...prev, metric.key]
                    );
                  }}
                >
                  {metric.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Enhanced Analytics Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Improved Performance Overview with Sine Wave */}
          <Card className="col-span-12">
            <CardHeader className="border-b p-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-indigo-500" />
                    Performance Overview
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">Comprehensive view of key metrics over time</p>
                </div>
                <TimeRangeSelector chartId="overview" />
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={generateTimeRangeData('overview')}>
                    <defs>
                      {metricOptions.map((metric) => (
                        <linearGradient 
                          key={metric.key} 
                          id={`${metric.key}Gradient`} 
                          x1="0" y1="0" x2="0" y2="1"
                        >
                          <stop offset="5%" stopColor={metric.color} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={metric.color} stopOpacity={0}/>
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke="#f0f0f0" 
                      vertical={false}
                    />
                    <XAxis 
                      dataKey="label" 
                      stroke="#9ca3af"
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="#9ca3af"
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      labelStyle={{
                        fontWeight: 'bold',
                        marginBottom: '4px'
                      }}
                    />
                    <Legend 
                      verticalAlign="top"
                      height={36}
                      iconType="circle"
                    />
                    {metricOptions.map((metric) => (
                      selectedMetrics.includes(metric.key) && (
                        <Area 
                          key={metric.key}
                          type="monotone" 
                          dataKey={metric.key}
                          name={metric.label}
                          stroke={metric.color}
                          fill={`url(#${metric.key}Gradient)`}
                          strokeWidth={2}
                          dot={{
                            r: 4,
                            strokeWidth: 2,
                            fill: '#fff',
                            stroke: metric.color
                          }}
                          activeDot={{
                            r: 6,
                            strokeWidth: 0,
                            fill: metric.color
                          }}
                        />
                      )
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Skill Growth Comparison */}
          <Card className="col-span-6">
            <CardHeader className="border-b p-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-violet-500" />
                    Skill Growth Comparison
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">Current vs Previous Period Performance</p>
                </div>
                <TimeRangeSelector chartId="skillGrowth" />
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={generateSkillTrendData(timeRanges.skillGrowth)}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="current" fill="#8b5cf6" name="Current Period" />
                    <Bar dataKey="previous" fill="#c4b5fd" name="Previous Period" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Candidate Progress Distribution */}
          <Card className="col-span-6">
            <CardHeader className="border-b p-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    Candidate Progress Distribution
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">Learning progress categories</p>
                </div>
                <TimeRangeSelector chartId="progress" />
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={generateCandidateProgressData(timeRanges.progress)}
                      dataKey="count"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {generateCandidateProgressData(timeRanges.progress).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`#${['60a5fa', '818cf8', '6366f1', '4f46e5'][index]}`} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Learning Path Effectiveness */}
          <Card className="col-span-12">
            <CardHeader className="border-b p-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-green-500" />
                    Learning Path Effectiveness
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">Success rates across different learning paths</p>
                </div>
                <TimeRangeSelector chartId="learningPath" />
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={generateLearningPathData(timeRanges.learningPath)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="path" />
                    <YAxis yAxisId="left" label={{ value: 'Completion Rate (%)', angle: -90, position: 'insideLeft' }} />
                    <YAxis yAxisId="right" orientation="right" label={{ value: 'Avg. Time (hours)', angle: 90, position: 'insideRight' }} />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="completionRate" fill="#10b981" name="Completion Rate" />
                    <Line yAxisId="right" type="monotone" dataKey="avgTime" stroke="#6366f1" name="Avg. Completion Time" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Skill Performance Analysis */}
          <Card className="col-span-6">
            <CardHeader className="border-b p-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-violet-500" />
                    Skill Performance Analysis
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">Candidate performance across key skills</p>
                </div>
                <TimeRangeSelector chartId="skillRadar" />
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={generateSkillPerformanceData(timeRanges.skillRadar)}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="skill" stroke="#6b7280" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name="Skills"
                      dataKey="value"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.2}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Performance Distribution */}
          <Card className="col-span-6">
            <CardHeader className="border-b p-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-emerald-500" />
                    Performance Distribution
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">Candidate score distribution analysis</p>
                </div>
                <TimeRangeSelector chartId="performance" />
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={generatePerformanceDistribution(timeRanges.performance)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="range" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                    >
                      {performanceDistribution.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`}
                          fill={`#10b981${90 - index * 15}`}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Test Difficulty Analysis */}
          <Card className="col-span-6">
            <CardHeader className="border-b p-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-amber-500" />
                    Test Difficulty Analysis
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">Success rate by difficulty level</p>
                </div>
                <TimeRangeSelector chartId="difficulty" />
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={generateDifficultyAnalysis(timeRanges.difficulty)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="level" stroke="#9ca3af" />
                    <YAxis yAxisId="left" stroke="#9ca3af" />
                    <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="successRate" stroke="#10b981" />
                    <Scatter yAxisId="right" dataKey="successRate" fill="#10b981" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Statistics;