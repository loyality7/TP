import React, { useState } from 'react';
import Layout from '../../layout/Layout';
import { Card, CardContent } from '../../common/Card';
import { 
  Download, FileText, Users, TrendingUp, 
  Clock, AlertCircle, Target, Brain, BookOpen,
  BarChart2, Share2, Code, LayoutGrid, X
} from 'lucide-react';

// Add Custom Report Modal Component
const CustomReportModal = ({ isOpen, onClose, onGenerate }) => {
  const [formData, setFormData] = useState({
    reportName: '',
    dateRange: 'last30',
    metrics: [],
    format: 'PDF',
    includeCharts: true,
    selectedTests: []
  });

  const metrics = [
    'Completion Rate',
    'Average Score',
    'Time Analysis',
    'Skill Distribution',
    'Error Patterns',
    'Performance Trends',
    'Candidate Progress',
    'Difficulty Analysis'
  ];

  const dateRanges = [
    { value: 'last7', label: 'Last 7 Days' },
    { value: 'last30', label: 'Last 30 Days' },
    { value: 'last90', label: 'Last 90 Days' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const handleMetricToggle = (metric) => {
    setFormData(prev => ({
      ...prev,
      metrics: prev.metrics.includes(metric)
        ? prev.metrics.filter(m => m !== metric)
        : [...prev.metrics, metric]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">Generate Custom Report</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Report Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Name
            </label>
            <input
              type="text"
              value={formData.reportName}
              onChange={(e) => setFormData(prev => ({ ...prev, reportName: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
              placeholder="Enter report name"
            />
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <select
              value={formData.dateRange}
              onChange={(e) => setFormData(prev => ({ ...prev, dateRange: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
            >
              {dateRanges.map(range => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>

          {/* Metrics Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Metrics
            </label>
            <div className="grid grid-cols-2 gap-3">
              {metrics.map(metric => (
                <label 
                  key={metric}
                  className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={formData.metrics.includes(metric)}
                    onChange={() => handleMetricToggle(metric)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">{metric}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Format
            </label>
            <div className="flex gap-4">
              {['PDF', 'Excel', 'CSV'].map(format => (
                <label key={format} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="format"
                    value={format}
                    checked={formData.format === format}
                    onChange={(e) => setFormData(prev => ({ ...prev, format: e.target.value }))}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">{format}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Include Charts Toggle */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.includeCharts}
                onChange={(e) => setFormData(prev => ({ ...prev, includeCharts: e.target.checked }))}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Include Visual Charts</span>
            </label>
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onGenerate(formData)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Generate Report
          </button>
        </div>
      </div>
    </div>
  );
};

// Update the main component
const Reports = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Add handler for report generation
  const handleGenerateReport = (formData) => {
    console.log('Generating report with:', formData);
    // Add your report generation logic here
    setIsModalOpen(false);
  };

  const reportCategories = [
    { id: 'all', label: 'All Reports' },
    { id: 'tests', label: 'Test Reports' },
    { id: 'performance', label: 'Performance' },
    { id: 'candidates', label: 'Candidates' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'skills', label: 'Skills Assessment' }
  ];

  const testReports = [
    {
      title: 'Test Difficulty Analysis',
      description: 'Detailed analysis of test difficulty levels and success rates',
      icon: BarChart2,
      lastGenerated: '2024-03-16',
      type: 'PDF',
      category: 'tests',
      metrics: [
        'Question Difficulty',
        'Success Rate',
        'Average Completion Time',
        'Pass/Fail Ratio'
      ]
    },
    {
      title: 'Question Performance Report',
      description: 'Analysis of individual question performance and patterns',
      icon: FileText,
      lastGenerated: '2024-03-15',
      type: 'Excel',
      category: 'tests',
      metrics: [
        'Question Success Rate',
        'Time per Question',
        'Skip Rate',
        'Error Patterns'
      ]
    },
    {
      title: 'MCQ vs Coding Analysis',
      description: 'Comparative analysis of MCQ and coding question performance',
      icon: Code,
      lastGenerated: '2024-03-14',
      type: 'PDF',
      category: 'tests',
      metrics: [
        'MCQ Performance',
        'Coding Success Rate',
        'Time Distribution',
        'Difficulty Comparison'
      ]
    },
    {
      title: 'Test Template Usage',
      description: 'Analysis of test template usage and effectiveness',
      icon: LayoutGrid,
      lastGenerated: '2024-03-13',
      type: 'Excel',
      category: 'tests',
      metrics: [
        'Template Popularity',
        'Success Rate',
        'Customization Patterns',
        'Time Efficiency'
      ]
    },
    {
      title: 'Test Completion Patterns',
      description: 'Analysis of test completion behavior and patterns',
      icon: Clock,
      lastGenerated: '2024-03-12',
      type: 'PDF',
      category: 'tests',
      metrics: [
        'Completion Rate',
        'Time Distribution',
        'Question Navigation',
        'Submission Patterns'
      ]
    }
  ];

  const availableReports = [
    ...testReports,
    // Performance Reports
    {
      title: 'Test Performance Analytics',
      description: 'Comprehensive analysis of test completion rates, scores, and difficulty levels',
      icon: BarChart2,
      lastGenerated: '2024-03-15',
      type: 'PDF',
      category: 'performance',
      metrics: ['Completion Rate', 'Average Score', 'Time Analysis']
    },
    {
      title: 'Skill Gap Analysis',
      description: 'Detailed breakdown of candidate performance across different skill areas',
      icon: Target,
      lastGenerated: '2024-03-14',
      type: 'Excel',
      category: 'skills',
      metrics: ['Skill Proficiency', 'Improvement Areas', 'Recommendations']
    },
    {
      title: 'Candidate Progress Report',
      description: 'Individual candidate performance tracking and progress monitoring',
      icon: Users,
      lastGenerated: '2024-03-14',
      type: 'Excel',
      category: 'candidates',
      metrics: ['Progress Status', 'Time Spent', 'Score Trends']
    },
    {
      title: 'Monthly Performance Insights',
      description: 'Monthly trends, patterns, and key performance indicators',
      icon: TrendingUp,
      lastGenerated: '2024-03-01',
      type: 'PDF',
      category: 'analytics',
      metrics: ['Success Rate', 'Difficulty Analysis', 'Time Metrics']
    },
    {
      title: 'Learning Path Effectiveness',
      description: 'Analysis of test effectiveness and learning outcomes',
      icon: BookOpen,
      lastGenerated: '2024-03-13',
      type: 'PDF',
      category: 'performance',
      metrics: ['Completion Rate', 'Success Rate', 'Feedback Analysis']
    },
    {
      title: 'Skill Assessment Summary',
      description: 'Overview of candidate skills and competency levels',
      icon: Brain,
      lastGenerated: '2024-03-12',
      type: 'Excel',
      category: 'skills',
      metrics: ['Skill Matrix', 'Proficiency Levels', 'Development Areas']
    },
    {
      title: 'Test Completion Analytics',
      description: 'Detailed analysis of test completion patterns and timing',
      icon: Clock,
      lastGenerated: '2024-03-11',
      type: 'PDF',
      category: 'analytics',
      metrics: ['Time Distribution', 'Completion Patterns', 'Duration Analysis']
    },
    {
      title: 'Error Pattern Analysis',
      description: 'Analysis of common mistakes and error patterns',
      icon: AlertCircle,
      lastGenerated: '2024-03-10',
      type: 'PDF',
      category: 'analytics',
      metrics: ['Error Types', 'Frequency Analysis', 'Improvement Areas']
    }
  ];

  const filteredReports = selectedCategory === 'all' 
    ? availableReports 
    : availableReports.filter(report => report.category === selectedCategory);

  const TestReportDetails = ({ report }) => (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-gray-600">Test Statistics</h4>
          <div className="mt-2 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Total Tests</span>
              <span className="font-medium">247</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Average Score</span>
              <span className="font-medium">76%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Pass Rate</span>
              <span className="font-medium text-emerald-600">82%</span>
            </div>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-600">Question Analysis</h4>
          <div className="mt-2 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">MCQ Success</span>
              <span className="font-medium">84%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Coding Success</span>
              <span className="font-medium">71%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Avg. Time/Question</span>
              <span className="font-medium">2.4 min</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderReportCard = (report) => {
    const Icon = report.icon;
    return (
      <Card className="hover:shadow-md transition-all border border-gray-100">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Icon className="h-6 w-6 text-blue-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800">{report.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                </div>
                <button className="flex-shrink-0 text-blue-600 hover:text-blue-700">
                  <Download className="h-5 w-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {report.metrics.map((metric, idx) => (
                  <span 
                    key={idx} 
                    className="text-xs px-2.5 py-1 bg-gray-50 text-gray-600 rounded-full"
                  >
                    {metric}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-3 mt-3">
                <span className="text-sm text-gray-500">
                  Generated: {report.lastGenerated}
                </span>
                <span className={`text-xs font-medium px-2 py-1 rounded-full
                  ${report.type === 'PDF' 
                    ? 'bg-red-50 text-red-600' 
                    : 'bg-green-50 text-green-600'}`}
                >
                  {report.type}
                </span>
              </div>
              {report.category === 'tests' && <TestReportDetails report={report} />}
              <div className="flex justify-end gap-2 mt-4">
                <button className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  Share
                </button>
                <button className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">Assessment Reports</h1>
              <p className="text-gray-500 mt-1">Generate and download detailed assessment reports</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 transition-colors"
            >
              <FileText className="h-4 w-4" />
              Generate Custom Report
            </button>
          </div>

          {/* Category Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {reportCategories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
                  ${selectedCategory === category.id 
                    ? 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100' 
                    : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Reports Grid */}
        <div className="grid gap-6">
          {filteredReports.map((report, index) => renderReportCard(report))}
        </div>

        {/* Add the modal */}
        <CustomReportModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onGenerate={handleGenerateReport}
        />
      </div>
    </Layout>
  );
};

export default Reports; 