import React, { useState } from 'react';
import { Plus, Trash2, Edit } from 'lucide-react';
import { toast } from 'react-hot-toast';

const MCQSection = ({ testData, setTestData }) => {
  const [loading] = useState(false);
  const [newMCQ, setNewMCQ] = useState({
    question: '',
    options: ['', ''],
    correctOptions: [],
    answerType: '',
    marks: '',
    difficulty: '',
    explanation: '',
    tags: []
  });

  const removeOption = (indexToRemove) => {
    setNewMCQ(prev => ({
      ...prev,
      options: prev.options.filter((_, index) => index !== indexToRemove),
      correctOptions: prev.correctOptions
        .filter(index => index !== indexToRemove)
        .map(index => index > indexToRemove ? index - 1 : index)
    }));
  };

  const handleEditMCQ = (index) => {
    setNewMCQ(testData.mcqs[index]);
    setTestData(prev => ({
      ...prev,
      mcqs: prev.mcqs.filter((_, i) => i !== index)
    }));
  };

  const handleDeleteMCQ = (index) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      setTestData(prev => ({
        ...prev,
        mcqs: prev.mcqs.filter((_, i) => i !== index)
      }));
    }
  };

  const handleAddOption = () => {
    setNewMCQ({
      ...newMCQ,
      options: [...newMCQ.options, '']
    });
  };

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...newMCQ.options];
    updatedOptions[index] = value;
    setNewMCQ({
      ...newMCQ,
      options: updatedOptions
    });
  };

  const handleCorrectOptionChange = (index) => {
    let updatedCorrectOptions = [...newMCQ.correctOptions];
    if (newMCQ.answerType === 'single') {
      updatedCorrectOptions = [index];
    } else {
      if (updatedCorrectOptions.includes(index)) {
        updatedCorrectOptions = updatedCorrectOptions.filter(i => i !== index);
      } else {
        updatedCorrectOptions.push(index);
      }
    }
    setNewMCQ({
      ...newMCQ,
      correctOptions: updatedCorrectOptions
    });
  };

  const handleAddMCQ = () => {
    // Validation
    if (!newMCQ.question.trim()) {
      toast.error('Please enter a question');
      return;
    }
    if (newMCQ.options.some(opt => !opt.trim())) {
      toast.error('Please fill all options');
      return;
    }
    if (newMCQ.correctOptions.length === 0) {
      toast.error('Please select at least one correct option');
      return;
    }
    if (!newMCQ.marks) {
      toast.error('Please enter marks');
      return;
    }
    if (!newMCQ.difficulty) {
      toast.error('Please select difficulty level');
      return;
    }
    if (!newMCQ.answerType) {
      toast.error('Please select answer type');
      return;
    }

    setTestData(prev => ({
      ...prev,
      mcqs: [...prev.mcqs, {
        ...newMCQ,
        correctOptions: newMCQ.correctOptions.map(Number),
        marks: parseInt(newMCQ.marks)
      }]
    }));

    // Reset form
    setNewMCQ({
      question: '',
      options: ['', ''],
      correctOptions: [],
      answerType: '',
      marks: '',
      difficulty: '',
      explanation: '',
      tags: []
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-4">
        <h3 className="text-lg font-medium mb-4">Add Multiple Choice Question</h3>
        
        <div className="space-y-4">
          {/* Question */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Question*
            </label>
            <textarea
              value={newMCQ.question}
              onChange={(e) => setNewMCQ({ ...newMCQ, question: e.target.value })}
              className="w-full p-2 border rounded-lg"
              rows={3}
              placeholder="Enter your question"
              required
            />
          </div>

          {/* Answer Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Answer Type*
            </label>
            <select
              value={newMCQ.answerType}
              onChange={(e) => setNewMCQ({ ...newMCQ, answerType: e.target.value })}
              className="w-full p-2 border rounded-lg"
              required
            >
              <option value="">Select answer type</option>
              <option value="single">Single Correct Answer</option>
              <option value="multiple">Multiple Correct Answers</option>
            </select>
          </div>

          {/* Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Options*
            </label>
            <div className="space-y-2">
              {newMCQ.options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type={newMCQ.answerType === 'single' ? 'radio' : 'checkbox'}
                    checked={newMCQ.correctOptions.includes(index)}
                    onChange={() => handleCorrectOptionChange(index)}
                    className="h-4 w-4"
                    required
                  />
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="flex-1 p-2 border rounded-lg"
                    placeholder={`Option ${index + 1}`}
                    required
                  />
                  {index > 1 && (
                    <button
                      onClick={() => removeOption(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={handleAddOption}
                type="button"
                className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <Plus className="h-4 w-4" /> Add Option
              </button>
            </div>
          </div>

          {/* Marks and Difficulty */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Marks*
              </label>
              <input
                type="number"
                value={newMCQ.marks}
                onChange={(e) => setNewMCQ({ ...newMCQ, marks: e.target.value })}
                className="w-full p-2 border rounded-lg"
                placeholder="Enter marks"
                min="1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty*
              </label>
              <select
                value={newMCQ.difficulty}
                onChange={(e) => setNewMCQ({ ...newMCQ, difficulty: e.target.value })}
                className="w-full p-2 border rounded-lg"
                required
              >
                <option value="">Select difficulty</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Explanation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Explanation
            </label>
            <textarea
              value={newMCQ.explanation}
              onChange={(e) => setNewMCQ({ ...newMCQ, explanation: e.target.value })}
              className="w-full p-2 border rounded-lg"
              rows={2}
              placeholder="Explain the correct answer (optional)"
            />
          </div>

          {/* Add Question Button */}
          <button
            onClick={handleAddMCQ}
            className="w-full mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Question'}
          </button>
        </div>
      </div>

      {/* Display added MCQs */}
      {testData.mcqs.length > 0 && (
        <div className="bg-white rounded-lg border p-4">
          <h3 className="text-lg font-medium mb-4">Added Questions</h3>
          <div className="space-y-4">
            {testData.mcqs.map((mcq, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <p className="font-medium">{mcq.question}</p>
                    <div className="space-y-1">
                      {mcq.options.map((option, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-2">
                          <input
                            type={mcq.answerType === 'single' ? 'radio' : 'checkbox'}
                            checked={mcq.correctOptions.includes(optIndex)}
                            readOnly
                            className="h-4 w-4"
                          />
                          <span>{option}</span>
                        </div>
                      ))}
                    </div>
                    <div className="text-sm text-gray-500">
                      {mcq.marks} marks • {mcq.difficulty} • {mcq.answerType} answer
                    </div>
                    {mcq.explanation && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Explanation:</span> {mcq.explanation}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditMCQ(index)}
                      className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteMCQ(index)}
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

export default MCQSection; 