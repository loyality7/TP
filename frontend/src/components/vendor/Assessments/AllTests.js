import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Popover } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { Tooltip } from 'react-tooltip';
import Layout from '../../layout/Layout';
import { Card } from '../../common/Card';
import { 
  Search, Filter, Plus, MoreVertical, Clock, Users, Calendar, Download,
  Edit, Trash2, Eye, TrendingUp, Brain, Target, Copy,
  BarChart2, Settings, TrendingDown, MessageCircle, EyeOff
} from 'lucide-react';
import { testService } from '../../../services/test.service';
import { apiService } from '../../../services/api';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

const AllTests = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('grid');
  const [filterStatus] = useState('all');
  const [searchTerm] = useState('');
  const [selectedCategory] = useState('all');
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardMetrics] = useState({
    totalTests: { value: 0, trend: 0, subtitle: '' },
    activeCandidates: { value: 0, trend: 0, subtitle: '' },
    passRate: { value: 0, trend: 0, subtitle: '' },
    newDiscussions: { value: 0, trend: 0, subtitle: '' }
  });


  const stats = [
    { 
      title: 'Total Tests', 
      value: dashboardMetrics.totalTests.value, 
      trend: dashboardMetrics.totalTests.trend,
      subtext: dashboardMetrics.totalTests.subtitle,
      icon: Brain, 
      color: 'blue' 
    },
    { 
      title: 'Active Candidates', 
      value: dashboardMetrics.activeCandidates.value,
      trend: dashboardMetrics.activeCandidates.trend,
      subtext: dashboardMetrics.activeCandidates.subtitle,
      icon: Users, 
      color: 'orange' 
    },
    { 
      title: 'Pass Rate', 
      value: `${dashboardMetrics.passRate.value}%`,
      trend: dashboardMetrics.passRate.trend,
      subtext: dashboardMetrics.passRate.subtitle,
      icon: Target, 
      color: 'purple' 
    },
    { 
      title: 'New Discussions', 
      value: dashboardMetrics.newDiscussions.value,
      trend: dashboardMetrics.newDiscussions.trend,
      subtext: dashboardMetrics.newDiscussions.subtitle,
      icon: MessageCircle, 
      color: 'green' 
    }
  ];

  const [quickFilters] = useState([]);

  const [showVisibilityModal, setShowVisibilityModal] = useState(false);
  const [selectedTestForVisibility] = useState(null);

  const handleVisibilityToggle = async (test) => {
    try {
      await testService.updateTestVisibility(test.id, test.visibility);
      fetchTests();
      toast.success('Test visibility updated successfully');
    } catch (error) {
      toast.error('Failed to update test visibility');
    }
  };

  const TestCard = React.memo(({ test }) => {
    const [showStats, setShowStats] = useState(false);

    const passRate = test?.passRate || 0;
    const avgScore = test?.avgScore || 0;
    const completionTime = test?.avgCompletionTime || '0 mins';
    const skills = test?.skills || [];
    const status = test?.status || 'Draft';
    const completionRate = test?.completionRate || 0;
    const duration = test?.duration || '0 mins';
    const codingQuestionsCount = test?.codingChallenges?.length || 0;
    const mcqCount = test?.mcqs?.length || 0;
    const totalQuestions = codingQuestionsCount + mcqCount;
    const candidates = test?.candidates || 0;
    const lastModified = test?.lastModified || new Date().toISOString();

    console.log('Test object in TestCard:', test);

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };

    return (
      <div className="relative h-full">
        <Card className="hover:shadow-xl transition-all duration-200 h-full">
          <CardContent className="p-6">
            <div className="absolute top-4 right-4 flex flex-col items-end gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                status === 'Active' 
                  ? 'bg-green-50 text-green-600' 
                  : status === 'Draft'
                  ? 'bg-yellow-50 text-yellow-600'
                  : 'bg-gray-50 text-gray-600'
              }`}>
                {status}
              </span>
              <div className="w-16 h-16" data-tooltip-id={`completion-tooltip-${test?.id}`}>
                <CircularProgressbar
                  value={parseInt(completionRate)}
                  text={`${completionRate}`}
                  styles={buildStyles({
                    pathColor: parseInt(completionRate) > 75 ? '#10b981' : '#f59e0b',
                    textSize: '24px',
                    textColor: '#374151',
                    trailColor: '#e5e7eb',
                  })}
                />
              </div>
              <Tooltip id={`completion-tooltip-${test?.id}`}>
                Completion Rate: {completionRate}
              </Tooltip>
            </div>

            <div className="min-h-[60px]">
              <h3 className="font-semibold text-lg text-gray-900 pr-20 line-clamp-2">{test?.title || 'Untitled Test'}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-500 truncate">{test.category}</span>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <span className={`text-sm font-medium ${
                  test.difficulty === 'Advanced' ? 'text-red-500' :
                  test.difficulty === 'Intermediate' ? 'text-yellow-500' :
                  'text-green-500'
                }`}>
                  {test.difficulty}
                </span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-gray-50 text-gray-600 rounded-md text-xs font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>

            <button 
              onClick={() => setShowStats(!showStats)}
              className="mt-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {showStats ? 'Hide Stats' : 'Show Stats'}
            </button>

            {showStats && (
              <div className="mt-4 grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">{passRate}%</div>
                  <div className="text-xs text-gray-500">Pass Rate</div>
                </div>
                <div className="text-center border-x border-gray-200">
                  <div className="text-2xl font-bold text-indigo-600">{avgScore}</div>
                  <div className="text-xs text-gray-500">Avg Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">{completionTime}</div>
                  <div className="text-xs text-gray-500">Avg Time</div>
                </div>
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-2 text-gray-400" />
                {duration}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Brain className="h-4 w-4 mr-2 text-gray-400" />
                {totalQuestions} Questions ({codingQuestionsCount} Coding + {mcqCount} MCQ)
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Users className="h-4 w-4 mr-2 text-gray-400" />
                {candidates} Candidates
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                {formatDate(lastModified)}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t flex justify-between items-center">
              <div className="flex gap-2">
                <button 
                  onClick={() => handleVisibilityToggle(test)}
                  className="p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200 group relative" 
                  title={`Test is ${test?.visibility || 'private'}`}
                >
                  <Eye className={`h-4 w-4 ${
                    test?.visibility === 'public' 
                      ? 'text-green-600' 
                      : 'text-gray-600'
                  } group-hover:text-indigo-600`} />
                </button>
                <button 
                  onClick={() => handleEdit(test.id)}
                  className="p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200 group" 
                  title="Edit Test"
                >
                  <Edit className="h-4 w-4 text-gray-600 group-hover:text-indigo-600" />
                </button>
                <button 
                  onClick={() => handlePublish(test)}
                  className="p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200 group" 
                  title="Publish & Get Shareable Link"
                >
                  <TrendingUp className="h-4 w-4 text-gray-600 group-hover:text-indigo-600" />
                </button>
                <button 
                  onClick={() => {
                    if (test.sharingToken) {
                      navigator.clipboard.writeText(test.shareableLink);
                      toast.success('Shareable link copied!');
                    } else {
                      toast.error('Please publish the test first to get a shareable link');
                    }
                  }}
                  className="p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200 group" 
                  title={test.sharingToken ? 'Copy Shareable Link' : 'Publish test first to get shareable link'}
                >
                  <Copy className={`h-4 w-4 ${
                    test.sharingToken 
                      ? 'text-gray-600 group-hover:text-indigo-600' 
                      : 'text-gray-400'
                  }`} />
                </button>
              </div>
              
              <Popover className="relative">
                <Popover.Button className="p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                  <MoreVertical className="h-4 w-4 text-gray-600" />
                </Popover.Button>

                <Popover.Panel className="absolute right-0 z-10 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                  <div className="py-1">
                    <button
                      onClick={() => handleDelete(test._id)}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Test
                    </button>
                    <button
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <BarChart2 className="h-4 w-4 mr-2" />
                      View Analytics
                    </button>
                    <button
                      onClick={() => {
                        console.log('Export Data button clicked');
                        console.log('Test object:', test);
                        if (test && test._id) {
                          exportTestData(test);
                        } else {
                          toast.error('Invalid test data');
                        }
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Data
                    </button>
                    <button
                      onClick={() => {
                        console.log('Export Results button clicked');
                        console.log('Test object:', test);
                        if (test && test._id) {
                          exportTestResults(test._id, test.title);
                        } else {
                          toast.error('Invalid test data');
                        }
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Results
                    </button>
                  </div>
                </Popover.Panel>
              </Popover>
            </div>
          </CardContent>
        </Card>

        <AnimatePresence>
          {showVisibilityModal && selectedTestForVisibility?.id === test.id && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
              onClick={() => setShowVisibilityModal(false)}
            >
              <motion.div 
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-white rounded-lg p-6 w-96"
                onClick={e => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold mb-4">Test Visibility</h3>
                <div className="space-y-4">
                  <button
                    onClick={() => {
                      handleVisibilityToggle({ ...test, visibility: 'public' });
                      setShowVisibilityModal(false);
                    }}
                    className={`w-full p-3 rounded-lg border flex items-center gap-3 ${
                      test.visibility === 'public' 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <Eye className="h-5 w-5 text-gray-600" />
                    <div className="text-left">
                      <div className="font-medium">Public</div>
                      <div className="text-sm text-gray-500">Anyone with the link can access</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      handleVisibilityToggle({ ...test, visibility: 'private' });
                      setShowVisibilityModal(false);
                    }}
                    className={`w-full p-3 rounded-lg border flex items-center gap-3 ${
                      test.visibility === 'private' 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <EyeOff className="h-5 w-5 text-gray-600" />
                    <div className="text-left">
                      <div className="font-medium">Private</div>
                      <div className="text-sm text-gray-500">Only invited users can access</div>
                    </div>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  });

  const handlePreview = useCallback((testId) => {
    navigate(`/vendor/tests/${testId}/preview`);
  }, []);

  const handleEdit = useCallback((testId) => {
    navigate(`/vendor/tests/${testId}/edit`);
  }, []);

  const handlePublish = async (test) => {
    try {
      const response = await apiService.post(`tests/${test._id}/publish`);
      
      if (response.data) {
        setTests(prevTests => 
          prevTests.map(t => 
            t._id === test._id 
              ? { 
                  ...t, 
                  ...response.data.test,
                  shareableLink: response.data.shareableLink
                }
              : t
          )
        );
        
        toast.success(
          (t) => (
            <div className="flex flex-col gap-2">
              <div>Test published successfully!</div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(response.data.shareableLink)
                    .then(() => toast.success('Link copied to clipboard!'))
                    .catch(err => {
                      console.error('Copy failed:', err);
                      toast.error('Failed to copy link. Please copy manually.');
                    });
                }}
                className="px-3 py-1 bg-white text-emerald-600 rounded-md text-sm hover:bg-emerald-50"
              >
                Copy Shareable Link
              </button>
            </div>
          ),
          {
            duration: 5000,
          }
        );
      }
    } catch (error) {
      console.error('Error publishing test:', error);
      if (error.response?.status === 403) {
        toast.error('Not authorized to publish this test');
      } else if (error.response?.status === 400) {
        toast.error('Test validation failed. Please check all required fields.');
      } else {
        toast.error('Failed to publish test');
      }
    }
  };

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await testService.getAllTests({
        search: searchTerm,
        category: selectedCategory,
        status: filterStatus
      });
      
      console.log('Test objects:', response.data);
      
      setTests(response.data);
    } catch (error) {
      setError(error.message);
      toast.error('Failed to fetch tests');
      console.error('Error fetching tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderTrendIndicator = (trend) => {
    if (trend > 0) {
      return (
        <div className="flex items-center text-green-500">
          <TrendingUp className="h-3 w-3 mr-1" />
          <span>+{trend}%</span>
        </div>
      );
    } else if (trend < 0) {
      return (
        <div className="flex items-center text-red-500">
          <TrendingDown className="h-3 w-3 mr-1" />
          <span>{trend}%</span>
        </div>
      );
    }
    return null;
  };

  const handleCreateTest = () => {
    navigate('/vendor/tests/create');
  };

  const getLatestTests = (tests) => {
    return tests
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6);
  };

  const latestTests = getLatestTests(tests);

  if (loading) {
    return (
      <Layout>
        <div className="space-y-8">
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

          <div className="bg-white rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b">
              <div className="h-6 w-1/3 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl p-6 border">
                    <div className="space-y-4">
                      <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                      <div className="h-20 bg-gray-100 rounded animate-pulse" />
                      <div className="flex justify-between">
                        <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const exportTestResults = async (testId, testName) => {
    try {
      console.log('Starting export process');
      console.log('Test ID:', testId);
      console.log('Test Name:', testName);

      if (!testId) {
        console.error('Test ID is undefined:', testId);
        toast.error('Invalid test ID');
        return;
      }

      console.log('Fetching results from API...');
      const response = await apiService.get(`submissions/test/${testId}/results`);
      console.log('API Response:', response);
      
      if (!response?.data) {
        throw new Error('No data received from API');
      }

      const data = response.data;
      console.log('Creating zip file...');
      const zip = new JSZip();

      const mainResults = data.submissions.map(sub => ({
        candidateName: sub.candidateName,
        email: sub.email,
        mcqScore: sub.mcqScore,
        codingScore: sub.codingScore,
        totalScore: sub.totalScore,
        submittedAt: sub.submittedAt,
        duration: sub.duration,
        status: sub.status
      }));
      zip.file('overall_results.json', JSON.stringify(mainResults, null, 2));

      const summaryData = {
        totalCandidates: data.summary.totalCandidates,
        averageScore: data.summary.averageScore,
        completedSubmissions: data.summary.completedSubmissions,
        mcqStats: data.summary.mcqStats,
        codingStats: data.summary.codingStats
      };
      zip.file('summary.json', JSON.stringify(summaryData, null, 2));

      const submissionsFolder = zip.folder('submissions');
      
      data.submissions.forEach((sub, index) => {
        const submissionData = {
          candidate: {
            name: sub.candidateName,
            email: sub.email
          },
          scores: {
            mcq: sub.mcqScore,
            coding: sub.codingScore,
            total: sub.totalScore
          },
          details: {
            mcqAnswers: sub.details.mcqAnswers,
            codingChallenges: sub.details.codingChallenges
          },
          metadata: {
            submittedAt: sub.submittedAt,
            duration: sub.duration,
            status: sub.status
          }
        };
        submissionsFolder.file(
          `submission_${index + 1}_${sub.candidateName.replace(/\s+/g, '_')}.json`,
          JSON.stringify(submissionData, null, 2)
        );
      });

      const mcqFolder = zip.folder('mcq_responses');
      
      const mcqResponses = data.submissions.flatMap(sub => 
        sub.details.mcqAnswers.map(mcq => ({
          candidate: sub.candidateName,
          email: sub.email,
          questionId: mcq.questionId,
          selectedAnswer: mcq.selectedAnswer,
          isCorrect: mcq.isCorrect
        }))
      );
      mcqFolder.file('mcq_responses.json', JSON.stringify(mcqResponses, null, 2));

      const codingFolder = zip.folder('coding_submissions');
      
      const codingSubmissions = data.submissions.flatMap(sub =>
        sub.details.codingChallenges.flatMap(challenge =>
          challenge.submissions.map(submission => ({
            candidate: sub.candidateName,
            email: sub.email,
            challengeId: challenge.challengeId,
            submission: {
              language: submission.language,
              status: submission.status,
              executionTime: submission.executionTime,
              memory: submission.memory,
              score: submission.marks,
              code: submission.code,
              testCases: submission.testCaseResults
            }
          }))
        )
      );
      codingFolder.file('coding_submissions.json', JSON.stringify(codingSubmissions, null, 2));

      const metadata = {
        exportDate: new Date().toISOString(),
        testId: testId,
        testName: testName,
        totalSubmissions: data.totalSubmissions,
        exportVersion: '1.0'
      };
      zip.file('metadata.json', JSON.stringify(metadata, null, 2));

      console.log('Generating zip file...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      console.log('Zip file generated, initiating download...');
      saveAs(zipBlob, `${testName || 'Test'}_Results_${new Date().toISOString().split('T')[0]}.zip`);
      
      toast.success('Results exported successfully!');
    } catch (error) {
      console.error('Error details:', error);
      console.error('Error stack:', error.stack);
      console.error('Error response:', error.response);
      toast.error(`Failed to export results: ${error.message}`);
    }
  };

  // Add new exportTestData function
  const exportTestData = async (test) => {
    try {
      console.log('Starting test data export');
      
      // Create ZIP file
      const zip = new JSZip();
      
      // Add test data as JSON
      const testData = {
        testInfo: {
          id: test._id,
          title: test.title,
          description: test.description,
          category: test.category,
          difficulty: test.difficulty,
          duration: test.duration,
          type: test.type,
          status: test.status,
          passingMarks: test.passingMarks,
          totalMarks: test.totalMarks,
          instructions: test.instructions,
          createdAt: test.createdAt,
          updatedAt: test.updatedAt
        },
        accessControl: test.accessControl,
        mcqs: test.mcqs,
        codingChallenges: test.codingChallenges
      };
      
      zip.file('test_data.json', JSON.stringify(testData, null, 2));

      // Create Excel workbook
      const wb = XLSX.utils.book_new();

      // Test Info sheet
      const testInfoData = [{
        Title: test.title,
        Description: test.description,
        Category: test.category,
        Difficulty: test.difficulty,
        Duration: test.duration,
        Type: test.type,
        Status: test.status,
        'Passing Marks': test.passingMarks,
        'Total Marks': test.totalMarks,
        'Created At': new Date(test.createdAt).toLocaleString(),
        'Updated At': new Date(test.updatedAt).toLocaleString()
      }];
      const wsTestInfo = XLSX.utils.json_to_sheet(testInfoData);
      XLSX.utils.book_append_sheet(wb, wsTestInfo, 'Test Info');

      // MCQs sheet
      const mcqData = test.mcqs.map(mcq => ({
        'Question': mcq.question,
        'Options': mcq.options.join(' | '),
        'Correct Answer': mcq.correctAnswer.join(' | '),
        'Marks': mcq.marks,
        'Explanation': mcq.explanation || ''
      }));
      const wsMCQs = XLSX.utils.json_to_sheet(mcqData);
      XLSX.utils.book_append_sheet(wb, wsMCQs, 'MCQs');

      // Coding Challenges sheet
      const codingData = test.codingChallenges.map(challenge => ({
        'Title': challenge.title,
        'Description': challenge.description,
        'Difficulty': challenge.difficulty,
        'Time Limit': challenge.timeLimit,
        'Memory Limit': challenge.memoryLimit,
        'Marks': challenge.marks,
        'Test Cases': challenge.testCases?.length || 0
      }));
      const wsCoding = XLSX.utils.json_to_sheet(codingData);
      XLSX.utils.book_append_sheet(wb, wsCoding, 'Coding Challenges');

      // Convert Excel to buffer and add to zip
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      zip.file('test_data.xlsx', excelBuffer);

      // Generate and download zip
      console.log('Generating zip file...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      console.log('Zip file generated, initiating download...');
      saveAs(zipBlob, `${test.title}_Data_${new Date().toISOString().split('T')[0]}.zip`);
      
      toast.success('Test data exported successfully!');
    } catch (error) {
      console.error('Error exporting test data:', error);
      console.error('Error stack:', error.stack);
      toast.error(`Failed to export test data: ${error.message}`);
    }
  };

  // Add this function inside AllTests component, before the return statement
  const exportData = async () => {
    try {
      // Show loading toast
      const loadingToast = toast.loading('Preparing export...');

      // Get all tests data
      const response = await testService.getAllTests({
        search: searchTerm,
        category: selectedCategory,
        status: filterStatus
      });

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Format test data for export
      const formattedData = response.data.map(test => ({
        'Test ID': test._id,
        'Title': test.title,
        'Category': test.category,
        'Difficulty': test.difficulty,
        'Status': test.status,
        'Duration (mins)': test.duration,
        'Total Questions': (test.codingChallenges?.length || 0) + (test.mcqs?.length || 0),
        'MCQs': test.mcqs?.length || 0,
        'Coding Questions': test.codingChallenges?.length || 0,
        'Pass Rate': `${test.passRate || 0}%`,
        'Avg Score': test.avgScore || 0,
        'Total Candidates': test.candidates || 0,
        'Last Modified': new Date(test.lastModified).toLocaleDateString(),
        'Visibility': test.visibility || 'private'
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(formattedData);

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Tests');

      // Generate Excel file
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Save file
      saveAs(data, `Tests_Export_${new Date().toISOString().split('T')[0]}.xlsx`);

      // Show success message
      toast.dismiss(loadingToast);
      toast.success('Data exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Enhanced Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.title}</p>
                    <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                    <div className="mt-2 flex items-center gap-2">
                      {renderTrendIndicator(stat.trend)}
                      <span className="text-xs text-gray-500">{stat.subtext}</span>
                    </div>
                  </div>
                  <div className={`p-4 bg-${stat.color}-50 rounded-full`}>
                    <stat.icon className={`h-6 w-6 text-${stat.color}-500`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Header with Quick Filters */}
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">Assessment Tests</h1>
              <p className="text-sm text-gray-500 mt-1">Create, manage and analyze your tests</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={exportData}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export Data
              </button>
              <button 
                onClick={handleCreateTest}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Test
              </button>
            </div>
          </div>
          
          {/* Quick Filters */}
          <div className="flex gap-4 overflow-x-auto pb-2">
            {quickFilters.map((filter, index) => (
              <button
                key={index}
                className="px-4 py-2 bg-white border rounded-full hover:bg-gray-50 flex items-center gap-2 whitespace-nowrap"
              >
                {filter.label}
                <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                  {filter.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Search and Filters */}
        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tests by name, category, skills..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-100 outline-none"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <select className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-100 outline-none">
                  <option>All Categories</option>
                  <option>Programming</option>
                  <option>Web Development</option>
                  <option>System Design</option>
                  <option>DevOps</option>
                </select>
                <select className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-100 outline-none">
                  <option>Difficulty</option>
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
                <select className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-100 outline-none">
                  <option>Duration</option>
                  <option>&lt; 30 mins</option>
                  <option>30-60 mins</option>
                  <option>&gt; 60 mins</option>
                </select>
                <button className="px-4 py-2 border rounded-lg flex items-center gap-2 hover:bg-gray-50">
                  <Filter className="h-4 w-4" />
                  More Filters
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* View Toggle */}
        <div className="flex justify-end gap-2 mb-4">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
          >
            <BarChart2 className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded ${viewMode === 'table' ? 'bg-gray-100' : ''}`}
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>

        {/* Test Cards Grid View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestTests.map((test) => (
              <TestCard key={test.id} test={test} />
            ))}
          </div>
        )}

        {/* Existing Table View */}
        {viewMode === 'table' && (
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Test Name</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Category</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Duration</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Questions</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Candidates</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Last Modified</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tests.map((test) => (
                    <tr key={test.id} className="hover:bg-gray-50">
                      <td className="p-4">
                        <div>
                          <div className="text-sm font-medium text-gray-800">{test.title}</div>
                          <div className="text-xs text-gray-500">ID: #{test.id}</div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-600">{test.category}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{test.duration}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-600">{test.questions}</td>
                      <td className="p-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          test.status === 'Active' 
                            ? 'bg-green-50 text-green-600' 
                            : 'bg-gray-50 text-gray-600'
                        }`}>
                          {test.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{test.candidates}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{test.lastModified}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button className="p-1 hover:bg-gray-100 rounded" title="View">
                            <Eye className="h-4 w-4 text-gray-400" />
                          </button>
                          <button className="p-1 hover:bg-gray-100 rounded" title="Edit">
                            <Edit className="h-4 w-4 text-gray-400" />
                          </button>
                          <button className="p-1 hover:bg-gray-100 rounded" title="Delete">
                            <Trash2 className="h-4 w-4 text-gray-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default AllTests; 