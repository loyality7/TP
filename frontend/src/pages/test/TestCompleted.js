import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function TestCompleted() {
  const location = useLocation();
  const { sessionId } = location.state || {};

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Test Completed!</h1>
        </div>
        
        <p className="text-gray-600 mb-8">
          Thank you for completing the test. Your responses have been submitted successfully.
          {sessionId ? (
            <span className="block mt-2">Session ID: {sessionId}</span>
          ) : (
            <span className="block mt-2 text-yellow-600">
              If your session ended due to technical issues or you encountered any problems, 
              please contact our support team at sarath@hysteresis.in
            </span>
          )}
        </p>

        <div className="space-x-4">
          <Link
            to="/dashboard/user"
            className="inline-block bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700"
          >
            Return to Dashboard
          </Link>
          
          <Link
            to={`/dashboard/user`}
            className="inline-block bg-gray-100 text-gray-700 py-2 px-6 rounded hover:bg-gray-200"
          >
            View Results
          </Link>
        </div>
      </div>
    </div>
  );
} 