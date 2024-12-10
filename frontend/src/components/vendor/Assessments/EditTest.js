import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../../layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '../../common/Card';
import { toast } from 'react-hot-toast';
import { useTestManagement } from '../../../hooks/useTestManagement';
import SettingsTab from './components/SettingsTab';
import { testService } from '../../../services/test.service';
import MCQSection from './components/MCQSection';
import CodingSection from './components/CodingSection';

const EditTest = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  useTestManagement();

  const [testData, setTestData] = useState({
    title: '',
    description: '',
    duration: '',
    proctoring: false,
    type: '',
    category: '',
    difficulty: '',
    instructions: '',
    mcqs: [],
    codingChallenges: [],
    accessControl: {
      type: 'private'
    },
    settings: {}
  });

  // Fetch test data on component mount
  useEffect(() => {
    const fetchTestData = async () => {
      try {
        setLoading(true);
        const response = await testService.getTestById(testId);
        
        if (response.data) {
          setTestData(response.data);
          console.log('Loaded test data:', response.data); // For debugging
        } else {
          throw new Error('No test data received');
        }
      } catch (error) {
        console.error('Error fetching test:', error);
        toast.error('Failed to fetch test data');
        navigate('/vendor/tests');
      } finally {
        setLoading(false);
      }
    };

    fetchTestData();
  }, [testId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Basic validation
      if (!testData.title) throw new Error('Test title is required');
      if (!testData.type) throw new Error('Test type is required');
      if (!testData.duration) throw new Error('Test duration is required');
      if (!testData.difficulty) throw new Error('Test difficulty is required');
      if (!testData.category) throw new Error('Test category is required');
      if (testData.mcqs.length === 0 && testData.codingChallenges.length === 0) {
        throw new Error('Add at least one question (MCQ or Coding Challenge)');
      }

      // Format data for API
      const formattedData = {
        ...testData,
        duration: parseInt(testData.duration),
        proctoring: testData.proctoring === 'true',
        mcqs: testData.mcqs.map(mcq => ({
          ...mcq,
          marks: parseInt(mcq.marks),
          correctOptions: mcq.correctOptions.map(Number)
        })),
        codingChallenges: testData.codingChallenges.map(challenge => ({
          ...challenge,
          marks: parseInt(challenge.marks),
          timeLimit: parseInt(challenge.timeLimit),
          memoryLimit: parseInt(challenge.memoryLimit)
        }))
      };

      await testService.updateTest(testId, formattedData);
      
      toast.success('Test updated successfully!');
      navigate('/vendor/tests');
    } catch (error) {
      console.error('Error updating test:', error);
      toast.error(error.message || 'Failed to update test');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? All changes will be lost.')) {
      navigate('/vendor/tests');
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'details':
        return (
          <Card>
            <CardHeader className="border-b p-4">
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Test Title*
                  </label>
                  <input
                    type="text"
                    value={testData.title}
                    onChange={(e) => setTestData({...testData, title: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-100 outline-none"
                    placeholder="Enter test title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category*
                  </label>
                  <select
                    value={testData.category}
                    onChange={(e) => setTestData({...testData, category: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-100 outline-none"
                  >
                    <option value="">Select category</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Programming">Programming</option>
                    <option value="Data Structures">Data Structures</option>
                    <option value="Algorithms">Algorithms</option>
                    <option value="Web Development">Web Development</option>
                    <option value="Database">Database</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Test Type*
                  </label>
                  <select
                    value={testData.type}
                    onChange={(e) => setTestData({...testData, type: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-100 outline-none"
                  >
                    <option value="">Select type</option>
                    <option value="assessment">Assessment</option>
                    <option value="coding_challenge">Coding Challenge</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes)*
                  </label>
                  <input
                    type="number"
                    value={testData.duration}
                    onChange={(e) => setTestData({...testData, duration: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-100 outline-none"
                    placeholder="Enter duration"
                    min="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty Level*
                  </label>
                  <select
                    value={testData.difficulty}
                    onChange={(e) => setTestData({...testData, difficulty: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-100 outline-none"
                  >
                    <option value="">Select difficulty</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Proctoring
                  </label>
                  <select
                    value={testData.proctoring}
                    onChange={(e) => setTestData({...testData, proctoring: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-100 outline-none"
                  >
                    <option value="true">Enabled</option>
                    <option value="false">Disabled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={testData.description}
                  onChange={(e) => setTestData({...testData, description: e.target.value})}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-100 outline-none"
                  rows={3}
                  placeholder="Enter test description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instructions
                </label>
                <textarea
                  value={testData.instructions}
                  onChange={(e) => setTestData({...testData, instructions: e.target.value})}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-100 outline-none"
                  rows={3}
                  placeholder="Enter test instructions"
                />
              </div>
            </CardContent>
          </Card>
        );
      case 'questions':
        return (
          <div className="space-y-6">
            <MCQSection testData={testData} setTestData={setTestData} />
            <CodingSection testData={testData} setTestData={setTestData} />
          </div>
        );
      case 'settings':
        return <SettingsTab testData={testData} setTestData={setTestData} />;
      default:
        return null;
    }
  };

  // Loading state UI
  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-8">
          {/* Add loading skeleton similar to CreateTest */}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Edit Test</h1>
          <div className="flex space-x-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="border-b">
          <nav className="flex space-x-4">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-4 py-2 ${
                activeTab === 'details'
                  ? 'border-b-2 border-emerald-500 text-emerald-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Basic Details
            </button>
            <button
              onClick={() => setActiveTab('questions')}
              className={`px-4 py-2 ${
                activeTab === 'questions'
                  ? 'border-b-2 border-emerald-500 text-emerald-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Questions
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 ${
                activeTab === 'settings'
                  ? 'border-b-2 border-emerald-500 text-emerald-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Settings
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {!loading && renderTabContent()}
      </div>
    </Layout>
  );
};

export default EditTest; 