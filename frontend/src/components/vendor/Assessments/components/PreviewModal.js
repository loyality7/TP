import React from 'react';
import { X, Clock, Award, FileText, Star, Users, Tag } from 'lucide-react';

const PreviewModal = ({ template, onClose }) => {
  if (!template) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[800px] max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">{template.title}</h2>
            <p className="text-gray-500 mt-1">{template.description}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-6">
            {/* Key Information */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="text-sm text-gray-500">Duration</div>
                <div className="font-medium flex items-center gap-2 mt-1">
                  <Clock className="h-4 w-4 text-gray-400" />
                  {template.duration}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Total Questions</div>
                <div className="font-medium flex items-center gap-2 mt-1">
                  <FileText className="h-4 w-4 text-gray-400" />
                  {template.questions}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Total Marks</div>
                <div className="font-medium flex items-center gap-2 mt-1">
                  <Award className="h-4 w-4 text-gray-400" />
                  {template.totalMarks}
                </div>
              </div>
            </div>

            {/* Question Distribution */}
            <div>
              <h3 className="font-medium mb-3">Question Distribution</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span>MCQ Questions</span>
                  <span className="font-medium">25 (50 marks)</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span>Coding Challenges</span>
                  <span className="font-medium">3 (50 marks)</span>
                </div>
              </div>
            </div>

            {/* Skills Covered */}
            <div>
              <h3 className="font-medium mb-3">Skills Covered</h3>
              <div className="flex flex-wrap gap-2">
                {template.tags.map((tag, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-sm flex items-center gap-2"
                  >
                    <Tag className="h-4 w-4" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Sample Questions */}
            <div>
              <h3 className="font-medium mb-3">Sample Questions</h3>
              <div className="space-y-4">
                {/* Sample MCQ */}
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-emerald-500 font-medium">MCQ</span>
                    <span className="text-sm text-gray-500">2 marks</span>
                  </div>
                  <p className="mt-2">What is the primary purpose of React's useEffect hook?</p>
                </div>
                {/* Sample Coding Challenge */}
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-emerald-500 font-medium">Coding</span>
                    <span className="text-sm text-gray-500">15 marks</span>
                  </div>
                  <p className="mt-2">Implement a function to find the longest palindromic substring.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-amber-400 fill-current" />
                <span className="font-medium">{template.popularity}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-500">
                <Users className="h-4 w-4" />
                <span>{template.usageCount} uses</span>
              </div>
            </div>
            <button 
              onClick={() => {
                onClose();
                // Add navigation logic here
              }}
              className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
            >
              Use Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal; 