import React, { useState } from 'react';
import Layout from '../../layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '../../common/Card';
import { 
  Search, Filter, Plus, Tag, MoreVertical, Edit2, Trash2,
  Code, Database, Brain, FileText, Clock, Award, Eye,
  CheckCircle, XCircle, AlertCircle, Book, Bookmark
} from 'lucide-react';

const QuestionBank = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const questions = [
    {
      id: 1,
      question: 'What is the difference between let and const in JavaScript?',
      type: 'MCQ',
      category: 'JavaScript',
      difficulty: 'Intermediate',
      lastModified: '2024-03-15',
      usageCount: 45,
      marks: 2,
      correctAnswerRate: 75,
      options: [
        { text: 'let is block-scoped, const is function-scoped', isCorrect: false },
        { text: 'Both are block-scoped, but const cannot be reassigned', isCorrect: true },
        { text: 'const is block-scoped, let is function-scoped', isCorrect: false },
        { text: 'There is no difference between let and const', isCorrect: false }
      ],
      explanation: 'Both let and const are block-scoped declarations, but const creates a read-only reference to a value.',
      tags: ['ES6', 'Variables', 'Scope'],
      timeLimit: 60, // seconds
      skillLevel: 'Intermediate'
    },
    {
      id: 2,
      question: 'Write a function to implement Quick Sort algorithm',
      type: 'Coding',
      category: 'Data Structures',
      difficulty: 'Advanced',
      lastModified: '2024-03-14',
      usageCount: 32,
      marks: 15,
      correctAnswerRate: 45,
      testCases: [
        { input: '[5,2,8,1,9]', output: '[1,2,5,8,9]', isHidden: false },
        { input: '[3,3,3,3]', output: '[3,3,3,3]', isHidden: true }
      ],
      timeLimit: 30 * 60, // 30 minutes
      memoryLimit: 512, // MB
      tags: ['Sorting', 'Divide & Conquer', 'Arrays'],
      sampleSolution: 'function quickSort(arr) { ... }',
      skillLevel: 'Advanced'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Questions', count: 150, icon: Book },
    { id: 'programming', name: 'Programming', count: 45, icon: Code },
    { id: 'database', name: 'Database', count: 30, icon: Database },
    { id: 'web', name: 'Web Development', count: 40, icon: FileText },
    { id: 'ai', name: 'AI/ML', count: 35, icon: Brain }
  ];

  const renderQuestionCard = (question) => (
    <Card key={question.id} className="hover:shadow-md transition-all">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Question Header */}
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium
                  ${question.type === 'MCQ' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                  {question.type}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium
                  ${question.difficulty === 'Advanced' ? 'bg-red-50 text-red-600' : 
                    question.difficulty === 'Intermediate' ? 'bg-amber-50 text-amber-600' : 
                    'bg-green-50 text-green-600'}`}>
                  {question.difficulty}
                </span>
              </div>
              <h3 className="font-medium text-gray-800 text-lg">{question.question}</h3>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-50 rounded-lg">
                <Bookmark className="h-4 w-4 text-gray-400" />
              </button>
              <button className="p-2 hover:bg-gray-50 rounded-lg">
                <Edit2 className="h-4 w-4 text-gray-400" />
              </button>
              <button className="p-2 hover:bg-gray-50 rounded-lg text-red-400">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Question Details */}
          <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="text-sm text-gray-500">Marks</div>
              <div className="font-medium flex items-center gap-2 mt-1">
                <Award className="h-4 w-4 text-gray-400" />
                {question.marks}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Time Limit</div>
              <div className="font-medium flex items-center gap-2 mt-1">
                <Clock className="h-4 w-4 text-gray-400" />
                {question.timeLimit / 60} min
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Success Rate</div>
              <div className="font-medium flex items-center gap-2 mt-1">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                {question.correctAnswerRate}%
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Usage</div>
              <div className="font-medium flex items-center gap-2 mt-1">
                <Eye className="h-4 w-4 text-gray-400" />
                {question.usageCount} tests
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {question.tags.map((tag, index) => (
              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                {tag}
              </span>
            ))}
          </div>

          {/* Question Preview */}
          {question.type === 'MCQ' && (
            <div className="space-y-2 p-4 border rounded-lg">
              <div className="text-sm font-medium text-gray-500">Sample Options:</div>
              <div className="grid grid-cols-2 gap-2">
                {question.options.slice(0, 2).map((option, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div className={`h-4 w-4 ${option.isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                      {option.isCorrect ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    </div>
                    {option.text}
                  </div>
                ))}
              </div>
            </div>
          )}

          {question.type === 'Coding' && (
            <div className="space-y-2 p-4 border rounded-lg">
              <div className="text-sm font-medium text-gray-500">Sample Test Case:</div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Input:</span>
                  <code className="ml-2 px-2 py-1 bg-gray-100 rounded">{question.testCases[0].input}</code>
                </div>
                <div>
                  <span className="text-gray-500">Output:</span>
                  <code className="ml-2 px-2 py-1 bg-gray-100 rounded">{question.testCases[0].output}</code>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Layout>
      <div className="space-y-6 relative">
        {/* Blur overlay */}
        <div className="absolute inset-0 backdrop-blur-sm bg-white/50 z-10 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Coming Soon</h2>
            <p className="text-gray-600">This feature is currently under development</p>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">Question Bank</h1>
          <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Question
          </button>
        </div>

        <div className="grid grid-cols-4 gap-6">
          {/* Categories Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium text-gray-800 mb-3">Categories</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                        selectedCategory === category.id
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Questions List */}
          <div className="col-span-3 space-y-4">
            {/* Search and Filter */}
            <Card>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search questions..."
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-100 outline-none"
                    />
                  </div>
                  <button className="px-4 py-2 border rounded-lg flex items-center gap-2 hover:bg-gray-50">
                    <Filter className="h-4 w-4" />
                    Filters
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Questions */}
            <div className="space-y-4">
              {questions.map(renderQuestionCard)}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default QuestionBank; 