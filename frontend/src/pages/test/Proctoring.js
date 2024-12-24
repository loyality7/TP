import React, { useEffect, useRef, useState } from 'react';
import { FaceDetection } from '@mediapipe/face_detection';
import { Camera } from '@mediapipe/camera_utils';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

export default function Proctoring({ className }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [warning, setWarning] = useState(null);
  const [faceCount, setFaceCount] = useState(0);
  const [devicesDetected, setDevicesDetected] = useState(0);

  useEffect(() => {
    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement.getContext('2d');
    let objectDetector = null;

    // Initialize COCO-SSD Object Detector
    cocoSsd.load().then((detector) => {
      objectDetector = detector;
      console.log('COCO-SSD model loaded.');
    });

    // Initialize MediaPipe Face Detection
    const faceDetection = new FaceDetection({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`;
      },
    });

    faceDetection.setOptions({
      model: 'short', // 'short' or 'full'
      minDetectionConfidence: 0.5,
    });

    faceDetection.onResults(onResults);

    function onResults(results) {
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      canvasCtx.drawImage(
        results.image,
        0,
        0,
        canvasElement.width,
        canvasElement.height
      );

      // Handle Face Detection
      if (results.detections) {
        const numFaces = results.detections.length;
        setFaceCount(numFaces);

        // Draw face bounding boxes
        results.detections.forEach((detection) => {
          const boundingBox = detection.boundingBox;
          canvasCtx.strokeStyle = 'red';
          canvasCtx.lineWidth = 2;
          canvasCtx.strokeRect(
            boundingBox.xMin * canvasElement.width,
            boundingBox.yMin * canvasElement.height,
            (boundingBox.xMax - boundingBox.xMin) * canvasElement.width,
            (boundingBox.yMax - boundingBox.yMin) * canvasElement.height
          );
        });

        // Set warnings based on face count
        if (numFaces === 0) {
          setWarning('No face detected');
        } else if (numFaces > 1) {
          setWarning('Multiple faces detected');
        } else {
          setWarning(null);
        }
      } else {
        setWarning('No face detected');
        setFaceCount(0);
      }

      // Handle Object Detection (Electronic Devices)
      if (objectDetector && results.image) {
        objectDetector.detect(results.image).then((predictions) => {
          const deviceClasses = ['cell phone', 'tablet'];
          const detectedDevices = predictions.filter((pred) =>
            deviceClasses.includes(pred.class)
          );
          setDevicesDetected(detectedDevices.length);

          // Draw bounding boxes for devices
          detectedDevices.forEach((device) => {
            canvasCtx.strokeStyle = 'blue';
            canvasCtx.lineWidth = 2;
            canvasCtx.strokeRect(
              device.bbox[0],
              device.bbox[1],
              device.bbox[2],
              device.bbox[3]
            );

            // Optionally, display device labels
            canvasCtx.font = '18px Arial';
            canvasCtx.fillStyle = 'blue';
            canvasCtx.fillText(
              device.class,
              device.bbox[0],
              device.bbox[1] > 20 ? device.bbox[1] - 5 : device.bbox[1] + 20
            );
          });

          // Set warnings based on device detection
          if (detectedDevices.length > 0) {
            setWarning('Electronic device detected');
          }
        });
      }

      canvasCtx.restore();
    }

    const camera = new Camera(videoElement, {
      onFrame: async () => {
        await faceDetection.send({ image: videoElement });
      },
      width: 640,
      height: 480,
    });
    camera.start();

    return () => {
      camera.stop();
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <video
        ref={videoRef}
        width="640"
        height="480"
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        width="640"
        height="480"
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        className="w-full h-full"
      />
      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2 flex justify-between">
        <div>👤 : {faceCount}</div>
        <div>📱 : {devicesDetected}</div>
      </div>
      {warning && (
        <div className="absolute top-0 left-0 right-0 bg-black/70 text-white p-2 text-center">
          {warning}
        </div>
      )}
    </div>
  );
}