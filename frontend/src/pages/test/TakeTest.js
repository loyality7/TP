import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, } from 'react-router-dom';
import apiService from '../../services/api';
import MCQSection from './components/MCQSection';
import CodingSection from './components/CodingSection';
import Proctoring from './Proctoring';
import WarningModal from './components/WarningModal';
import { Clock, FileText, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Add this helper function at the top of the file
const updateLocalAnalytics = (newAnalytics) => {
  try {
    localStorage.setItem('testAnalytics', JSON.stringify(newAnalytics));
  } catch (error) {
    console.error('Error saving analytics to localStorage:', error);
  }
};

// Add this helper function at the top of the file
const getTestEndTime = () => {
  const savedEndTime = localStorage.getItem('testEndTime');
  return savedEndTime ? parseInt(savedEndTime) : null;
};

export default function TakeTest() {
  const [testId, setTestId] = useState(localStorage.getItem('currentTestId'));
  const [test, setTest] = useState(null);
  const [currentSection, setCurrentSection] = useState('mcq');
  const [answers, setAnswers] = useState({
    mcq: {},
    coding: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  // Ref to track last warning time
  const lastWarningRef = useRef(0);

  // Add new state for tracking violations
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [isWindowFocused, setIsWindowFocused] = useState(true);

  // Update analytics state to remove browserEvents
  const [analytics, setAnalytics] = useState({
    warnings: 0,
    tabSwitches: 0,
    copyPasteAttempts: 0,
    timeSpent: 0,
    mouseMoves: 0,
    keystrokes: 0,
    focusLostCount: 0,
    submissionAttempts: 0,
    score: 0,
    mcqMetrics: {
      timePerQuestion: {},
      changedAnswers: {},
      skippedQuestions: new Set(),
    },
    codingMetrics: {
      timePerChallenge: {},
      compilationAttempts: {},
      testCaseRuns: {},
      errorFrequency: {},
    },
    browser: navigator.userAgent,
    os: navigator.platform,
    device: navigator.userAgent,
    screenResolution: `${window.screen.width}x${window.screen.height}`
  });

  // Modify setAnalytics to automatically save to localStorage
  const updateAnalytics = useCallback((newData) => {
    setAnalytics(prev => {
      // Skip update if data hasn't changed
      const updatedAnalytics = typeof newData === 'function' 
        ? newData(prev) 
        : { ...prev, ...newData };
      
      // Only update if there are actual changes
      if (JSON.stringify(prev) === JSON.stringify(updatedAnalytics)) {
        return prev;
      }
      
      updateLocalAnalytics(updatedAnalytics);
      return updatedAnalytics;
    });
  }, []);

  // Load analytics from localStorage on mount
  useEffect(() => {
    try {
      const savedAnalytics = localStorage.getItem('testAnalytics');
      if (savedAnalytics) {
        const parsed = JSON.parse(savedAnalytics);
        setAnalytics(parsed);
      }
    } catch (error) {
      console.error('Error loading analytics from localStorage:', error);
    }
  }, []);

  // Simplify handleWarning to only increment warning count
  const handleWarning = useCallback((message) => {
    const now = Date.now();
    const lastWarning = lastWarningRef.current;
    const WARNING_COOLDOWN = 3000;

    if (now - lastWarning >= WARNING_COOLDOWN) {
      setWarningMessage(message);
      setShowWarningModal(true);
      lastWarningRef.current = now;

      // Update analytics
      updateAnalytics(prev => ({
        ...prev,
        warnings: prev.warnings + 1
      }));
    }
  }, [updateAnalytics]);

  // Update handleSubmit to safely use testId
  const handleSubmit = useCallback(async () => {
    try {
      const totalScore = (test?.mcqSubmission?.totalScore || 0) + 
                        (test?.codingSubmission?.totalScore || 0);

      // Send analytics data first using testId (not uuid)
      if (testId) { // Add check for testId
        try {
          await apiService.post(`analytics/test/${testId}`, {
            analyticsData: {
              warnings: analytics.warnings,
              tabSwitches: analytics.tabSwitches,
              copyPasteAttempts: analytics.copyPasteAttempts,
              timeSpent: analytics.timeSpent,
              mouseMoves: analytics.mouseMoves,
              keystrokes: analytics.keystrokes,
              focusLostCount: analytics.focusLostCount,
              submissionAttempts: analytics.submissionAttempts,
              score: totalScore,
              browser: analytics.browser,
              os: analytics.os,
              device: analytics.device,
              screenResolution: analytics.screenResolution
            }
          });
        } catch (error) {
          console.error('Failed to save analytics:', error);
          // Continue with navigation even if analytics fails
        }
      }

      // Navigate to completion page (still using uuid)
      navigate('/test/completed', { 
        state: { 
          testId: uuid,
          submission: {
            mcq: answers.mcq,
            coding: answers.coding,
            totalScore,
            testType: test?.type
          }
        }
      });
    } catch (error) {
      setError(error.message || 'Error completing test');
    }
  }, [answers, navigate, test, testId, analytics, uuid]);

  // Now the timer effect can use handleSubmit
  const [timeRemaining, setTimeRemaining] = useState(() => {
    const endTime = getTestEndTime();
    return endTime ? endTime - Date.now() : 0;
  });
  const timerRef = useRef(null);

  useEffect(() => {
    if (test && !showInstructions) {
      let endTime = getTestEndTime();
      
      if (!endTime) {
        endTime = Date.now() + (test.duration * 60 * 1000);
        localStorage.setItem('testEndTime', endTime.toString());
      }
      
      const updateTimer = () => {
        const now = Date.now();
        const remaining = endTime - now;
        
        if (remaining <= 0) {
          clearInterval(timerRef.current);
          handleSubmit();
          return;
        }
        
        setTimeRemaining(remaining);
      };

      updateTimer();
      timerRef.current = setInterval(updateTimer, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [test, showInstructions, handleSubmit]);

  // Update handleStartTest to remove camera check since it will be done beforehand
  const handleStartTest = useCallback(async () => {
    try {
      setShowInstructions(false);
      
      // Initialize test end time if not already set
      if (!getTestEndTime() && test?.duration) {
        const endTime = Date.now() + (test.duration * 60 * 1000);
        localStorage.setItem('testEndTime', endTime.toString());
      }
      
      // Request fullscreen
      try {
        await document.documentElement.requestFullscreen();
        setIsFullScreen(true);
      } catch (error) {
        toast.error('Fullscreen mode is required. Please allow fullscreen to continue.');
        return;
      }
      
    } catch (error) {
      console.error('Error starting test:', error);
      toast.error('Failed to start test. Please ensure all permissions are granted.');
    }
  }, [test]);

  // Update the useEffect for requesting permissions to run immediately when test loads
  useEffect(() => {
    const requestPermissions = async () => {
      // Only request camera if proctoring is enabled
      if (test?.proctoring) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              width: { ideal: 1280 },
              height: { ideal: 720 }
            } 
          });
          
          // Verify we actually got a video track
          if (!stream.getVideoTracks().length) {
            toast.error('No camera detected. Please connect a camera to continue.');
            setPermissionsGranted(false);
            return;
          }

          // Stop the test stream - the Proctoring component will create its own
          stream.getTracks().forEach(track => track.stop());
          setPermissionsGranted(true);
          toast.success('Camera access granted successfully!');
        } catch (error) {
          console.error('Camera access error:', error);
          setPermissionsGranted(false);
          if (error.name === 'NotAllowedError') {
            toast.error('Camera access was denied. Please allow camera access to continue.');
          } else if (error.name === 'NotFoundError') {
            toast.error('No camera detected. Please connect a camera to continue.');
          } else {
            toast.error('Failed to access camera. Please check your device settings.');
          }
        }
      } else {
        // Auto-grant permissions if proctoring is disabled
        setPermissionsGranted(true);
      }
    };

    // Request permissions as soon as test data is available
    if (test) {
      requestPermissions();
    }
  }, [test]);

  // Update the useEffect dependencies
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !showInstructions) {
        handleWarning('Switching tabs is not allowed during the test');
      }
      setIsTabVisible(!document.hidden);
    };

    const handleFocus = () => {
      setIsWindowFocused(true);
    };

    const handleBlur = () => {
      if (!showInstructions) {
        handleWarning('Leaving the test window is not allowed');
      }
      setIsWindowFocused(false);
    };

    // Detect copy/paste
    const handleCopy = (e) => {
      if (!showInstructions) {
        e.preventDefault();
        handleWarning('Copying test content is not allowed');
      }
    };

    const handlePaste = (e) => {
      if (!showInstructions) {
        e.preventDefault();
        handleWarning('Pasting content is not allowed');
      }
    };

    // Detect fullscreen exit
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !showInstructions) {
        handleWarning('Exiting fullscreen mode is not allowed');
        // Try to re-enter fullscreen
        document.documentElement.requestFullscreen().catch(() => {
          handleWarning('Please enable fullscreen to continue the test');
        });
      }
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [showInstructions, handleWarning, setIsTabVisible, setIsWindowFocused]);

  // Update loadTest function to handle nested data structure
  useEffect(() => {
    const loadTest = async () => {
      try {
        if (!uuid) {
          setError('Invalid test ID');
          return;
        }

        // Fetch the test ID using the UUID
        const parseResponse = await apiService.get(`tests/parse/${uuid}`);
        const testId = parseResponse.data.data.id;

        // Store the test ID in localStorage
        localStorage.setItem('currentTestId', testId);
        setTestId(testId);  // Update the state as well

        // Load test data directly from API
        const response = await apiService.get(`tests/${uuid}/take`);
        console.log('Test Response:', response);
        
        if (!response?.data?.data) {
          throw new Error('Invalid test data received');
        }
        
        // Extract the actual test data from the nested structure
        const testData = response.data.data;
        console.log('Test Data:', testData);
        
        // Set the test data
        setTest(testData);
        localStorage.setItem('currentTestData', JSON.stringify(testData));

      } catch (error) {
        console.error('Error in loadTest:', error);
        if (error.response?.status === 401) {
          // Store the full test URL before redirecting
          const testUrl = window.location.pathname + window.location.search;
          localStorage.setItem('redirectAfterLogin', testUrl);
          navigate('/login');
        } else {
          setError(error.message || 'Error loading test');
        }
      } finally {
        setLoading(false);
      }
    };

    loadTest();
  }, [uuid, navigate]);

  // Update the fullscreen effect with stricter controls
  useEffect(() => {
    let fullscreenAttempts = 0;
    const maxAttempts = 3;

    const forceFullscreen = async () => {
      const elem = document.documentElement;
      try {
        await elem.requestFullscreen();
        setIsFullScreen(true);
        fullscreenAttempts = 0; // Reset attempts on success
      } catch (error) {
        fullscreenAttempts++;
        if (fullscreenAttempts >= maxAttempts) {
          toast.error('WARNING: Test will be submitted if fullscreen is not enabled!');
          setTimeout(() => handleSubmit(), 5000); // Auto-submit after 5 seconds
        } else {
          handleWarning('Fullscreen mode is required! Please click "I understand" to continue.');
        }
      }
    };

    const handleFullscreenChange = () => {
      const isInFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      
      setIsFullScreen(isInFullscreen);
      
      if (!isInFullscreen && !showInstructions) {
        forceFullscreen();
      }
    };

    // Listen for keyboard ESC key
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !showInstructions) {
        e.preventDefault();
        e.stopPropagation();
        forceFullscreen();
        return false;
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    document.addEventListener('keydown', handleKeyDown, true);

    // Initial fullscreen check
    if (!document.fullscreenElement && !showInstructions) {
      forceFullscreen();
    }

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [showInstructions, handleWarning, handleSubmit]);

  const handleCodingSubmission = async (submission) => {
    try {
      // Update test state with coding submission
      setTest(prev => ({
        ...prev,
        status: 'completed',
        codingSubmission: submission,
        totalScore: (prev?.mcqSubmission?.totalScore || 0) + (submission?.totalScore || 0)
      }));

      // Navigate to completion page
      navigate('/test/completed', { 
        state: { 
          testId: uuid,
          submission: {
            mcq: answers.mcq,
            coding: answers.coding,
            totalScore: (test?.mcqSubmission?.totalScore || 0) + (submission?.totalScore || 0),
            testType: test?.type
          }
        }
      });
    } catch (error) {
      console.error('Failed to process coding submission:', error);
      setError('Failed to process coding submission');
    }
  };

  const handleMCQSubmission = async (submission) => {
    try {
      setTest(prev => ({
        ...prev,
        status: 'mcq_completed',
        mcqSubmission: submission
      }));

      // Switch to coding section
      setCurrentSection('coding');
    } catch (error) {
      setError('Failed to process MCQ submission');
    }
  };

  // Update keyboard shortcuts prevention
  useEffect(() => {
    const preventDefaultKeys = (e) => {
      // Block all Ctrl/Cmd combinations
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        handleWarning('Keyboard shortcuts are not allowed during the test');
        return false;
      }

      // Block specific keys
      const blockedKeys = [
        'F12', 'Tab', 'Alt', 'Meta', 'ContextMenu',
        'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11'
      ];
      if (blockedKeys.includes(e.key)) {
        e.preventDefault();
        handleWarning('This key is not allowed during the test');
        return false;
      }
    };

    // Prevent right-click
    const preventContextMenu = (e) => {
      e.preventDefault();
      handleWarning('Right-click is not allowed during the test');
      return false;
    };

    // Add event listeners
    document.addEventListener('keydown', preventDefaultKeys, true);
    document.addEventListener('contextmenu', preventContextMenu);

    return () => {
      document.removeEventListener('keydown', preventDefaultKeys, true);
      document.removeEventListener('contextmenu', preventContextMenu);
    };
  }, [handleWarning]);

  // Add detection for developer tools
  useEffect(() => {
    const detectDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;

      if (widthThreshold || heightThreshold) {
        handleWarning('Developer tools are not allowed during the test');
        // Force close dev tools by toggling fullscreen
        document.documentElement.requestFullscreen().catch(() => {});
      }
    };

    // Check periodically
    const interval = setInterval(detectDevTools, 1000);

    // Also check on resize
    window.addEventListener('resize', detectDevTools);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', detectDevTools);
    };
  }, [handleWarning]);

  // Update tab/window switching detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !showInstructions) {
        const now = Date.now();
        handleWarning('Warning: Tab switching detected!');
        
        updateAnalytics(prev => ({
          ...prev,
          tabSwitches: (prev.tabSwitches || 0) + 1,
          warnings: prev.warnings + 1
        }));
      }
    };

    const handleBlur = () => {
      if (!showInstructions) {
        handleWarning('Warning: Window switching detected!');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [showInstructions, handleWarning, updateAnalytics]);

  // Update timer effect to auto-submit when time expires
  useEffect(() => {
    if (test && !showInstructions) {
      let endTime = getTestEndTime();
      
      if (!endTime) {
        endTime = Date.now() + (test.duration * 60 * 1000);
        localStorage.setItem('testEndTime', endTime.toString());
      }
      
      const updateTimer = () => {
        const now = Date.now();
        const remaining = endTime - now;
        
        if (remaining <= 0) {
          clearInterval(timerRef.current);
          toast.error('Time is up!');
          return;
        }
        
        // Show warning when 5 minutes remaining
        if (remaining <= 300000 && remaining > 299000) {
          toast.warning('5 minutes remaining!');
        }
        
        // Show warning when 1 minute remaining
        if (remaining <= 60000 && remaining > 59000) {
          toast.warning('1 minute remaining!');
        }
        
        setTimeRemaining(remaining);
      };

      updateTimer();
      timerRef.current = setInterval(updateTimer, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [test, showInstructions]);

  // Add detection for tab visibility and window focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !showInstructions) {
        handleWarning('Warning: Switching tabs is not allowed');
      }
    };

    const handleBlur = () => {
      if (!showInstructions) {
        handleWarning('Warning: Leaving the test window is not allowed');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [showInstructions, handleWarning]);

  // Inside TakeTest component, add new state for confirmation dialog
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);

  // Add helper function to check if all sections are completed
  const isTestCompleted = useCallback(() => {
    return test?.mcqSubmission && test?.codingSubmission;
  }, [test]);

  // Update handleConfirmedSubmit to be more direct
  const handleConfirmedSubmit = async () => {
    setShowSubmitConfirmation(false);
    
    // Show loading toast
    const loadingToast = toast.loading('Submitting your test...');

    try {
      // Calculate total score from existing submissions
      const totalScore = (test?.mcqSubmission?.totalScore || 0) + 
                        (test?.codingSubmission?.totalScore || 0);

      // Submit analytics
      if (testId) {
        try {
          await apiService.post(`analytics/test/${testId}`, {
            analyticsData: {
              ...analytics,
              timeSpent: Math.floor((Date.now() - new Date(localStorage.getItem('testStartTime'))) / 1000),
              endTime: new Date().toISOString(),
              testStatus: 'completed',
              finalScore: totalScore,
              submissionType: 'manual'
            }
          });
        } catch (error) {
          console.error('Analytics submission error:', error);
          // Continue even if analytics fails
        }
      }

      // Clear all test-related localStorage items
      localStorage.removeItem('testEndTime');
      localStorage.removeItem('testAnalytics');
      localStorage.removeItem('mcq_answers');
      localStorage.removeItem('coding_answers');
      localStorage.removeItem('currentTestId');
      localStorage.removeItem('currentTestData');

      // Exit fullscreen if active
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }

      // Remove event listeners by updating showInstructions
      setShowInstructions(true);

      // Dismiss loading toast
      toast.dismiss(loadingToast);
      toast.success('Test submitted successfully!');

      // Force navigation to completion page
      window.location.href = `/test/completed`;
      window.location.reload(true); // Force reload from server, not cache


    } catch (error) {
      console.error('Final submission error:', error);
      toast.dismiss(loadingToast);
      toast.error('An error occurred during submission. Please try again.');
    }
  };

  // Update handleFinalSubmitClick to be more direct
  const handleFinalSubmitClick = useCallback(() => {
    setShowSubmitConfirmation(true);
    
    // Optional: Show warning toast if sections are incomplete
    if (!isTestCompleted()) {
      toast(
        <div className="flex flex-col gap-2">
          <p className="font-semibold">Warning: Incomplete Test!</p>
          <p className="text-sm">Please complete all sections before submitting:</p>
          <ul className="list-disc list-inside text-sm">
            {!test?.mcqSubmission && <li>MCQ section not completed</li>}
            {!test?.codingSubmission && <li>Coding section not completed</li>}
          </ul>
          <p className="text-sm mt-2">Submitting now will result in loss of marks.</p>
        </div>,
        {
          duration: 5000,
          icon: '⚠️',
          style: {
            background: '#FEF2F2',
            color: '#991B1B',
            border: '1px solid #EF4444',
          }
        }
      );
    }
  }, [test, isTestCompleted]);

  // Update handleAnswerUpdate to be more selective about analytics updates
  const handleAnswerUpdate = useCallback((section, newAnswers) => {
    setAnswers(prev => {
      // Skip update if answers haven't changed
      if (JSON.stringify(prev[section]) === JSON.stringify(newAnswers)) {
        return prev;
      }
      return {
        ...prev,
        [section]: newAnswers
      };
    });

    // Only update analytics when necessary
    if (section === 'mcq') {
      updateAnalytics(prev => ({
        ...prev,
        mcqMetrics: {
          ...prev.mcqMetrics,
          changedAnswers: {
            ...prev.mcqMetrics.changedAnswers,
            [Date.now()]: Object.keys(newAnswers).length
          }
        }
      }));
    } else if (section === 'coding') {
      updateAnalytics(prev => ({
        ...prev,
        codingMetrics: {
          ...prev.codingMetrics,
          lastUpdate: Date.now(),
          totalUpdates: (prev.codingMetrics.totalUpdates || 0) + 1
        }
      }));
    }
  }, [updateAnalytics]);

  const handleSetAnalytics = useCallback((newAnalytics) => {
    setAnalytics(newAnalytics);
  }, []); // Empty dependency array since this function doesn't depend on any values

  // Update the warning modal close handler
  const handleWarningModalClose = useCallback(() => {
    setShowWarningModal(false);
    
    // Force fullscreen when warning modal is closed
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        toast.error('Fullscreen is required to continue the test');
      });
    }
  }, []);

  // Render Loading State
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Render Error State
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // Render Instructions
  if (showInstructions) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-2xl w-full p-8 bg-white rounded-lg shadow-lg">
          {test && (
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-center">{test.title}</h1>
              <div className="mt-4 space-y-2 text-gray-600">
                <p className="text-center">{test.description}</p>
                <div className="flex justify-between text-sm">
                  <p>Duration: {test.duration} minutes</p>
                  <p>Total Marks: {test.totalMarks}</p>
                </div>
                <div className="flex justify-between text-sm">
                  <p>MCQs: {test.mcqs?.length || 0}</p>
                  <p>Coding Questions: {test.codingChallenges?.length || 0}</p>
                </div>
              </div>
            </div>
          )}

          <h2 className="text-2xl font-bold text-center mb-6">Test Instructions</h2>
          
          <div className="space-y-4 mb-8">
            <p className="text-lg font-semibold text-gray-700">Before you begin:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Ensure you are in a quiet environment</li>
              <li>Close all other applications and browser tabs</li>
              {test?.proctoring && (
                <li className="font-medium text-blue-600">
                  Your camera must remain on throughout the test
                </li>
              )}
              <li>Switching tabs or applications is not allowed</li>
              <li>The test must be completed in full-screen mode</li>
              {test?.proctoring && (
                <li className="font-medium text-blue-600">
                  Multiple faces in camera view will be flagged
                </li>
              )}
            </ul>
          </div>

          {test?.proctoring && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h2 className="text-lg font-semibold text-blue-800 mb-2">
                Camera Access Required
              </h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <svg 
                    className={`w-6 h-6 ${permissionsGranted ? 'text-green-500' : 'text-red-500'}`}
                    fill="none" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="ml-2">
                    Camera Status: {permissionsGranted ? 'Active' : 'Not Active'}
                  </span>
                </div>
                
                {!permissionsGranted && (
                  <>
                    <button
                      onClick={async () => {
                        try {
                          const stream = await navigator.mediaDevices.getUserMedia({ 
                            video: { 
                              width: { ideal: 1280 },
                              height: { ideal: 720 }
                            } 
                          });
                          
                          if (stream.getVideoTracks().length) {
                            setPermissionsGranted(true);
                            // Stop the test stream - Proctoring component will create its own
                            stream.getTracks().forEach(track => track.stop());
                            toast.success('Camera access granted successfully!');
                          }
                        } catch (error) {
                          console.error('Camera access error:', error);
                          toast.error(
                            error.name === 'NotAllowedError' 
                              ? 'Camera access denied. Please allow camera access to continue.'
                              : 'Failed to access camera. Please check your device settings.'
                          );
                        }
                      }}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Enable Camera Access
                    </button>
                    <p className="text-sm text-red-600">
                      ⚠️ Camera access is required for this proctored test. You must enable your camera to continue.
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="text-center">
            <button
              onClick={handleStartTest}
              disabled={test?.proctoring && !permissionsGranted}
              className={`
                px-6 py-3 text-lg font-semibold rounded-lg transition-all
                ${(!test?.proctoring || permissionsGranted)
                  ? 'bg-blue-600 text-white hover:bg-blue-700 transform hover:scale-105' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'}
              `}
            >
              {test?.proctoring && !permissionsGranted 
                ? 'Camera Access Required' 
                : 'Start Test'}
            </button>
            
            {test?.proctoring && !permissionsGranted && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 font-medium">
                  Camera access is required to start this proctored test
                </p>
                <p className="text-xs text-red-500 mt-1">
                  Please enable your camera using the button above
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render Test Sections
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header with integrated proctoring */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-start py-3">
            {/* Test Info */}
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {test?.title || 'Loading test...'}
              </h1>
              {test && (
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex items-center text-gray-600 text-sm">
                    <Clock className="w-4 h-4 mr-1" />
                    <span className="font-mono">
                      {Math.floor(timeRemaining / (1000 * 60 * 60)).toString().padStart(2, '0')}:
                      {Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0')}:
                      {Math.floor((timeRemaining % (1000 * 60)) / 1000).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600 text-sm">
                    <FileText className="w-4 h-4 mr-1" />
                    <span>{test.totalMarks} marks</span>
                  </div>
                  {/* Add status indicators */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`px-2 py-1 rounded ${isFullScreen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {isFullScreen ? 'Fullscreen' : 'Not Fullscreen'}
                    </span>
                    <span className={`px-2 py-1 rounded ${isTabVisible ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {isTabVisible ? 'Tab Active' : 'Tab Inactive'}
                    </span>
                    <span className={`px-2 py-1 rounded ${isWindowFocused ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {isWindowFocused ? 'Window Focused' : 'Window Unfocused'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Add Submit button before the camera */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleFinalSubmitClick}
                className="px-4 py-2 flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                <CheckCircle className="w-5 h-5" />
                Final Submit
              </button>
              
              {/* Existing camera div */}
              <div className="w-[180px] h-[135px] bg-black rounded-lg overflow-hidden shadow-lg">
                <Proctoring
                  testId={uuid}
                  onWarning={(message) => {
                    setWarningMessage(message);
                    setShowWarningModal(true);
                  }}
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>

          {/* Section Tabs - Made more compact */}
          <div className="flex space-x-1 mt-2">
            <button
              className={`px-4 py-2 text-sm rounded-t-lg font-medium transition-all relative
                ${currentSection === 'mcq' 
                  ? 'text-blue-600 bg-white border-t-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-800'
                }`}
              onClick={() => setCurrentSection('mcq')}
            >
              Multiple Choice Questions
              <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-gray-100">
                {test.mcqs?.length || 0}
              </span>
            </button>
            <button
              className={`px-4 py-2 text-sm rounded-t-lg font-medium transition-all relative
                ${currentSection === 'coding' 
                  ? 'text-blue-600 bg-white border-t-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-800'
                }`}
              onClick={() => setCurrentSection('coding')}
            >
              Coding Challenges
              <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-gray-100">
                {test.codingChallenges?.length || 0}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow flex">
        <div className="w-full px-0">
          {currentSection === 'mcq' ? (
            <MCQSection
              mcqs={test?.mcqs || []}
              answers={answers.mcq}
              setAnswers={(mcqAnswers) => handleAnswerUpdate('mcq', mcqAnswers)}
              onSubmitMCQs={handleMCQSubmission}
              analytics={analytics}
              setAnalytics={updateAnalytics}
            />
          ) : (
            <CodingSection
              challenges={test?.codingChallenges || []}
              answers={answers.coding}
              setAnswers={(codingAnswers) => handleAnswerUpdate('coding', codingAnswers)}
              onSubmitCoding={handleCodingSubmission}
              testId={uuid}
              analytics={analytics}
              setAnalytics={handleSetAnalytics}
            />
          )}
        </div>
      </div>

      {/* Footer - Removed progress tracking */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-3">
          {/* Empty footer - can be removed if not needed */}
        </div>
      </div>

      {showWarningModal && (
        <WarningModal
          message={warningMessage}
          warningCount={analytics.warnings}
          onClose={handleWarningModalClose}
        />
      )}

      {showSubmitConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Ready to Submit?</h3>
            <div className="space-y-4 mb-6">
              <p className="text-gray-600">
                You have completed:
              </p>
              <ul className="list-none space-y-2">
                <li className="flex items-center">
                  <CheckCircle 
                    className={`w-5 h-5 mr-2 ${test?.mcqSubmission ? 'text-green-500' : 'text-gray-300'}`}
                  />
                  <span>MCQ Section</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle 
                    className={`w-5 h-5 mr-2 ${test?.codingSubmission ? 'text-green-500' : 'text-gray-300'}`}
                  />
                  <span>Coding Section</span>
                </li>
              </ul>
              <p className="text-sm text-gray-500 mt-4">
                This action cannot be undone. Are you sure you want to submit?
              </p>
            </div>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowSubmitConfirmation(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmedSubmit}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Confirm Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 