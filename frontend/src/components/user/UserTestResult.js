import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { testService } from '../../services/test.service';
import SideBar from './SideBar';

const UserTestResult = () => {
  const { testId } = useParams();
  const [testResult, setTestResult] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('mcq');

  useEffect(() => {
    const fetchTestResult = async () => {
      try {
        const response = await testService.getUserTests({ testId });
        const codingData = response.data.coding;
        if (codingData && codingData.challenges) {
          const completedCount = codingData.challenges.filter(
            challenge => challenge.status === 'passed' || challenge.status === 'partial'
          ).length;
          codingData.completed = completedCount;
        }
        setTestResult(response.data);
      } catch (error) {
        toast.error('Failed to fetch test result');
        console.error('Error fetching test result:', error);
      }
    };

    if (testId) {
      fetchTestResult();
    }
  }, [testId]);

  if (!testResult) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading test results...</p>
        </div>
      </div>
    );
  }

  const renderTestSummary = () => (
    <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{testResult.title}</h1>
          <p className="text-gray-500 mt-2">Completed on {new Date(testResult.startTime).toLocaleDateString()}</p>
        </div>
        <div className={`mt-4 md:mt-0 px-4 py-2 rounded-full ${
          testResult.summary?.status === 'passed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {(testResult.summary?.status || 'NOT ATTEMPTED').toUpperCase()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
          <div className="text-sm text-blue-600 font-medium">Total Score</div>
          <div className="mt-2 flex items-baseline">
            <span className="text-3xl font-bold text-blue-900">
              {testResult.summary?.totalScore || 0}
            </span>
            <span className="text-lg text-blue-600 ml-1">
              /{testResult.summary?.maxScore || 0}
            </span>
          </div>
          <div className="text-sm text-blue-500 mt-1">
            Passing: {testResult.summary?.passingScore || 0}
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl">
          <div className="text-sm text-purple-600 font-medium">Completion Rate</div>
          <div className="mt-2">
            <div className="text-3xl font-bold text-purple-900">
              {Math.round(((testResult.mcq?.correct || 0) / (testResult.mcq?.total || 1)) * 100)}%
            </div>
            <div className="text-sm text-purple-500 mt-1">
              {testResult.mcq?.correct || 0}/{testResult.mcq?.total || 0} Questions
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl">
          <div className="text-sm text-green-600 font-medium">Time Taken</div>
          <div className="mt-2">
            <div className="text-3xl font-bold text-green-900">
              {(testResult.summary?.timeTaken || 0).toFixed(0)}
            </div>
            <div className="text-sm text-green-500 mt-1">minutes</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMCQSection = () => (
    <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Multiple Choice Questions</h2>
          <p className="text-gray-600">
            Score: {testResult.mcq?.score || 0} | 
            Correct: {testResult.mcq?.correct || 0}/{testResult.mcq?.total || 0}
          </p>
        </div>
        <div className={`px-4 py-2 rounded-full ${
          testResult.mcq?.score > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {testResult.mcq?.score || 0} Points
        </div>
      </div>

      <div className="space-y-8">
        {(testResult.mcq?.questions || []).map((question, qIndex) => (
          <div key={question.questionId} className="border rounded-lg p-6 space-y-4">
            <div className="flex justify-between">
              <h3 className="text-lg font-semibold">Question {qIndex + 1}</h3>
              <span className={`px-3 py-1 rounded-full ${
                question.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {question.marks}/{question.maxMarks} marks
              </span>
            </div>
            
            <p className="text-gray-800">{question.question}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[0, 1, 2, 3].map((optionIndex) => {
                const isSelected = (question.selectedOptions || []).includes(optionIndex);
                const isCorrect = (question.correctOptions || []).includes(optionIndex);
                
                return (
                  <div key={optionIndex} 
                       className={`p-4 rounded-lg border ${
                         isSelected && isCorrect ? 'bg-green-50 border-green-200' :
                         isSelected && !isCorrect ? 'bg-red-50 border-red-200' :
                         !isSelected && isCorrect ? 'bg-green-50 border-green-200' :
                         'bg-gray-50 border-gray-200'
                       }`}>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{String.fromCharCode(65 + optionIndex)}.</span>
                      <span>Option {optionIndex + 1}</span>
                      {isSelected && (
                        <span className="ml-auto text-sm">
                          {isCorrect ? '✓ Selected (Correct)' : '✗ Selected (Incorrect)'}
                        </span>
                      )}
                      {!isSelected && isCorrect && (
                        <span className="ml-auto text-sm text-green-600">
                          Correct Answer
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCodingSection = () => (
    <div className="bg-white rounded-xl shadow-sm p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Coding Challenges</h2>
          <p className="text-gray-600">
            Score: {testResult.coding?.score || 0} | 
            Completed: {testResult.coding?.completed || 0}/{testResult.coding?.total || 0}
          </p>
        </div>
        <div className={`px-4 py-2 rounded-full ${
          (testResult.coding?.completed || 0) === (testResult.coding?.total || 0) ? 'bg-green-100 text-green-800' : 
          (testResult.coding?.completed || 0) > 0 ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {(testResult.coding?.completed || 0) === (testResult.coding?.total || 0) ? 'Completed' :
           (testResult.coding?.completed || 0) > 0 ? 'Partial' :
           'Not Attempted'}
        </div>
      </div>

      <div className="space-y-8">
        {(testResult.coding?.challenges || []).map((challenge, index) => (
          <div key={challenge.challengeId} className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 p-6 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    Challenge {index + 1}
                    <span className={`text-sm px-3 py-1 rounded-full ${
                      challenge.status === 'passed' ? 'bg-green-100 text-green-700' : 
                      challenge.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {challenge.status?.toUpperCase()}
                    </span>
                  </h3>
                  <p className="text-gray-600 mt-2">{challenge.description || 'No description available'}</p>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-lg">{challenge.marks}/{challenge.maxMarks || 0} points</div>
                  <div className="text-sm text-gray-500">Language: {challenge.language}</div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Status</div>
                  <div className="font-semibold mt-1">{challenge.status?.toUpperCase() || 'NOT ATTEMPTED'}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Execution Time</div>
                  <div className="font-semibold mt-1">{challenge.executionMetrics?.totalTime || 0} ms</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Memory Used</div>
                  <div className="font-semibold mt-1">{challenge.executionMetrics?.memory || 0} KB</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Test Cases</div>
                  <div className="font-semibold mt-1">
                    {challenge.testCases?.results?.filter(tc => tc.passed).length || 0}/
                    {challenge.testCases?.results?.length || 0} Passed
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Test Cases</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(challenge.testCases?.results || []).map((testCase, i) => (
                    <div key={i} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-medium">Test Case {i + 1}</span>
                        <span className={`px-2 py-1 rounded-full text-sm ${
                          testCase.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {testCase.passed ? '✓ Passed' : '✗ Failed'}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Input:</span> {testCase.input}</div>
                        <div><span className="font-medium">Expected:</span> {testCase.expectedOutput}</div>
                        {testCase.actualOutput && (
                          <div><span className="font-medium">Output:</span> {testCase.actualOutput}</div>
                        )}
                        {testCase.error && (
                          <div className="text-red-600"><span className="font-medium">Error:</span> {testCase.error}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-lg mb-3">Your Solution</h4>
                <div className="relative">
                  <pre className="bg-gray-800 text-white p-6 rounded-lg overflow-x-auto">
                    <code>{challenge.code || '// No code submitted'}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMainContent = () => (
    <div className="space-y-8">
      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab('mcq')}
              className={`px-8 py-4 font-medium text-sm focus:outline-none ${
                activeTab === 'mcq'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Multiple Choice Questions
              <span className="ml-2 text-xs px-2 py-1 rounded-full bg-gray-100">
                {testResult.mcq?.total || 0}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('coding')}
              className={`px-8 py-4 font-medium text-sm focus:outline-none ${
                activeTab === 'coding'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Coding Challenges
              <span className="ml-2 text-xs px-2 py-1 rounded-full bg-gray-100">
                {testResult.coding?.total || 0}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'mcq' && testResult.mcq?.questions?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold">Multiple Choice Questions</h2>
                <p className="text-gray-600">
                  Score: {testResult.mcq?.score || 0} | 
                  Correct: {testResult.mcq?.correct || 0}/{testResult.mcq?.total || 0}
                </p>
              </div>
              <div className={`px-4 py-2 rounded-full ${
                testResult.mcq?.score > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {testResult.mcq?.score || 0} Points
              </div>
            </div>
            {renderMCQSection()}
          </div>
        </div>
      )}

      {activeTab === 'coding' && testResult.coding?.challenges?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold">Coding Challenges</h2>
                <p className="text-gray-600">
                  Score: {testResult.coding?.score || 0} | 
                  Completed: {testResult.coding?.completed || 0}/{testResult.coding?.total || 0}
                </p>
              </div>
            </div>
            {renderCodingSection()}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <SideBar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : ''}`}>
        <div className="p-6 max-w-[1920px] mx-auto">
          {renderTestSummary()}
          {renderMainContent()}
        </div>
      </div>
    </div>
  );
};

export default UserTestResult;
