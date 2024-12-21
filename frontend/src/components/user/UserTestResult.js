import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { testService } from '../../services/test.service';
import SideBar from './SideBar';

const UserTestResult = () => {
  const { testId } = useParams();
  const [testResult, setTestResult] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const fetchTestResult = async () => {
      try {
        const response = await testService.getUserTests({ testId });
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

  const getOptionLabel = (index) => {
    return String.fromCharCode(65 + index); // Converts 0 -> A, 1 -> B, etc.
  };

  const renderMCQSection = () => (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
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
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Coding Challenges</h2>
          <p className="text-gray-600">
            Score: {testResult.coding?.score || 0} | 
            Completed: {testResult.coding?.completed || 0}/{testResult.coding?.total || 0}
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {(testResult.coding?.challenges || []).map((challenge, index) => (
          <div key={challenge.challengeId} className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 p-4 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold">{challenge.title}</h3>
                  <p className="text-gray-600 mt-1">{challenge.description}</p>
                </div>
                <div className={`px-3 py-1 rounded-full ${
                  challenge.status === 'passed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {challenge.marks}/{challenge.maxMarks} points
                </div>
              </div>
            </div>

            <div className="p-4 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600">Status</div>
                  <div className="font-semibold">{challenge.status?.toUpperCase() || 'NOT ATTEMPTED'}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600">Language</div>
                  <div className="font-semibold">{challenge.language}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600">Execution Time</div>
                  <div className="font-semibold">{challenge.executionMetrics?.totalTime || 0} ms</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600">Memory Used</div>
                  <div className="font-semibold">{challenge.executionMetrics?.memory || 0} KB</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Test Cases</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(challenge.testCases?.sample || []).map((testCase, i) => (
                    <div key={i} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Test Case {i + 1}</span>
                        <span className={`text-sm ${
                          testCase.passed ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {testCase.passed ? '✓ Passed' : '✗ Failed'}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">Input:</span> {testCase.input}
                        </div>
                        {testCase.output && (
                          <div className="text-sm">
                            <span className="font-medium">Output:</span> {testCase.output}
                          </div>
                        )}
                        {testCase.expected && (
                          <div className="text-sm">
                            <span className="font-medium">Expected:</span> {testCase.expected}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Your Solution</h4>
                <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-x-auto">
                  <code>{challenge.code || '// No code submitted'}</code>
                </pre>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <SideBar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : ''}`}>
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          {/* Test Summary Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h1 className="text-3xl font-bold mb-4">{testResult.title}</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Total Score</div>
                <div className="text-2xl font-bold">
                  {testResult.summary?.totalScore || 0}/{testResult.summary?.maxScore || 0}
                </div>
                <div className="text-sm text-gray-500">
                  Passing: {testResult.summary?.passingScore || 0}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Status</div>
                <div className={`text-2xl font-bold ${
                  testResult.summary?.status === 'passed' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {(testResult.summary?.status || 'NOT ATTEMPTED').toUpperCase()}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Time Taken</div>
                <div className="text-2xl font-bold">
                  {(testResult.summary?.timeTaken || 0).toFixed(2)} minutes
                </div>
              </div>
            </div>
          </div>

          {/* MCQ Section */}
          {renderMCQSection()}

          {/* Coding Section */}
          {renderCodingSection()}
        </div>
      </div>
    </div>
  );
};

export default UserTestResult;
