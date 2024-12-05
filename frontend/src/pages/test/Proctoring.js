import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { AlertTriangle, Camera } from 'lucide-react';

const WARNING_COOLDOWN = 5000; // 5 seconds between warnings
const FACE_POSITION_THRESHOLD = 0.2; // 20% movement threshold

export default function Proctoring({ 
  className, 
  onFaceDetectionAlert, 
  onDeviceDetectionAlert 
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const lastWarningRef = useRef(Date.now());
  const lastFacePositionRef = useRef(null);
  const detectorRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let detectionInterval;
    let isDetecting = false;

    const initializeProctoring = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 320 },
            height: { ideal: 240 },
            facingMode: 'user',
            frameRate: { ideal: 15 }
          } 
        });
        
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        detectorRef.current = new faceapi.FaceDetector({
          inputSize: 320,
          scoreThreshold: 0.9
        });

        setIsInitialized(true);
        detectionInterval = setInterval(detectAll, 2000);
      } catch (err) {
        setError(err.message);
        console.error('Proctoring initialization error:', err);
        onFaceDetectionAlert('Failed to initialize proctoring system. Please check your camera permissions.');
      }
    };

    const detectAll = async () => {
      if (!videoRef.current || !isInitialized || !detectorRef.current || isDetecting) return;

      try {
        isDetecting = true;
        if (videoRef.current.readyState !== 4 || !videoRef.current.videoWidth) {
          console.log('Video not ready yet');
          return;
        }

        const detections = await detectorRef.current.detectAllFaces(videoRef.current);

        const now = Date.now();
        
        if (now - lastWarningRef.current >= WARNING_COOLDOWN) {
          if (detections.length === 0) {
            lastWarningRef.current = now;
            if (onFaceDetectionAlert) onFaceDetectionAlert('No face detected in camera view');
          } else if (detections.length > 1) {
            lastWarningRef.current = now;
            if (onFaceDetectionAlert) onFaceDetectionAlert('Multiple faces detected in camera view');
          } else {
            const face = detections[0];
            const centerX = face.box.xCenter / videoRef.current.videoWidth;
            const centerY = face.box.yCenter / videoRef.current.videoHeight;

            if (lastFacePositionRef.current) {
              const [lastX, lastY] = lastFacePositionRef.current;
              const dx = Math.abs(centerX - lastX);
              const dy = Math.abs(centerY - lastY);

              if (dx > FACE_POSITION_THRESHOLD || dy > FACE_POSITION_THRESHOLD) {
                lastWarningRef.current = now;
                if (onFaceDetectionAlert) onFaceDetectionAlert('Face movement detected');
              }
            }

            lastFacePositionRef.current = [centerX, centerY];
          }

          const electronicDevices = detections.filter(detection => 
            ['cell phone', 'laptop', 'remote', 'keyboard', 'mouse', 'tv', 'monitor']
            .includes(detection.class.toLowerCase())
          );

          if (electronicDevices.length > 0) {
            lastWarningRef.current = now;
            if (onDeviceDetectionAlert) onDeviceDetectionAlert(`Electronic device detected: ${electronicDevices.map(d => d.class).join(', ')}`);
          }

          console.log('Face detections:', detections);
        }
      } catch (err) {
        console.error('Detection error:', err);
        if (onFaceDetectionAlert) onFaceDetectionAlert('Detection error: ' + err.message);
      } finally {
        isDetecting = false;
      }
    };

    initializeProctoring();

    return () => {
      if (detectionInterval) {
        clearInterval(detectionInterval);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isInitialized, onFaceDetectionAlert, onDeviceDetectionAlert]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play();
      };
    }
  }, []);

  return (
    <div className={`relative ${className}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)' }}
      />
      <div className="absolute top-2 right-2 flex items-center gap-2 bg-black/50 p-2 rounded">
        <Camera className="w-4 h-4 text-white" />
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-xs text-white">Recording</span>
      </div>
      {error && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-yellow-500" />
            <p className="text-white text-sm text-center px-2">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}