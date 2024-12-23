import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { AlertTriangle } from 'lucide-react';

export default function WarningModal({ message, warningCount, onClose, onUnderstand }) {
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    if (message.toLowerCase().includes('fullscreen')) {
      setCountdown(5);
      
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            if (!document.fullscreenElement) {
              toast.error('Test will be submitted due to fullscreen violation!', {
                duration: 3000,
              });
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [message]);

  const handleUnderstand = async () => {
    try {
      if (message.toLowerCase().includes('fullscreen')) {
        await document.documentElement.requestFullscreen();
        if (!document.fullscreenElement) {
          toast.error('You must enable fullscreen to continue the test', {
            duration: 5000,
          });
          return;
        }
      }
      
      if (onUnderstand) {
        onUnderstand();
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
      toast.error('You must enable fullscreen to continue the test. Please check your browser settings.', {
        duration: 5000,
      });
    }
  };

  const getWarningMessage = () => {
    if (message.toLowerCase().includes('fullscreen')) {
      return (
        <div className="space-y-2">
          <p className="text-gray-700 font-medium">{message}</p>
          <p className="text-sm text-red-600">
            ⚠️ Your test will be automatically submitted if you don't enable fullscreen mode!
          </p>
        </div>
      );
    }
    return <p className="text-gray-700">{message}</p>;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          <h3 className="text-xl font-bold text-red-600">Warning!</h3>
        </div>

        <div className="space-y-4">
          {getWarningMessage()}
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700">
              Warning count: <span className="font-bold">{warningCount}/3</span>
            </p>
            {warningCount >= 2 && (
              <p className="text-sm text-red-700 mt-2">
                ⚠️ One more warning will result in automatic test submission!
              </p>
            )}
          </div>

          {countdown !== null && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-700 font-medium">
                ⚠️ Please enter fullscreen mode within {countdown} seconds or your test will be submitted automatically!
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={handleUnderstand}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            I understand
            {countdown !== null && <span className="text-sm">({countdown}s)</span>}
          </button>
        </div>
      </div>
    </div>
  );
} 