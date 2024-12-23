import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export function NetworkSpeed({ onTestComplete }) {
  const [testing, setTesting] = useState(false);
  const [speed, setSpeed] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const testSpeed = async () => {
      setTesting(true);
      setError(null);
      
      try {
        // Create a large array of data (about 1MB)
        const dataSize = 1024 * 1024; // 1MB in bytes
        const data = new Array(dataSize).fill('a').join('');
        
        const startTime = performance.now();
        
        // Simulate network test by encoding/decoding data
        const blob = new Blob([data]);
        await blob.text();
        
        const endTime = performance.now();
        
        // Calculate speed in Mbps
        const duration = (endTime - startTime) / 1000; // seconds
        const bitsTransferred = dataSize * 8;
        const speedMbps = ((bitsTransferred / duration) / 1024 / 1024).toFixed(2);
        
        setSpeed(parseFloat(speedMbps));
        onTestComplete(parseFloat(speedMbps));
      } catch (err) {
        console.error('Network test error:', err);
        setError('Failed to test network speed');
        onTestComplete(0);
      } finally {
        setTesting(false);
      }
    };

    testSpeed();
  }, [onTestComplete]);

  return (
    <div className="space-y-4">
      {testing ? (
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Testing network speed...</span>
        </div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : speed !== null && (
        <div className="text-center">
          <div className="text-3xl font-bold mb-2">
            {speed} Mbps
          </div>
          <div className={`text-sm ${speed >= 1 ? 'text-green-600' : 'text-red-600'}`}>
            {speed >= 1 
              ? 'Network speed is sufficient' 
              : 'Network speed is too low'}
          </div>
        </div>
      )}
    </div>
  );
} 