import React from 'react';
import { toast } from 'react-hot-toast';

export default function WarningModal({ message, warningCount, onClose }) {
  const handleUnderstand = () => {
    document.documentElement.requestFullscreen().catch(() => {
      toast.error('Fullscreen mode is required to continue');
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold text-red-600 mb-4">Warning!</h3>
        <p className="text-gray-700 mb-4">{message}</p>
        <p className="text-sm text-gray-500 mb-6">
          Warning count: {warningCount}/3
        </p>
        <div className="flex justify-end">
          <button
            onClick={handleUnderstand}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
} 