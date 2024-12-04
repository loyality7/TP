import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import apiService from '../../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/common/Card";
import { 
  FileText, Users, Clock, 
  Award, BookOpen, MessageSquare, Sparkles, Zap, TrendingUp, Shield, 
  PlusCircle, 
  UserPlus, 
  BarChart3, 
  ArrowRight,
  Settings,
  Download,
  UserX
} from 'lucide-react';
import Layout from '../../layout/Layout';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';



const getMetricValueColor = (title) => {
  const colors = {
    'Total Tests': 'text-blue-600',
    'Active Candidates': 'text-green-600',
    'Pass Rate': 'text-amber-600',
    'New Discussions': 'text-violet-600'
  };
  return colors[title] || colors['Total Tests'];
};



// Add this helper function with the other helper functions at the top
const getMetricIcon = (title) => {
  const icons = {
    'Total Tests': <FileText className="h-5 w-5 text-blue-500" />,
    'Active Candidates': <Users className="h-5 w-5 text-green-500" />,
    'Pass Rate': <Award className="h-5 w-5 text-amber-500" />,
    'New Discussions': <MessageSquare className="h-5 w-5 text-violet-500" />
  };
  return icons[title] || icons['Total Tests'];
};

// Add this helper function with the other helper functions at the top
const getMetricBgColor = (title) => {
  const colors = {
    'Total Tests': 'bg-blue-50',
    'Active Candidates': 'bg-green-50',
    'Pass Rate': 'bg-amber-50',
    'New Discussions': 'bg-violet-50'
  };
  return colors[title] || colors['Total Tests'];
};

// Enhanced MetricCard with hover effects and animations
const MetricCard = React.memo(({ title, value, subtitle, trend, delay }) => {
  const getMetricConfig = (title) => {
    const configs = {
      'Total Tests': {
        color: 'blue',
        bgPattern: 'radial-gradient(circle at 100% 100%, #dbeafe 0%, transparent 50%)',
        icon: FileText
      },
      'Active Candidates': {
        color: 'green',
        bgPattern: 'radial-gradient(circle at 0% 0%, #dcfce7 0%, transparent 50%)',
        icon: Users
      },
      'Pass Rate': {
        color: 'amber',
        bgPattern: 'radial-gradient(circle at 100% 0%, #fef3c7 0%, transparent 50%)',
        icon: Award
      },
      'New Discussions': {
        color: 'violet',
        bgPattern: 'radial-gradient(circle at 0% 100%, #ede9fe 0%, transparent 50%)',
        icon: MessageSquare
      }
    };
    return configs[title] || configs['Total Tests'];
  };

  const config = getMetricConfig(title);
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      <Card className="overflow-hidden">
        <CardContent className="p-6 relative" style={{ background: config.bgPattern }}>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.div 
                whileHover={{ rotate: 15 }}
                className={`p-2.5 rounded-xl bg-${config.color}-50 ring-1 ring-${config.color}-100`}
              >
                <Icon className={`h-5 w-5 text-${config.color}-500`} />
              </motion.div>
              <span className="font-medium text-gray-800">{title}</span>
            </div>
          </div>

          {/* Value and Trend */}
          <div className="flex items-end justify-between">
            <div>
              <motion.div 
                className={`text-3xl font-bold ${
                  title === 'Total Tests' ? 'text-blue-600' :
                  title === 'Active Candidates' ? 'text-green-600' :
                  title === 'Pass Rate' ? 'text-amber-600' :
                  title === 'New Discussions' ? 'text-violet-600' :
                  'text-gray-800'
                }`}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {value}
              </motion.div>
              <span className="text-sm text-gray-500 mt-1 block">{subtitle}</span>
            </div>
            {trend && (
              <div className="flex items-center gap-1">
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`flex items-center text-sm font-medium ${
                    trend > 0 ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  <TrendingUp className={`h-4 w-4 ${trend < 0 && 'rotate-180'}`} />
                  {Math.abs(trend)}%
                </motion.div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={`w-1.5 h-1.5 rounded-full ${
                    trend > 0 ? 'bg-green-400' : 'bg-red-400'
                  }`}
                />
              </div>
            )}
          </div>

          {/* Progress Indicator */}
          <div className="mt-4">
            <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Number(value) / 3)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`absolute h-full rounded-full bg-gradient-to-r from-${config.color}-400 to-${config.color}-500`}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

// Add display name for better debugging
MetricCard.displayName = 'MetricCard';

// Add TimeRangeSelector Component
const TimeRangeSelector = ({ activeRange, onRangeChange }) => {
  const ranges = [
    { label: '1H', value: '1H' },
    { label: '1D', value: '1D' },
    { label: '7D', value: '7D' },
    { label: '1M', value: '1M' },
    { label: '1Y', value: '1Y' },
  ];

  return (
    <div className="flex items-center space-x-2">
      {ranges.map(range => (
        <button
          key={range.value}
          onClick={() => onRangeChange(range.value)}
          className={`px-3 py-1 rounded-lg text-sm ${
            activeRange === range.value
              ? 'bg-blue-50 text-blue-600'
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          {range.label}
        </button>
      ))}
      <motion.button 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium 
          bg-blue-50 text-blue-600 hover:bg-blue-100 
          transition-colors duration-200 
          border border-blue-200"
      >
        <Download className="h-4 w-4" />
        Export
      </motion.button>
    </div>
  );
};

