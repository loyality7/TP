import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '../../common/Card';
import { toast } from 'react-hot-toast';
import { useTestManagement } from '../../../hooks/useTestManagement';
import SettingsTab from './components/SettingsTab';
import { testService } from '../../../services/test.service';
import MCQSection from './components/MCQSection';
import CodingSection from './components/CodingSection';

const CreateTest = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  useTestManagement();
  
  const [activeTab, setActiveTab] = useState('details');
  
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
    }
  });

  const [validationErrors, setValidationErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setValidationErrors({}); // Clear previous validation errors
      
      // Basic validation
      const errors = {};
      
      if (!testData.title) {
        errors.title = 'Test title is required';
      }
      if (!testData.type) {
        errors.type = 'Test type is required';
      }
      if (!testData.duration) {
        errors.duration = 'Test duration is required';
      }
      if (!testData.difficulty) {
        errors.difficulty = 'Test difficulty is required';
      }
      if (!testData.category) {
        errors.category = 'Test category is required';
      }
      if (testData.mcqs.length === 0 && testData.codingChallenges.length === 0) {
        errors.questions = 'Add at least one question (MCQ or Coding Challenge)';
      }

      // If there are validation errors, show them and return
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        Object.values(errors).forEach(error => toast.error(error));
        return;
      }

      // Create the test without storing response
      await testService.createTest(testData);
      
      toast.success('Test created successfully!');
      navigate('/vendor/tests');
    } catch (error) {
      console.error('Error creating test:', error);
      toast.error(error.message || 'Failed to create test');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? All changes will be lost.')) {
      navigate('/vendor/tests');
    }
  };

  const renderError = (field) => {
    if (validationErrors[field]) {
      return (
        <span className="text-red-500 text-xs mt-1 flex items-center">
          {validationErrors[field]}
        </span>
      );
    }
    return null;
  };

  const renderTabContent = () => {
    switch (activeTab) {
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

  if (loading) {
    return (
      <Layout>
        <div className="space-y-8">
          {/* Header loading skeleton */}
          <div className="flex justify-between items-center">
            <div className="h-8 w-1/4 bg-gray-200 rounded animate-pulse" />
            <div className="flex gap-3">
              <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>

          {/* Form loading skeleton */}
          <div className="bg-white rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b">
              <div className="h-6 w-1/4 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-10 w-full bg-gray-100 rounded animate-pulse" />
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <div className="h-4 w-1/6 bg-gray-200 rounded animate-pulse" />
                <div className="h-32 w-full bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          </div>

          {/* Tab loading skeleton */}
          <div className="flex gap-4 border-b pb-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Create New Test</h1>
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
              {loading ? 'Creating...' : 'Create Test'}
            </button>
          </div>
        </div>

        <div className="space-y-6">
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
                  {renderError('title')}
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
                  {renderError('category')}
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
                  {renderError('type')}
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
                  {renderError('duration')}
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
                  {renderError('difficulty')}
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

          {renderTabContent()}
        </div>
      </div>
    </Layout>
  );
};

export default CreateTest; 