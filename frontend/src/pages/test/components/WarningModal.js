import React from 'react';

export default function WarningModal({ message, warningCount, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold text-red-600 mb-4">Warning!</h2>
        <p className="mb-4">{message}</p>
        <p className="text-sm text-gray-600 mb-4">
          Warning count: {warningCount}
        </p>
        <button
          onClick={onClose}
          className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
        >
          I Understand
        </button>
      </div>
    </div>
  );
} 