// Add this new pill progress indicator component
const PillProgressIndicator = ({ value, isHighScore, trend }) => {
  const getStatusConfig = (score) => {
    if (score >= 90) return {
      color: 'text-green-500',
      bg: 'bg-green-500',
      glow: 'shadow-green-500/20',
      light: 'bg-green-100'
    };
    if (score >= 80) return {
      color: 'text-blue-500',
      bg: 'bg-blue-500',
      glow: 'shadow-blue-500/20',
      light: 'bg-blue-100'
    };
    return {
      color: 'text-blue-400',
      bg: 'bg-blue-400',
      glow: 'shadow-blue-400/20',
      light: 'bg-blue-50'
    };
  };

  const status = getStatusConfig(value);

  return (
    <motion.div 
      className={`relative w-44 h-16 rounded-full ${status.light} shadow-lg ${status.glow}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 rounded-full overflow-hidden">
        <motion.div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, ${status.bg} 1px, transparent 1px)`,
            backgroundSize: '8px 8px'
          }}
          animate={{
            backgroundPosition: ['0px 0px', '8px 8px'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      {/* Content Container */}
      <div className="relative h-full flex items-center justify-between px-4">
        {/* Score Section */}
        <div className="flex items-center gap-2">
          <motion.div 
            className={`text-2xl font-bold ${status.color}`}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
          >
            {value}
          </motion.div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-gray-500">Score</span>
            {trend && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`flex items-center gap-0.5 text-xs font-medium ${
                  trend > 0 ? 'text-green-500' : 'text-red-500'
                }`}
              >
                <TrendingUp className={`h-3 w-3 ${trend < 0 && 'rotate-180'}`} />
                {Math.abs(trend)}%
              </motion.div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className={`h-8 w-px ${status.bg} opacity-20`} />

        {/* Status Section */}
        <div className="flex items-center gap-2">
          {isHighScore ? (
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className={`p-1.5 rounded-full ${status.light}`}
            >
              <Sparkles className={`h-4 w-4 ${status.color}`} />
            </motion.div>
          ) : (
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className={`p-1.5 rounded-full ${status.light}`}
            >
              <Shield className={`h-4 w-4 ${status.color}`} />
            </motion.div>
          )}
          <span className={`text-sm font-medium ${status.color}`}>
            {value >= 90 ? 'Excellent' : value >= 80 ? 'Good' : 'Average'}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

// Add this helper function at the top with other helpers
const trimText = (text, maxLength = 16) => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

// Update the AssessmentProgressCard component
const AssessmentProgressCard = ({ title, category, duration, passingScore, totalScore, status, difficulty }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.01 }}
      className="p-4 hover:bg-gray-50/50 transition-all duration-300"
    >
      <div className="flex items-center justify-between">
        {/* Left: Icon and Test Info */}
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1" title={title}>
              {trimText(title)}
            </h3>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-gray-400" />
                <span>{category}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-gray-400" />
                <span>{duration} mins</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Created Today */}
        <div className="text-sm text-gray-500">
          Created Today
        </div>

        {/* Right: Passing Score, Difficulty, Status */}
        <div className="flex items-center space-x-8">
          {/* Passing Score */}
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">
              {passingScore}/{totalScore}
            </div>
            <div className="text-xs text-gray-500">
              Passing Score
            </div>
          </div>

          {/* Difficulty */}
          <span className="px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700">
            {difficulty}
          </span>

          {/* Status */}
          <div className="flex items-center space-x-1.5">
            <div className={`h-2 w-2 rounded-full ${
              status === 'published' ? 'bg-green-500' : 'bg-amber-500'
            }`} />
            <span className={`text-sm font-medium ${
              status === 'published' ? 'text-green-600' : 'text-amber-600'
            }`}>
              {status === 'published' ? 'Published' : 'Draft'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Add this new modern skill card component
const ModernSkillCard = ({ skill, score }) => {
  const getSkillConfig = (skillName, value) => {
    const configs = {
      'Problem Solving': {
        icon: Zap,
        color: value >= 85 ? 'blue' : 'indigo',
        bgPattern: 'radial-gradient(circle at 100% 100%, #dbeafe 0%, transparent 50%)'
      },
      'Code Quality': {
        icon: FileText,
        color: value >= 80 ? 'violet' : 'purple',
        bgPattern: 'radial-gradient(circle at 0% 0%, #ede9fe 0%, transparent 50%)'
      },
      'Performance': {
        icon: TrendingUp,
        color: value >= 90 ? 'green' : 'emerald',
        bgPattern: 'radial-gradient(circle at 100% 0%, #dcfce7 0%, transparent 50%)'
      },
      'Security': {
        icon: Shield,
        color: value >= 85 ? 'cyan' : 'sky',
        bgPattern: 'radial-gradient(circle at 0% 100%, #cffafe 0%, transparent 50%)'
      },
      'Best Practices': {
        icon: Award,
        color: value >= 90 ? 'amber' : 'yellow',
        bgPattern: 'radial-gradient(circle at 50% 50%, #fef3c7 0%, transparent 50%)'
      }
    };
    return configs[skillName] || configs['Problem Solving'];
  };

  const config = getSkillConfig(skill, score);
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="relative overflow-hidden rounded-xl bg-white p-5 shadow-sm border border-gray-100"
      style={{ background: config.bgPattern }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.div 
            whileHover={{ rotate: 15 }}
            className={`p-2.5 rounded-xl bg-${config.color}-50 ring-1 ring-${config.color}-100`}
          >
            <Icon className={`h-5 w-5 text-${config.color}-500`} />
          </motion.div>
          <div>
            <h3 className="font-semibold text-gray-800">{skill}</h3>
            <div className="flex items-center gap-1 mt-0.5">
              <span className={`text-xs font-medium text-${config.color}-500`}>
                {score >= 90 ? 'Expert' : score >= 80 ? 'Advanced' : 'Intermediate'}
              </span>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className={`w-1.5 h-1.5 rounded-full bg-${config.color}-400`}
              />
            </div>
          </div>
        </div>
        
        <motion.div 
          className={`text-2xl font-bold text-${config.color}-500`}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {score}%
        </motion.div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`absolute h-full rounded-full bg-gradient-to-r from-${config.color}-400 to-${config.color}-500`}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg bg-${config.color}-50`}>
            <Users className={`h-3.5 w-3.5 text-${config.color}-400`} />
          </div>
          <div>
            <div className="text-xs font-medium text-gray-600">Candidates</div>
            <div className="text-sm font-semibold text-gray-800">{Math.round(score * 1.5)}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg bg-${config.color}-50`}>
            <TrendingUp className={`h-3.5 w-3.5 text-${config.color}-400`} />
          </div>
          <div>
            <div className="text-xs font-medium text-gray-600">Growth</div>
            <div className="text-sm font-semibold text-gray-800">+{Math.round(score/10)}%</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Add this new component for circular progress
const CircularProgress = ({ progress, status }) => {
  const getStatusColors = (status) => {
    const colors = {
      'Completed': 'text-green-500 bg-green-50',
      'In Progress': 'text-blue-500 bg-blue-50',
      'Pending': 'text-amber-500 bg-amber-50',
      'Failed': 'text-red-500 bg-red-50',
      'Expired': 'text-gray-500 bg-gray-50'
    };
    return colors[status] || colors['Pending'];
  };

  const statusColor = getStatusColors(status);

  return (
    <div className="relative inline-flex">
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`h-12 w-12 rounded-full ${statusColor} flex items-center justify-center`}
      >
        <div className="relative">
          <CircularProgressbar
            value={progress}
            text={`${progress}%`}
            styles={buildStyles({
              rotation: 0,
              strokeLinecap: 'round',
              textSize: '24px',
              pathTransitionDuration: 0.5,
              pathColor: status === 'Completed' ? '#22c55e' :
                         status === 'In Progress' ? '#3b82f6' :
                         status === 'Pending' ? '#f59e0b' :
                         status === 'Failed' ? '#ef4444' : '#6b7280',
              textColor: status === 'Completed' ? '#22c55e' :
                        status === 'In Progress' ? '#3b82f6' :
                        status === 'Pending' ? '#f59e0b' :
                        status === 'Failed' ? '#ef4444' : '#6b7280',
              trailColor: '#f3f4f6',
            })}
          />
        </div>
      </motion.div>
    </div>
  );
};

// Update the CandidateTable component
const CandidateTable = () => {
  const [candidates, setCandidates] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [ setHoveredRow] = useState(null);

  // Fetch candidate metrics
  useEffect(() => {
    const fetchCandidateMetrics = async () => {
      try {
        const response = await apiService.get('/vendor/candidate-metrics');
        setCandidates(response.data.candidates);
        setMetrics(response.data.metrics);
      } catch (err) {
        console.error('Failed to fetch candidate metrics:', err);
      }
    };

    fetchCandidateMetrics();
  }, []);

  // Filter candidates based on status and search query
  const filteredCandidates = candidates.filter(candidate => {
    const matchesStatus = selectedStatus === 'All Status' || 
      candidate.status.replace('_', ' ').toLowerCase() === selectedStatus.toLowerCase();
    const matchesSearch = candidate.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         candidate.testType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Format time since last activity
  const formatTimeAgo = (timeString) => {
    const date = new Date(timeString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  };

  // Get status styles
  const getStatusStyles = (status) => {
    const styles = {
      'mcq_completed': 'bg-blue-100 text-blue-800 ring-1 ring-blue-600/20',
      'in_progress': 'bg-green-100 text-green-800 ring-1 ring-green-600/20',
      'pending': 'bg-amber-100 text-amber-800 ring-1 ring-amber-600/20',
      'completed': 'bg-purple-100 text-purple-800 ring-1 ring-purple-600/20'
    };
    return styles[status] || styles['pending'];
  };

  return (
    <Card className="overflow-hidden">
      <div className="border-b bg-white sticky top-0 z-20">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                Active Test Takers
                <span className="px-2.5 py-0.5 text-sm bg-blue-50 text-blue-700 rounded-full">
                  {metrics.activeTestTakers || 0}
                </span>
              </h3>
              <p className="text-sm text-gray-500 mt-1">Monitor candidate test status in real-time</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4 mt-6">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by name or test type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
              />
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>
      </div>

      <CardContent className="p-0 overflow-auto max-h-[600px]">
        <table className="w-full">
          <thead className="bg-gray-50/90 backdrop-blur-sm sticky top-0 z-10">
            <tr>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                Candidate
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                Test Type
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                Progress
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                Status
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                Last Activity
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filteredCandidates.map((candidate, index) => (
              <motion.tr 
                key={candidate.candidateId}
                className="group hover:bg-gray-50/90 relative cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onHoverStart={() => setHoveredRow(index)}
                onHoverEnd={() => setHoveredRow(null)}
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <motion.div className="relative" whileHover={{ scale: 1.05 }}>
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 
                           flex items-center justify-center text-sm font-medium text-blue-700 
                           border border-blue-100 shadow-sm">
                        {candidate.candidateName.charAt(0).toUpperCase()}
                      </div>
                      <motion.div 
                        className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-white shadow-sm 
                                 flex items-center justify-center"
                        animate={{ scale: candidate.status === 'in_progress' ? [1, 1.2, 1] : 1 }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      >
                        <div className={`h-2.5 w-2.5 rounded-full ${
                          candidate.status === 'in_progress' ? 'bg-green-500' : 
                          candidate.status === 'completed' ? 'bg-blue-500' :
                          'bg-gray-300'
                        }`} />
                      </motion.div>
                    </motion.div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                        {candidate.candidateName}
                      </div>
                      <div className="text-xs text-gray-500">
                        Registered: {new Date(candidate.registeredDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-900">{candidate.testType}</span>
                    <span className="text-xs text-gray-500">
                      Started: {new Date(candidate.testPeriod.start).toLocaleTimeString()}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-4">
                    <CircularProgress 
                      progress={candidate.progress || 0} 
                      status={candidate.status}
                    />
                    <div className="flex flex-col">
                      {candidate.score && (
                        <span className="text-sm font-medium text-gray-900">
                          {candidate.score}/100
                        </span>
                      )}
                      {candidate.timeSpent > 0 ? (
                        <span className="text-sm text-gray-500">
                          {candidate.timeSpent}m spent
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 w-1.5 bg-green-400 rounded-full animate-pulse" />
                          <span className="text-sm text-gray-500">
                            {candidate.status === 'in_progress' ? 'Just started' : 'Not started yet'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-3 py-1 inline-flex text-xs font-medium rounded-full ${getStatusStyles(candidate.status)}`}>
                    {candidate.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-shrink-0">
                      <Clock className="h-4 w-4 text-gray-400" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-900">{formatTimeAgo(candidate.lastActivity.time)}</div>
                      <div className="text-xs text-gray-500">{candidate.lastActivity.type}</div>
                    </div>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        {/* Empty State */}
        {filteredCandidates.length === 0 && (
          <motion.div 
            className="text-center py-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <UserX className="h-12 w-12 mx-auto text-gray-400" />
            <h3 className="mt-4 text-sm font-medium text-gray-900">No candidates found</h3>
            <p className="mt-2 text-sm text-gray-500">
              Try adjusting your search or filter to find what you're looking for.
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

// Update the EnhancedMetricCard component to remove the initial animation
const EnhancedMetricCard = ({ metric }) => {
  if (!metric) return null;

  return (
    <div className="group">
      <Card className="overflow-hidden transition-all duration-200 hover:shadow-lg">
        <CardContent className="p-6 relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${getMetricBgColor(metric.title)}`}>
                {getMetricIcon(metric.title)}
              </div>
              <span className="font-medium text-gray-800">{metric.title}</span>
            </div>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <div className={`text-3xl font-bold ${getMetricValueColor(metric.title)}`}>
                {metric.value}
              </div>
              <span className="text-sm text-gray-500 mt-1 block">
                {metric.subtitle}
              </span>
            </div>
            {metric.trend !== undefined && (
              <div className="flex items-center gap-1">
                <div className={`flex items-center text-sm font-medium ${
                  metric.trend > 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  <TrendingUp className={`h-4 w-4 ${metric.trend < 0 && 'rotate-180'}`} />
                  {Math.abs(metric.trend)}%
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Add this date filtering utility
const getFilteredTests = (tests, timeRange) => {
  const filterDate = new Date();

  switch (timeRange) {
    case '1H':
      filterDate.setHours(filterDate.getHours() - 1);
      break;
    case '1D':
      filterDate.setDate(filterDate.getDate() - 1);
      break;
    case '7D':
      filterDate.setDate(filterDate.getDate() - 7);
      break;
    case '1M':
      filterDate.setMonth(filterDate.getMonth() - 1);
      break;
    case '1Y':
      filterDate.setFullYear(filterDate.getFullYear() - 1);
      break;
    default:
      return tests;
  }

  return tests.filter(test => new Date(test.createdAt) >= filterDate);
};

// Add this new LoadingScreen component at the top of the file
const LoadingScreen = () => {
  return (
    <Layout>
      <div className="space-y-8">
        {/* Shimmer loading for metrics */}
        <div className="grid grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm">
              <motion.div
                className="h-[140px] relative overflow-hidden"
                animate={{
                  backgroundColor: ['#f3f4f6', '#e5e7eb', '#f3f4f6'],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "linear"
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </motion.div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Main content loading skeleton */}
          <div className="col-span-2 space-y-6">
            <div className="bg-white rounded-xl overflow-hidden shadow-sm">
              <div className="p-6 border-b">
                <div className="h-6 w-1/3 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="p-6 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-gray-200 rounded-lg animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Second card loading skeleton */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm">
              <div className="p-6 border-b">
                <div className="h-6 w-1/4 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="p-6 space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right sidebar loading skeleton */}
          <div className="space-y-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm">
                <div className="p-6 border-b">
                  <div className="h-6 w-1/2 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="p-6 space-y-4">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-16 bg-gray-200 rounded animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

// Update the Dashboard component
const Dashboard = () => {
  const { auth } = useAuth();
  const navigate = useNavigate();
  
  const [metrics, setMetrics] = useState(null);
  const [analyticsOverview, setAnalyticsOverview] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tests, setTests] = useState([]);
  const [filteredTests, setFilteredTests] = useState([]);

  // Simplified time range state - only keep if you plan to implement the feature soon
  const [activeTimeRange] = useState('all');

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const response = await apiService.get('/vendor/tests');
        setTests(response.data.tests);
      } catch (error) {
        console.error('Error fetching tests:', error);
      }
    };

    fetchTests();
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch metrics
        const metricsResponse = await apiService.get('/vendor/dashboard/metrics');
        setMetrics(metricsResponse.data);

        // Fetch analytics overview
        const analyticsResponse = await apiService.get('/vendor/analytics/overview');
        setAnalyticsOverview(analyticsResponse.data);

        // Fetch performance metrics
        const performanceResponse = await apiService.get('/vendor/analytics/performance', {
          params: { period: activeTimeRange }
        });
        setPerformanceMetrics(performanceResponse.data);

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [activeTimeRange]);

  // Update tests when time range changes
  useEffect(() => {
    if (tests.length > 0) {
      const filtered = getFilteredTests(tests, activeTimeRange);
      setFilteredTests(filtered);
    }
  }, [tests, activeTimeRange]);

  // Early return for loading state
  if (loading) {
    return <LoadingScreen />;
  }

  // Early return for error state
  if (error) {
    return <div>Error: {error}</div>;
  }

  // Transform API data for metrics cards
  const topMetrics = [
    {
      title: 'Total Tests',
      value: metrics?.totalTests?.value ?? 0,
      subtitle: metrics?.totalTests?.subtitle ?? 'Total assessments',
      trend: metrics?.totalTests?.trend ?? 0
    },
    {
      title: 'Active Candidates',
      value: metrics?.activeCandidates?.value ?? 0,
      subtitle: metrics?.activeCandidates?.subtitle ?? 'Currently testing',
      trend: metrics?.activeCandidates?.trend ?? 0
    },
    {
      title: 'Pass Rate',
      value: metrics?.passRate?.value ?? 0,
      subtitle: metrics?.passRate?.subtitle ?? 'Overall pass rate',
      trend: metrics?.passRate?.trend ?? 0
    },
    {
      title: 'New Discussions',
      value: metrics?.newDiscussions?.value ?? 0,
      subtitle: metrics?.newDiscussions?.subtitle ?? 'Pending responses',
      trend: metrics?.newDiscussions?.trend ?? 0
    }
  ];

  // Transform API data for skill distribution
  const skillDistribution = [
    { 
      skill: 'Problem Solving', 
      score: performanceMetrics?.skills?.problemSolving?.score || 0 
    },
    { 
      skill: 'Code Quality', 
      score: performanceMetrics?.skills?.codeQuality?.score || 0 
    },
    { 
      skill: 'Performance', 
      score: performanceMetrics?.skills?.performance?.score || 0 
    },
    { 
      skill: 'Security', 
      score: performanceMetrics?.skills?.security?.score || 0 
    },
    { 
      skill: 'Best Practices', 
      score: performanceMetrics?.skills?.bestPractices?.score || 0 
    }
  ];

  // Add these styles at the top of your file
  const styles = {
    blurEffect: {
      filter: 'blur(2px)', // Reduced from 5px to 2px
      position: 'relative',
    },
    comingSoonOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.5)', // Reduced opacity from 0.7 to 0.5
      zIndex: 10,
    },
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Enhanced Top Metrics */}
        <div className="grid grid-cols-4 gap-6">
          {topMetrics.map((metric, index) => (
            <EnhancedMetricCard key={index} metric={metric} />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Main Content - Left Side */}
          <div className="col-span-2 space-y-6">
            {/* Updated Assessment Overview Card */}
            <Card className="col-span-2">
              <CardHeader className="border-b bg-white/50 backdrop-blur-sm sticky top-0 z-10 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-semibold text-gray-900">
                      Assessment Overview
                    </CardTitle>
                    <div className="text-sm text-gray-500 mt-1">
                      {tests.length} tests total
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {['1H', '1D', '7D', '1M', '1Y'].map(range => (
                        <button
                          key={range}
                          className={`px-3 py-1 rounded-lg text-sm ${
                            range === '1D'
                              ? 'bg-blue-50 text-blue-600'
                              : 'text-gray-500 hover:bg-gray-100'
                          }`}
                        >
                          {range}
                        </button>
                      ))}
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium 
                        bg-blue-50 text-blue-600 hover:bg-blue-100 
                        transition-colors duration-200 
                        border border-blue-200"
                    >
                      <Download className="h-4 w-4" />
                      Export
                    </motion.button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                  </div>
                ) : (
                  tests.map((test) => (
                    <AssessmentProgressCard
                      key={test._id}
                      title={test.title}
                      category={test.category}
                      duration={test.duration}
                      passingScore={test.passingMarks}
                      totalScore={test.totalMarks}
                      status={test.status}
                      difficulty={test.difficulty}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            {/* Replace UserOverviewTable with CandidateTable */}
            <CandidateTable />
          </div>

          {/* Right Side */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="overflow-hidden">
              <CardHeader className="border-b p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-800">Quick Actions</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">Frequently used actions</p>
                  </div>
                  <motion.button 
                    whileHover={{ rotate: 180 }}
                    transition={{ duration: 0.3 }}
                    className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Settings className="h-5 w-5 text-gray-400" />
                  </motion.button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Primary Action */}
                  <motion.button 
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/vendor/tests/create')}
                    className="w-full p-4 rounded-xl
                      bg-blue-50/50 hover:bg-blue-50
                      border border-blue-100
                      text-blue-600
                      flex items-center justify-between
                      group transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg ring-1 ring-blue-100">
                        <PlusCircle className="h-5 w-5 text-blue-500" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Create New Test</div>
                        <div className="text-xs text-blue-500/70">Start a new assessment</div>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-blue-400 opacity-0 group-hover:opacity-100 transform translate-x-0 
                      group-hover:translate-x-1 transition-all" />
                  </motion.button>

                  {/* Secondary Action */}
                  <motion.button 
                    whileHover={{ scale: 1.01 }}
                    className="w-full p-4 rounded-xl
                      bg-green-50/50 hover:bg-green-50
                      border border-green-100
                      text-green-600
                      flex items-center justify-between
                      group transition-all duration-200"
                    style={{ filter: 'blur(2px)', position: 'relative' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg ring-1 ring-green-100">
                        <UserPlus className="h-5 w-5 text-green-500" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Invite Candidates</div>
                        <div className="text-xs text-green-500/70">Add new test takers</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-normal text-green-500/70">Quick invite</span>
                      <ArrowRight className="h-5 w-5 text-green-400 opacity-0 group-hover:opacity-100 transform translate-x-0 
                        group-hover:translate-x-1 transition-all" />
                    </div>

                    {/* Updated Coming Soon Overlay - Removed blur from text */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-black" style={{ filter: 'none' }}>
                        <Clock className="h-6 w-6 mx-auto mb-2" />
                        <p className="text-sm font-medium">Coming Soon!</p>
                        <p className="text-xs mt-1">This feature is on the way</p>
                      </div>
                    </div>
                  </motion.button>

                  {/* Action Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <motion.button 
                      whileHover={{ scale: 1.01 }}
                      onClick={() => navigate('/vendor/analytics/tests')}
                      className="p-4 rounded-xl
                        bg-violet-50/50 hover:bg-violet-50
                        border border-violet-100
                        text-violet-600
                        flex items-center gap-3
                        group transition-all duration-200"
                    >
                      <div className="p-2 bg-white rounded-lg ring-1 ring-violet-100">
                        <BarChart3 className="h-5 w-5 text-violet-500" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Analytics</div>
                        <div className="text-xs text-violet-500/70">View insights</div>
                      </div>
                    </motion.button>

                    <motion.button 
                      whileHover={{ scale: 1.01 }}
                      onClick={() => navigate('/vendor/dashboard/reports')}
                      className="p-4 rounded-xl
                        bg-amber-50/50 hover:bg-amber-50
                        border border-amber-100
                        text-amber-600
                        flex items-center gap-3
                        group transition-all duration-200"
                    >
                      <div className="p-2 bg-white rounded-lg ring-1 ring-amber-100">
                        <Download className="h-5 w-5 text-amber-500" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Reports</div>
                        <div className="text-xs text-amber-500/70">Download data</div>
                      </div>
                    </motion.button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Candidate Skills */}
            <Card>
              <CardHeader className="border-b p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">Candidate Skills</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">Performance by area</p>
                  </div>
                  <select className="text-sm border rounded-lg px-3 py-2 text-gray-600 bg-white shadow-sm focus:ring-2 focus:ring-blue-100 outline-none">
                    <option>Last 30 days</option>
                    <option>Last 90 days</option>
                    <option>Last year</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent className="p-6 relative">
                <div className="space-y-4" style={styles.blurEffect}>
                  {skillDistribution.map(skill => (
                    <ModernSkillCard key={skill.skill} {...skill} />
                  ))}
                </div>
                <div style={styles.comingSoonOverlay}>
                  <div className="text-center">
                    <Clock className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-600">Coming Soon!</p>
                    <p className="text-xs text-gray-500 mt-1">Skill analytics are on the way</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
