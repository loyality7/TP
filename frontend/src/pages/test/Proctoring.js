import React, { useEffect, useRef, useState } from 'react';
import * as faceDetection from '@tensorflow-models/face-detection';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

export default function Proctoring({  onWarning, className }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const objectDetectorRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  const lastWarningRef = useRef(Date.now());
  const WARNING_COOLDOWN = 3000;
  const DETECTION_INTERVAL = 2000;
  const FACE_POSITION_THRESHOLD = 0.2;
  const lastFacePositionRef = useRef(null);

  useEffect(() => {
    let detectionInterval;
    let isDetecting = false;

    const initializeProctoring = async () => {
      try {
        await tf.ready();
        await tf.setBackend('webgl');
        
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

        detectorRef.current = await faceDetection.createDetector(faceDetection.SupportedModels.MediaPipeFaceDetector, {
          runtime: 'tfjs',
        });
        setIsInitialized(true);

        objectDetectorRef.current = await cocoSsd.load();
        
        detectionInterval = setInterval(detectAll, DETECTION_INTERVAL);
      } catch (err) {
        console.error('Proctoring initialization error:', err);
        setError(err.message);
        onWarning('Failed to initialize proctoring system. Please check your camera permissions.');
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

        const [faceDetections, objectDetections] = await Promise.all([
          detectorRef.current.estimateFaces(videoRef.current),
          objectDetectorRef.current.detect(videoRef.current)
        ]);

        const now = Date.now();
        
        if (now - lastWarningRef.current >= WARNING_COOLDOWN) {
          if (faceDetections.length === 0) {
            lastWarningRef.current = now;
            if (onWarning) onWarning('No face detected in camera view');
          } else if (faceDetections.length > 1) {
            lastWarningRef.current = now;
            if (onWarning) onWarning('Multiple faces detected in camera view');
          } else {
            const face = faceDetections[0];
            const centerX = face.box.xCenter / videoRef.current.videoWidth;
            const centerY = face.box.yCenter / videoRef.current.videoHeight;

            if (lastFacePositionRef.current) {
              const [lastX, lastY] = lastFacePositionRef.current;
              const dx = Math.abs(centerX - lastX);
              const dy = Math.abs(centerY - lastY);

              if (dx > FACE_POSITION_THRESHOLD || dy > FACE_POSITION_THRESHOLD) {
                lastWarningRef.current = now;
                if (onWarning) onWarning('Face movement detected');
              }
            }

            lastFacePositionRef.current = [centerX, centerY];
          }

          const electronicDevices = objectDetections.filter(detection => 
            ['cell phone', 'laptop', 'remote', 'keyboard', 'mouse', 'tv', 'monitor']
            .includes(detection.class.toLowerCase())
          );

          if (electronicDevices.length > 0) {
            lastWarningRef.current = now;
            if (onWarning) onWarning(`Electronic device detected: ${electronicDevices.map(d => d.class).join(', ')}`);
          }

          console.log('Face detections:', faceDetections);
          console.log('Object detections:', objectDetections);
        }
      } catch (err) {
        console.error('Detection error:', err);
        if (onWarning) onWarning('Detection error: ' + err.message);
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
  }, [isInitialized, onWarning]);

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
      <div className="absolute top-2 right-2 flex items-center">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-1" />
        <span className="text-xs text-white">Recording</span>
      </div>
      {error && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <p className="text-white text-sm text-center px-2">{error}</p>
        </div>
      )}
    </div>
  );
}