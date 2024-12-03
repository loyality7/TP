import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function SessionExpiredModal({ testId }) {
  const navigate = useNavigate();

  const handleRegisterAgain = () => {
    navigate(`/test/shared/${testId}`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Session Expired</h2>
        <p className="text-gray-600 mb-6">
          Your test session has expired or been ended. You will need to register again to continue.
        </p>
        <button
          onClick={handleRegisterAgain}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          Register Again
        </button>
      </div>
    </div>
  );
} 