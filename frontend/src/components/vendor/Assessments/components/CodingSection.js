import React, { useState } from 'react';
import { Plus, Trash2, Edit } from 'lucide-react';
import { toast } from 'react-hot-toast';

const CodingSection = ({ testData, setTestData }) => {
  const [newChallenge, setNewChallenge] = useState({
    title: '',
    description: '',
    problemStatement: '',
    constraints: '',
    allowedLanguages: [],
    languageImplementations: {},
    testCases: [],
    marks: '',
    timeLimit: '',
    memoryLimit: '',
    difficulty: '',
    tags: [],
    proctoring: '',
    category: '',
    instructions: ''
  });

  const [newTestCase, setNewTestCase] = useState({
    input: '',
    output: '',
    isVisible: true,
    explanation: ''
  });

  const programmingLanguages = [
    { id: 'javascript', name: 'JavaScript' },
    { id: 'python', name: 'Python' },
    { id: 'java', name: 'Java' },
    { id: 'cpp', name: 'C++' },
    { id: 'c', name: 'C' }
  ];

  const handleAddChallenge = () => {
    // Validation
    if (!newChallenge.title?.trim()) {
      toast.error('Please enter challenge title');
      return;
    }
    if (!newChallenge.description?.trim()) {
      toast.error('Please enter description');
      return;
    }
    if (!newChallenge.problemStatement?.trim()) {
      toast.error('Please enter problem statement');
      return;
    }
    if (!newChallenge.constraints?.trim()) {
      toast.error('Please enter constraints');
      return;
    }
    if (newChallenge.allowedLanguages.length === 0) {
      toast.error('Please select at least one programming language');
      return;
    }
    if (newChallenge.testCases.length === 0) {
      toast.error('Please add at least one test case');
      return;
    }
    if (!newChallenge.marks) {
      toast.error('Please enter marks');
      return;
    }
    if (!newChallenge.timeLimit) {
      toast.error('Please enter time limit');
      return;
    }
    if (!newChallenge.memoryLimit) {
      toast.error('Please enter memory limit');
      return;
    }
    if (!newChallenge.difficulty) {
      toast.error('Please select difficulty level');
      return;
    }

    // Generate language implementations
    const implementations = {};
    newChallenge.allowedLanguages.forEach(lang => {
      implementations[lang] = {
        visibleCode: getDefaultTemplate(lang),
        invisibleCode: getDefaultTestHelper(lang)
      };
    });

    const challenge = {
      ...newChallenge,
      languageImplementations: implementations,
      marks: parseInt(newChallenge.marks),
      timeLimit: parseInt(newChallenge.timeLimit),
      memoryLimit: parseInt(newChallenge.memoryLimit)
    };

    setTestData(prev => ({
      ...prev,
      codingChallenges: [...prev.codingChallenges, challenge]
    }));

    // Reset form
    setNewChallenge({
      title: '',
      description: '',
      problemStatement: '',
      constraints: '',
      allowedLanguages: [],
      languageImplementations: {},
      testCases: [],
      marks: '',
      timeLimit: '',
      memoryLimit: '',
      difficulty: '',
      tags: [],
      proctoring: '',
      category: '',
      instructions: ''
    });
  };

  const getDefaultTemplate = (language) => {
    const templates = {
      javascript: `function solution(input) {\n    // Write your code here\n    \n}`,
      python: `def solution(input):\n    # Write your code here\n    pass`,
      java: `public class Solution {\n    public static void main(String[] args) {\n        // Write your code here\n        \n    }\n}`,
      cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    \n    return 0;\n}`,
      c: `#include <stdio.h>\n\nint main() {\n    // Write your code here\n    \n    return 0;\n}`
    };
    return templates[language] || '';
  };

  const getDefaultTestHelper = (language) => {
    const helpers = {
      javascript: `module.exports = solution;`,
      python: `# Test helper code here`,
      java: `// Test helper code here`,
      cpp: `// Test helper code here`,
      c: `// Test helper code here`
    };
    return helpers[language] || '';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-4">
        <h3 className="text-lg font-medium mb-4">Add Coding Challenge</h3>
        
        <div className="space-y-4">
          {/* Basic Information */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Challenge Title*
            </label>
            <input
              type="text"
              value={newChallenge.title}
              onChange={(e) => setNewChallenge({ ...newChallenge, title: e.target.value })}
              className="w-full p-2 border rounded-lg"
              placeholder="Enter challenge title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description*
            </label>
            <textarea
              value={newChallenge.description}
              onChange={(e) => setNewChallenge({ ...newChallenge, description: e.target.value })}
              className="w-full p-2 border rounded-lg"
              rows={3}
              placeholder="Brief description of the challenge"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Problem Statement*
            </label>
            <textarea
              value={newChallenge.problemStatement}
              onChange={(e) => setNewChallenge({ ...newChallenge, problemStatement: e.target.value })}
              className="w-full p-2 border rounded-lg"
              rows={4}
              placeholder="Detailed problem statement with examples"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Constraints*
            </label>
            <textarea
              value={newChallenge.constraints}
              onChange={(e) => setNewChallenge({ ...newChallenge, constraints: e.target.value })}
              className="w-full p-2 border rounded-lg"
              rows={2}
              placeholder="Input constraints, time/space complexity requirements"
              required
            />
          </div>

          {/* Challenge Settings */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Limit (ms)*
              </label>
              <input
                type="number"
                value={newChallenge.timeLimit}
                onChange={(e) => setNewChallenge({ ...newChallenge, timeLimit: e.target.value })}
                className="w-full p-2 border rounded-lg"
                placeholder="e.g., 1000"
                min="100"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Memory Limit (MB)*
              </label>
              <input
                type="number"
                value={newChallenge.memoryLimit}
                onChange={(e) => setNewChallenge({ ...newChallenge, memoryLimit: e.target.value })}
                className="w-full p-2 border rounded-lg"
                placeholder="e.g., 128"
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Marks*
              </label>
              <input
                type="number"
                value={newChallenge.marks}
                onChange={(e) => setNewChallenge({ ...newChallenge, marks: e.target.value })}
                className="w-full p-2 border rounded-lg"
                placeholder="Enter marks"
                min="1"
                required
              />
            </div>
          </div>

          {/* Programming Languages and Implementations */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allowed Languages*
              </label>
              <div className="flex flex-wrap gap-2">
                {programmingLanguages.map(lang => (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => {
                      const isSelected = newChallenge.allowedLanguages.includes(lang.id);
                      setNewChallenge({
                        ...newChallenge,
                        allowedLanguages: isSelected
                          ? newChallenge.allowedLanguages.filter(l => l !== lang.id)
                          : [...newChallenge.allowedLanguages, lang.id]
                      });
                    }}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      newChallenge.allowedLanguages.includes(lang.id)
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Language Implementations */}
            {newChallenge.allowedLanguages.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700">Language Implementations</h4>
                {newChallenge.allowedLanguages.map(lang => (
                  <div key={lang} className="border rounded-lg p-4 space-y-4">
                    <h5 className="font-medium">{programmingLanguages.find(l => l.id === lang)?.name}</h5>
                    
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Visible Code Template*
                      </label>
                      <textarea
                        value={newChallenge.languageImplementations[lang]?.visibleCode || ''}
                        onChange={(e) => {
                          setNewChallenge({
                            ...newChallenge,
                            languageImplementations: {
                              ...newChallenge.languageImplementations,
                              [lang]: {
                                ...newChallenge.languageImplementations[lang],
                                visibleCode: e.target.value
                              }
                            }
                          });
                        }}
                        className="w-full p-2 border rounded-lg font-mono text-sm"
                        rows={6}
                        placeholder={`Enter ${lang} template code`}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Invisible Test Helper Code
                      </label>
                      <textarea
                        value={newChallenge.languageImplementations[lang]?.invisibleCode || ''}
                        onChange={(e) => {
                          setNewChallenge({
                            ...newChallenge,
                            languageImplementations: {
                              ...newChallenge.languageImplementations,
                              [lang]: {
                                ...newChallenge.languageImplementations[lang],
                                invisibleCode: e.target.value
                              }
                            }
                          });
                        }}
                        className="w-full p-2 border rounded-lg font-mono text-sm"
                        rows={4}
                        placeholder={`Enter ${lang} test helper code`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Test Cases */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Cases*
            </label>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Input*</label>
                  <textarea
                    value={newTestCase.input}
                    onChange={(e) => setNewTestCase({ ...newTestCase, input: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                    rows={2}
                    placeholder="Test case input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Expected Output*</label>
                  <textarea
                    value={newTestCase.output}
                    onChange={(e) => setNewTestCase({ ...newTestCase, output: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                    rows={2}
                    placeholder="Expected output"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Explanation</label>
                <textarea
                  value={newTestCase.explanation}
                  onChange={(e) => setNewTestCase({ ...newTestCase, explanation: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  rows={2}
                  placeholder="Explain this test case (optional)"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isVisible"
                  checked={newTestCase.isVisible}
                  onChange={(e) => setNewTestCase({ ...newTestCase, isVisible: e.target.checked })}
                  className="h-4 w-4 text-emerald-600 rounded"
                />
                <label htmlFor="isVisible" className="ml-2 text-sm text-gray-600">
                  Visible to students
                </label>
              </div>
              <button
                onClick={() => {
                  if (!newTestCase.input || !newTestCase.output) {
                    toast.error('Input and output are required for test case');
                    return;
                  }
                  setNewChallenge({
                    ...newChallenge,
                    testCases: [...newChallenge.testCases, newTestCase]
                  });
                  setNewTestCase({
                    input: '',
                    output: '',
                    isVisible: true,
                    explanation: ''
                  });
                }}
                type="button"
                className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <Plus className="h-4 w-4" /> Add Test Case
              </button>
            </div>
          </div>

          {/* Added Test Cases Preview */}
          {newChallenge.testCases.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Added Test Cases</h4>
              <div className="space-y-2">
                {newChallenge.testCases.map((testCase, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex justify-between">
                      <div>
                        <div className="text-sm"><strong>Input:</strong> {testCase.input}</div>
                        <div className="text-sm"><strong>Output:</strong> {testCase.output}</div>
                        {testCase.explanation && (
                          <div className="text-sm text-gray-600">
                            <strong>Explanation:</strong> {testCase.explanation}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setNewChallenge({
                            ...newChallenge,
                            testCases: newChallenge.testCases.filter((_, i) => i !== index)
                          });
                        }}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Proctoring*
            </label>
            <select
              value={newChallenge.proctoring}
              onChange={(e) => setNewChallenge({ ...newChallenge, proctoring: e.target.value })}
              className="w-full p-2 border rounded-lg"
              required
            >
              <option value="">Select proctoring</option>
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category*
            </label>
            <input
              type="text"
              value={newChallenge.category}
              onChange={(e) => setNewChallenge({ ...newChallenge, category: e.target.value })}
              className="w-full p-2 border rounded-lg"
              placeholder="Enter category"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Instructions*
            </label>
            <textarea
              value={newChallenge.instructions}
              onChange={(e) => setNewChallenge({ ...newChallenge, instructions: e.target.value })}
              className="w-full p-2 border rounded-lg"
              rows={3}
              placeholder="Enter instructions"
              required
            />
          </div>

          {/* Difficulty Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Difficulty Level*
            </label>
            <select
              value={newChallenge.difficulty}
              onChange={(e) => setNewChallenge({ ...newChallenge, difficulty: e.target.value })}
              className="w-full p-2 border rounded-lg"
              required
            >
              <option value="">Select difficulty</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <button
            onClick={handleAddChallenge}
            className="w-full mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
          >
            Add Challenge
          </button>
        </div>
      </div>

      {/* List of Added Challenges */}
      {testData.codingChallenges.length > 0 && (
        <div className="bg-white rounded-lg border p-4">
          <h3 className="text-lg font-medium mb-4">Added Challenges</h3>
          <div className="space-y-4">
            {testData.codingChallenges.map((challenge, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{challenge.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">{challenge.description}</p>
                    <div className="mt-2">
                      <span className="text-sm text-gray-500">
                        {challenge.marks} marks • {challenge.timeLimit}ms • {challenge.memoryLimit}MB
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {challenge.allowedLanguages.map(lang => (
                        <span key={lang} className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                          {programmingLanguages.find(l => l.id === lang)?.name || lang}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        // Handle edit
                        setNewChallenge(challenge);
                        setTestData({
                          ...testData,
                          codingChallenges: testData.codingChallenges.filter((_, i) => i !== index)
                        });
                      }}
                      className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => {
                        setTestData({
                          ...testData,
                          codingChallenges: testData.codingChallenges.filter((_, i) => i !== index)
                        });
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CodingSection; 