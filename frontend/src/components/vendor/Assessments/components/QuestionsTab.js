import React, { useState } from 'react';
import { Code, List, Upload, Database } from 'lucide-react';
import MCQSection from './MCQSection';
import CodingSection from './CodingSection';

const QuestionsTab = ({ testData, setTestData }) => {
  const [activeSection, setActiveSection] = useState('mcq');
  const [importError, setImportError] = useState(null);

  const handleImportQuestions = async (type) => {
    try {
      // Create a file input element
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = type === 'csv' ? '.csv' : '.json';
      
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        
        reader.onload = async (event) => {
          try {
            let questions;
            
            if (type === 'csv') {
              // Parse CSV
              const csv = event.target.result;
              questions = await parseCSV(csv);
            } else {
              // Parse JSON
              questions = JSON.parse(event.target.result);
            }

            // Validate the imported questions
            if (validateImportedQuestions(questions)) {
              // Update test data with imported questions
              setTestData(prev => ({
                ...prev,
                [activeSection === 'mcq' ? 'mcqs' : 'codingChallenges']: [
                  ...prev[activeSection === 'mcq' ? 'mcqs' : 'codingChallenges'],
                  ...questions
                ]
              }));
            }
          } catch (error) {
            setImportError(`Failed to parse ${type.toUpperCase()} file: ${error.message}`);
          }
        };

        if (type === 'csv') {
          reader.readAsText(file);
        } else {
          reader.readAsText(file);
        }
      };

      input.click();
    } catch (error) {
      setImportError(`Error importing questions: ${error.message}`);
    }
  };

  const parseCSV = (csv) => {
    // Basic CSV parsing (you might want to use a library like Papa Parse for more robust parsing)
    const rows = csv.split('\n');
    const headers = rows[0].split(',');
    
    return rows.slice(1).map(row => {
      const values = row.split(',');
      const question = {};
      
      headers.forEach((header, index) => {
        const value = values[index]?.trim();
        if (header === 'options' || header === 'correctOptions') {
          question[header] = value ? JSON.parse(value) : [];
        } else {
          question[header] = value;
        }
      });
      
      return question;
    });
  };

  const validateImportedQuestions = (questions) => {
    if (!Array.isArray(questions)) {
      setImportError('Imported data must be an array of questions');
      return false;
    }

    // Add validation based on question type (MCQ or Coding)
    const requiredFields = activeSection === 'mcq' 
      ? ['question', 'options', 'correctOptions'] 
      : ['title', 'description', 'problemStatement'];

    const isValid = questions.every(q => {
      return requiredFields.every(field => {
        if (!q[field]) {
          setImportError(`Missing required field: ${field}`);
          return false;
        }
        return true;
      });
    });

    return isValid;
  };

  return (
    <div className="space-y-6">
      <div className="flex space-x-4 mb-4">
        <button
          onClick={() => handleImportQuestions('csv')}
          className="flex items-center px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
        >
          <Upload className="h-4 w-4 mr-2" />
          Import from CSV
        </button>
        <button
          onClick={() => handleImportQuestions('json')}
          className="flex items-center px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
        >
          <Database className="h-4 w-4 mr-2" />
          Import from JSON
        </button>
      </div>

      {importError && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
          {importError}
        </div>
      )}

      <div className="flex space-x-4">
        <button
          onClick={() => setActiveSection('mcq')}
          className={`flex items-center px-4 py-2 rounded-lg ${
            activeSection === 'mcq'
              ? 'bg-emerald-50 text-emerald-600'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <List className="h-4 w-4 mr-2" />
          MCQ Questions
        </button>
        <button
          onClick={() => setActiveSection('coding')}
          className={`flex items-center px-4 py-2 rounded-lg ${
            activeSection === 'coding'
              ? 'bg-emerald-50 text-emerald-600'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Code className="h-4 w-4 mr-2" />
          Coding Challenges
        </button>
      </div>

      {activeSection === 'mcq' ? (
        <MCQSection testData={testData} setTestData={setTestData} />
      ) : (
        <CodingSection testData={testData} setTestData={setTestData} />
      )}
    </div>
  );
};

export default QuestionsTab; 