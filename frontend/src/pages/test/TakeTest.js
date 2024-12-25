import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, } from 'react-router-dom';
import apiService from '../../services/api';
import MCQSection from './components/MCQSection';
import CodingSection from './components/CodingSection';
import Proctoring from './Proctoring';
import WarningModal from './components/WarningModal';
import { 
  FileText, 
  Camera,
  Wifi,
  Maximize,
  Play,
  ArrowRight,
  CheckCircle,
  Clock // Add any other icons you need
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Progress } from './components/Progress';
import { NetworkSpeed } from './components/NetworkSpeed';

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

// Add these steps configuration
const SETUP_STEPS = [
  { label: 'Test Details', icon: FileText },
  { label: 'Camera Setup', icon: Camera },
  { label: 'Network Test', icon: Wifi },
  { label: 'Full Screen', icon: Maximize },
  { label: 'Start Test', icon: Play }
];

// Update FullscreenButton component
const FullscreenButton = ({ isFullScreen, setIsFullScreen }) => {
  const handleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullScreen(true);
      }
    } catch (error) {
      toast.error('Failed to enter fullscreen mode');
    }
  };

  if (isFullScreen) {
    return null;
  }

  return (
    <button
      onClick={handleFullscreen}
      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center gap-1.5 transition-colors"
    >
      <Maximize className="w-4 h-4" />
      Fullscreen
    </button>
  );
};

// Add this helper function at the top
const forceFullscreen = async () => {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      return true;
    }
    return document.fullscreenElement !== null;
  } catch (error) {
    console.error('Fullscreen error:', error);
    return false;
  }
};

// Add this helper function at the top
const requestAndLockFullscreen = async () => {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      return true;
    }
    return document.fullscreenElement !== null;
  } catch (error) {
    console.error('Fullscreen error:', error);
    return false;
  }
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
    const WARNING_COOLDOWN = 5000;

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
      
      // If no end time is set, initialize it
      if (!endTime) {
        endTime = Date.now() + (test.duration * 60 * 1000);
        localStorage.setItem('testEndTime', endTime.toString());
      }
      
      const updateTimer = async () => {
        const now = Date.now();
        const remaining = endTime - now;
        
        if (remaining <= 0) {
          clearInterval(timerRef.current);
          toast.error('Time is up!');
          
          try {
            // Update test status to completed
            await apiService.post('submissions/update-status', {
              testId: testId,
              status: 'completed'
            });

            // Calculate final analytics
            const finalAnalytics = {
              ...analytics,
              timeSpent: test.duration * 60, // Total duration in seconds
              endTime: new Date().toISOString(),
              testStatus: 'completed',
              submissionType: 'auto',
              totalScore: (test?.mcqSubmission?.totalScore || 0) + (test?.codingSubmission?.totalScore || 0)
            };

            // Submit analytics
            if (testId) {
              await apiService.post(`analytics/test/${testId}`, {
                analyticsData: finalAnalytics
              });
            }

            // Clear all test-related localStorage items
            const itemsToClear = [
              'testEndTime',
              'testAnalytics',
              'mcq_answers',
              'coding_answers',
              'currentMcqIndex',
              'currentTestId',
              'currentTestData',
              'submissionId',
              'testStarted',
              'testStartTime'
            ];
            itemsToClear.forEach(item => localStorage.removeItem(item));

            // Navigate to completion page
            navigate('/test/completed', { 
              state: { 
                testId: uuid,
                submission: {
                  mcq: answers.mcq,
                  coding: answers.coding,
                  totalScore: finalAnalytics.totalScore,
                  testType: test?.type,
                  submissionType: 'auto'
                }
              },
              replace: true
            });
          } catch (error) {
            console.error('Error handling test completion:', error);
            toast.error('Error submitting test. Please contact support.');
          }
          
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
        
        setTimeRemaining(Math.max(0, remaining)); // Ensure time never goes negative
      };

      updateTimer(); // Run immediately
      timerRef.current = setInterval(updateTimer, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [test, showInstructions, testId, uuid, analytics, answers, navigate]);

  // Add new state to track if test has been started
  const [hasStartedTest, setHasStartedTest] = useState(() => {
    return localStorage.getItem('testStarted') === 'true';
  });

  // Update handleStartTest to initialize test start time
  const handleStartTest = useCallback(async () => {
    try {
      setShowInstructions(false);
      localStorage.setItem('testStarted', 'true');
      setHasStartedTest(true);
      
      // Initialize test end time and start time
      if (!getTestEndTime() && test?.duration) {
        const startTime = Date.now();
        const endTime = startTime + (test.duration * 60 * 1000);
        localStorage.setItem('testEndTime', endTime.toString());
        localStorage.setItem('testStartTime', startTime.toString());
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
            return;
          }

          // Stop the test stream - the Proctoring component will create its own
          stream.getTracks().forEach(track => track.stop());
          toast.success('Camera access granted successfully!');
        } catch (error) {
          console.error('Camera access error:', error);
          if (error.name === 'NotAllowedError') {
            toast.error('Camera access was denied. Please allow camera access to continue.');
          } else if (error.name === 'NotFoundError') {
            toast.error('No camera detected. Please connect a camera to continue.');
          } else {
            toast.error('Failed to access camera. Please check your device settings.');
          }
        }
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

  // Add this new effect for persistent fullscreen enforcement
  useEffect(() => {
    if (!showInstructions && hasStartedTest) {
      let fullscreenAttempts = 0;
      const maxAttempts = 3;
      
      const enforceFullscreen = async () => {
        if (!document.fullscreenElement) {
          fullscreenAttempts++;
          const success = await forceFullscreen();
          
          if (!success && fullscreenAttempts >= maxAttempts) {
            toast.error('Fullscreen is required. Test will be submitted.');
            handleSubmit();
            return;
          }
        } else {
          fullscreenAttempts = 0;
        }
      };

      // Check fullscreen status frequently
      const fullscreenInterval = setInterval(enforceFullscreen, 1000);

      // Also check on visibility change
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          enforceFullscreen();
        }
      };

      // Check on focus
      const handleFocus = () => {
        enforceFullscreen();
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleFocus);
      document.addEventListener('fullscreenchange', enforceFullscreen);

      return () => {
        clearInterval(fullscreenInterval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleFocus);
        document.removeEventListener('fullscreenchange', enforceFullscreen);
      };
    }
  }, [showInstructions, hasStartedTest, handleSubmit]);

  // Update the useEffect for page load/reload
  useEffect(() => {
    const testStarted = localStorage.getItem('testStarted') === 'true';
    
    if (testStarted) {
      setHasStartedTest(true);
      setShowInstructions(false);
      
      // Immediate fullscreen enforcement on load/reload
      const enforceFullscreenOnLoad = async () => {
        // Try multiple times with delay if needed
        let attempts = 0;
        const maxAttempts = 3;
        
        const tryFullscreen = async () => {
          try {
            if (!document.fullscreenElement) {
              await document.documentElement.requestFullscreen();
              setIsFullScreen(true);
            }
            return true;
          } catch (error) {
            console.error('Fullscreen attempt failed:', error);
            return false;
          }
        };

        const attemptFullscreen = async () => {
          if (attempts < maxAttempts) {
            attempts++;
            const success = await tryFullscreen();
            if (!success && attempts < maxAttempts) {
              // Wait 500ms before next attempt
              setTimeout(attemptFullscreen, 500);
            } else if (!success) {
              toast.error('Failed to enter fullscreen mode. Test may be submitted.');
              // Optionally force submit if fullscreen fails
              window.dispatchEvent(new CustomEvent('forceTestSubmit'));
            }
          }
        };

        attemptFullscreen();
      };
      
      // Execute immediately and also after a slight delay to ensure DOM is ready
      enforceFullscreenOnLoad();
      setTimeout(enforceFullscreenOnLoad, 1000);
    }
  }, []);

  // Update the fullscreen enforcement effect to be more aggressive
  useEffect(() => {
    if (!showInstructions && hasStartedTest) {
      let fullscreenCheckInterval;
      let failedAttempts = 0;
      const MAX_ATTEMPTS = 3;
      const CHECK_INTERVAL = 100; // Check every 100ms

      const enforceFullscreen = async () => {
        if (!document.fullscreenElement) {
          failedAttempts++;
          try {
            await document.documentElement.requestFullscreen();
            failedAttempts = 0; // Reset counter on success
            setIsFullScreen(true);
          } catch (error) {
            console.error('Fullscreen enforcement failed:', error);
            if (failedAttempts >= MAX_ATTEMPTS) {
              clearInterval(fullscreenCheckInterval);
              toast.error('Fullscreen mode required. Test will be submitted.');
              window.dispatchEvent(new CustomEvent('forceTestSubmit'));
            }
          }
        }
      };

      // Initial enforcement
      enforceFullscreen();
      
      // Continuous checking
      fullscreenCheckInterval = setInterval(enforceFullscreen, CHECK_INTERVAL);

      // Also enforce on visibility change
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          enforceFullscreen();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        clearInterval(fullscreenCheckInterval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [showInstructions, hasStartedTest]);

  // Update handleCodingSubmission to better persist the state
  const handleCodingSubmission = async (submission) => {
    try {
      // Store coding submission in localStorage
      localStorage.setItem('coding_submission', JSON.stringify(submission));
      
      setTest(prev => ({
        ...prev,
        status: prev.mcqSubmission ? 'completed' : 'coding_completed',
        codingSubmission: submission,
        totalScore: (prev?.mcqSubmission?.totalScore || 0) + (submission?.totalScore || 0)
      }));

      // Store code in localStorage
      if (answers.coding) {
        localStorage.setItem('coding_answers', JSON.stringify(answers.coding));
      }

      toast.success('Coding section completed!');

      // If MCQs are not completed, switch to MCQ section
      if (!test?.mcqSubmission) {
        setCurrentSection('mcq');
        toast.success('Please complete the MCQ section');
      }

      // Update test status in localStorage
      if (submission.status === 'completed') {
        localStorage.setItem('testStatus', 'completed');
      }
    } catch (error) {
      console.error('Failed to process coding submission:', error);
      setError('Failed to process coding submission');
    }
  };

  const handleMCQSubmission = async (submission) => {
    try {
      // Store MCQ submission in localStorage
      localStorage.setItem('mcq_submission', JSON.stringify(submission));

      setTest(prev => ({
        ...prev,
        status: 'mcq_completed',
        mcqSubmission: submission,
        // Preserve existing coding submission if it exists
        codingSubmission: prev.codingSubmission 
      }));

      // Switch to coding section without auto-submitting
      setCurrentSection('coding');
      toast.success('MCQ section completed! You can now proceed to the coding section.');

      // Update test status in localStorage
      if (submission.status === 'completed') {
        localStorage.setItem('testStatus', 'completed');
      }
    } catch (error) {
      console.error('Failed to process MCQ submission:', error);
      setError('Failed to process MCQ submission');
    }
  };

  // Update keyboard shortcuts prevention
  useEffect(() => {
    const preventKeys = (e) => {
      // Block Alt+Tab specifically
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        e.stopPropagation();
        handleWarning('Alt+Tab is not allowed during the test');
        return false;
      }

      // Allow specific keys for coding
      const allowedKeys = [
        'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
        'Backspace', 'Delete', 'Enter', 'Tab',
        'Home', 'End', 'PageUp', 'PageDown'
      ];

      // Allow alphanumeric keys and common coding symbols
      const isAllowedChar = /^[a-zA-Z0-9\s`~!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]$/.test(e.key);

      // Always block certain key combinations
      const isBlockedCombo = (e.ctrlKey || e.metaKey || e.altKey) && (
        e.key === 'p' ||      // Print
        e.key === 'r' ||      // Reload
        e.key === 's' ||      // Save
        e.key === 'u' ||      // View Source
        e.key === 'a' ||      // Select All
        e.key === 'd' ||      // Bookmark
        e.key === 'f' ||      // Find
        e.key === 'g' ||      // Find Again
        e.key === 'o' ||      // Open
        e.key === 'w' ||      // Close Window
        e.key === 'j' ||      // Dev Tools
        e.key === 'i' ||      // Inspector
        e.key === '+'         // Zoom
      );

      // Block all function keys except F11 (which we handle separately)
      const isBlockedFunctionKey = /^F\d+$/.test(e.key) && e.key !== 'F11';

      // Block specific system keys
      const isBlockedSystemKey = [
        'ContextMenu',
        'Meta',
        'PrintScreen',
        'ScrollLock',
        'Pause'
      ].includes(e.key);

      if (
        isBlockedCombo ||
        isBlockedFunctionKey ||
        isBlockedSystemKey ||
        (!isAllowedChar && !allowedKeys.includes(e.key))
      ) {
        e.preventDefault();
        e.stopPropagation();
        
        // Only show warning for deliberate attempts to use shortcuts
        if (isBlockedCombo || isBlockedFunctionKey) {
          handleWarning('This keyboard shortcut is not allowed during the test');
        }
        
        return false;
      }

      // Special handling for ESC and F11 keys
      if (e.key === 'Escape' || e.key === 'F11') {
        e.preventDefault();
        e.stopPropagation();
        requestAndLockFullscreen();
        return false;
      }

      // Allow Ctrl+C, Ctrl+V, Ctrl+X only in coding section
      if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x'].includes(e.key.toLowerCase())) {
        if (currentSection !== 'coding') {
          e.preventDefault();
          handleWarning('Copy/Paste is only allowed in the coding section');
          return false;
        }
      }
    };

    // Add keydown listener with capture phase and make it non-passive
    document.addEventListener('keydown', preventKeys, { 
      capture: true,
      passive: false
    });

    // Also add a more aggressive Alt key handler
    const preventAlt = (e) => {
      if (e.key === 'Alt' || e.altKey) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // Add both keydown and keyup listeners for Alt
    document.addEventListener('keydown', preventAlt, { capture: true, passive: false });
    document.addEventListener('keyup', preventAlt, { capture: true, passive: false });

    return () => {
      document.removeEventListener('keydown', preventKeys, { capture: true });
      document.removeEventListener('keydown', preventAlt, { capture: true });
      document.removeEventListener('keyup', preventAlt, { capture: true });
    };
  }, [currentSection, handleWarning]);

  // Add this effect to enforce fullscreen on component mount
  useEffect(() => {
    requestAndLockFullscreen();
    
    const enforceFullscreen = async () => {
      if (!document.fullscreenElement) {
        await requestAndLockFullscreen();
      }
    };

    // Check periodically
    const interval = setInterval(enforceFullscreen, 1000);
    
    // Check on visibility change
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        enforceFullscreen();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', enforceFullscreen);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', enforceFullscreen);
    };
  }, []);

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
      if (document.hidden && !showInstructions && hasStartedTest) {
        handleWarning('Warning: Tab switching detected!');
        
        updateAnalytics(prev => ({
          ...prev,
          tabSwitches: (prev.tabSwitches || 0) + 1,
          warnings: prev.warnings + 1
        }));
      }
    };

    const handleBlur = () => {
      if (!showInstructions && hasStartedTest) {
        handleWarning('Warning: Window focus lost!');
        
        updateAnalytics(prev => ({
          ...prev,
          focusLostCount: (prev.focusLostCount || 0) + 1,
          warnings: prev.warnings + 1
        }));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [showInstructions, hasStartedTest, handleWarning, updateAnalytics]);

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

  // Update handleConfirmedSubmit to handle navigation properly
  const handleConfirmedSubmit = async () => {
    setShowSubmitConfirmation(false);
    const loadingToast = toast.loading('Submitting your test...');

    try {
      // Calculate total score from existing submissions
      const totalScore = (test?.mcqSubmission?.totalScore || 0) + 
                        (test?.codingSubmission?.totalScore || 0);

      // Update submission status to completed
      await apiService.post('submissions/update-status', {
        testId: testId,
        status: 'completed'
      });

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
        }
      }

      // Clear all test-related localStorage items
      localStorage.removeItem('coding_submission');
      localStorage.removeItem('mcq_submission');
      localStorage.removeItem('coding_answers');
      localStorage.removeItem('mcq_answers');
      localStorage.removeItem('currentMcqIndex');
      localStorage.removeItem(`coding_state_${test?._id}`);
      localStorage.removeItem(`analytics_${testId}`);
      localStorage.removeItem('testStartTime');
      localStorage.removeItem('currentTestId');
      localStorage.removeItem('currentTest');

      toast.dismiss(loadingToast);
      toast.success('Test submitted successfully!');

      // Navigate to the completed page
      navigate(`/test/completed`);
      window.location.reload();
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
    setAnalytics(prev => ({
      ...prev,
      ...newAnalytics
    }));
  }, []);

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

  // Add these new state variables
  const [currentSetupStep, setCurrentSetupStep] = useState(0);
  const [isNetworkReady, setIsNetworkReady] = useState(false);

  // Add this new component for setup steps
  const SetupStepContent = ({ step, onNext }) => {
    useEffect(() => {
      // Request fullscreen as soon as the setup screen loads
      requestAndLockFullscreen();
      
      // Prevent exiting fullscreen
      const handleFullscreenChange = async () => {
        if (!document.fullscreenElement) {
          await requestAndLockFullscreen();
        }
      };

      // Block escape key
      const preventEscape = (e) => {
        if (e.key === 'Escape' || e.keyCode === 27 || e.key === 'F11') {
          e.preventDefault();
          e.stopPropagation();
          requestAndLockFullscreen();
          return false;
        }
      };

      document.addEventListener('fullscreenchange', handleFullscreenChange);
      document.addEventListener('keydown', preventEscape, { capture: true });

      return () => {
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
        document.removeEventListener('keydown', preventEscape, { capture: true });
      };
    }, []);

    switch (step) {
      case 0:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Test Details</h2>
            <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
              <h3 className="text-xl font-semibold">{test?.title}</h3>
              <p className="text-gray-600">{test?.description}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Duration:</span> {test?.duration} minutes
                </div>
                <div>
                  <span className="font-medium">Total Marks:</span> {test?.totalMarks}
                </div>
                <div>
                  <span className="font-medium">MCQs:</span> {test?.mcqs?.length || 0}
                </div>
                <div>
                  <span className="font-medium">Coding Questions:</span> {test?.codingChallenges?.length || 0}
                </div>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-700">
                This test requires fullscreen mode. The test will remain in fullscreen until completion.
              </p>
            </div>
            <button
              onClick={onNext}
              className="flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next <ArrowRight className="ml-2 w-4 h-4" />
            </button>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Camera Setup</h2>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <p className="text-sm text-gray-600 mb-4">
                Camera access is required for this test. Please grant camera permissions to continue.
              </p>
              
              <button
                onClick={async () => {
                  try {
                    // Request camera permissions
                    const stream = await navigator.mediaDevices.getUserMedia({ 
                      video: { 
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                      } 
                    });
                    
                    // Stop the stream immediately since we don't need it
                    stream.getTracks().forEach(track => track.stop());
                    
                    // If we got here, permissions were granted
                    toast.success('Camera permissions granted successfully!');
                    onNext();
                  } catch (error) {
                    console.error('Camera permission error:', error);
                    if (error.name === 'NotAllowedError') {
                      toast.error('Camera access denied. Please allow camera access to continue.');
                    } else if (error.name === 'NotFoundError') {
                      toast.error('No camera detected. Please connect a camera to continue.');
                    } else {
                      toast.error('Failed to access camera. Please check your device settings.');
                    }
                  }
                }}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Grant Camera Access
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Network Test</h2>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <NetworkSpeed
                onTestComplete={(speed) => {
                  setIsNetworkReady(speed >= 1); // Minimum 1 Mbps required
                }}
              />
            </div>
            <button
              onClick={onNext}
              disabled={!isNetworkReady}
              className={`flex items-center justify-center w-full px-4 py-2 rounded-lg
                ${isNetworkReady 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
            >
              Next <ArrowRight className="ml-2 w-4 h-4" />
            </button>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Full Screen Mode</h2>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <p className="text-gray-600 mb-4">
                The test must be taken in full screen mode. Click the button below to enter full screen.
              </p>
              <button
                onClick={async () => {
                  try {
                    await document.documentElement.requestFullscreen();
                    setIsFullScreen(true);
                    onNext();
                  } catch (error) {
                    toast.error('Failed to enter full screen mode');
                  }
                }}
                className="flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Enter Full Screen <Maximize className="ml-2 w-4 h-4" />
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Ready to Begin</h2>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Final Checklist:</h3>
                <ul className="space-y-2">
                  <li className="flex items-center text-green-600">
                    <CheckCircle className="w-5 h-5 mr-2" /> Camera is working
                  </li>
                  <li className="flex items-center text-green-600">
                    <CheckCircle className="w-5 h-5 mr-2" /> Network connection is stable
                  </li>
                  <li className="flex items-center text-green-600">
                    <CheckCircle className="w-5 h-5 mr-2" /> Full screen mode enabled
                  </li>
                </ul>
                <p className="text-sm text-gray-600 mt-4">
                  Click Start Test when you're ready to begin. The timer will start immediately.
                </p>
              </div>
            </div>
            <button
              onClick={handleStartTest}
              className="flex items-center justify-center w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Start Test <Play className="ml-2 w-4 h-4" />
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  // Add this effect in TakeTest component
  useEffect(() => {
    const handleForceSubmit = () => {
      handleSubmit();
    };

    window.addEventListener('forceTestSubmit', handleForceSubmit);
    
    return () => {
      window.removeEventListener('forceTestSubmit', handleForceSubmit);
    };
  }, [handleSubmit]);

  // Add or update the fullscreen enforcement effect
  useEffect(() => {
    if (!showInstructions && hasStartedTest) {
      let fullscreenCheckInterval;
      let failedAttempts = 0;
      const MAX_ATTEMPTS = 3;
      const CHECK_INTERVAL = 100; // Check every 100ms

      const enforceFullscreen = async () => {
        if (!document.fullscreenElement) {
          failedAttempts++;
          try {
            await document.documentElement.requestFullscreen();
            failedAttempts = 0; // Reset counter on success
            setIsFullScreen(true);
          } catch (error) {
            console.error('Fullscreen enforcement failed:', error);
            if (failedAttempts >= MAX_ATTEMPTS) {
              clearInterval(fullscreenCheckInterval);
              toast.error('Fullscreen mode required. Test will be submitted.');
              window.dispatchEvent(new CustomEvent('forceTestSubmit'));
            }
          }
        }
      };

      // Initial enforcement
      enforceFullscreen();
      
      // Continuous checking
      fullscreenCheckInterval = setInterval(enforceFullscreen, CHECK_INTERVAL);

      // Also enforce on visibility change
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          enforceFullscreen();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        clearInterval(fullscreenCheckInterval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [showInstructions, hasStartedTest]);

  // Add this effect to request fullscreen on page load
  useEffect(() => {
    const requestFullscreenOnLoad = async () => {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
          setIsFullScreen(true);
        }
      } catch (error) {
        console.error('Fullscreen request failed:', error);
      }
    };

    requestFullscreenOnLoad();
  }, []);

  // Add this effect to disable right-click
  useEffect(() => {
    const disableContextMenu = (e) => {
      e.preventDefault();
    };

    document.addEventListener('contextmenu', disableContextMenu);

    return () => {
      document.removeEventListener('contextmenu', disableContextMenu);
    };
  }, []);

  // Add useEffect to load saved submissions on component mount
  useEffect(() => {
    const loadSavedSubmissions = () => {
      const savedMcq = localStorage.getItem('mcq_submission');
      const savedCoding = localStorage.getItem('coding_submission');
      const savedCodingAnswers = localStorage.getItem('coding_answers');

      if (savedMcq) {
        try {
          const mcqSubmission = JSON.parse(savedMcq);
          setTest(prev => ({
            ...prev,
            mcqSubmission
          }));
        } catch (error) {
          console.error('Error loading saved MCQ submission:', error);
        }
      }

      if (savedCoding) {
        try {
          const codingSubmission = JSON.parse(savedCoding);
          setTest(prev => ({
            ...prev,
            codingSubmission
          }));
        } catch (error) {
          console.error('Error loading saved coding submission:', error);
        }
      }

      if (savedCodingAnswers) {
        try {
          const codingAnswers = JSON.parse(savedCodingAnswers);
          setAnswers(prev => ({
            ...prev,
            coding: codingAnswers
          }));
        } catch (error) {
          console.error('Error loading saved coding answers:', error);
        }
      }
    };

    loadSavedSubmissions();
  }, []);

  // Add a new function to handle section switching
  const handleSectionSwitch = (newSection) => {
    setCurrentSection(newSection);
  };

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
  if (showInstructions && !hasStartedTest) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="mb-8">
            <Progress 
              steps={SETUP_STEPS} 
              currentStep={currentSetupStep} 
            />
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <SetupStepContent
              step={currentSetupStep}
              onNext={() => setCurrentSetupStep(prev => prev + 1)}
            />
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
                      {String(Math.floor(timeRemaining / (1000 * 60 * 60))).padStart(2, '0')}:
                      {String(Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0')}:
                      {String(Math.floor((timeRemaining % (1000 * 60)) / 1000)).padStart(2, '0')}
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
              <FullscreenButton 
                isFullScreen={isFullScreen} 
                setIsFullScreen={setIsFullScreen} 
              />
              <button
                onClick={handleFinalSubmitClick}
                className="px-4 py-2 flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                <CheckCircle className="w-5 h-5" />
                Final Submit
              </button>
              
              {/* Camera div */}
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
              onClick={() => handleSectionSwitch('mcq')}
              className={`px-4 py-2 text-sm rounded-t-lg font-medium transition-all relative
                ${currentSection === 'mcq' 
                  ? 'text-blue-600 bg-white border-t-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-800'
                }`}
            >
              MCQ Section
              <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-gray-100">
                {test.mcqs?.length || 0}
              </span>
            </button>
            <button
              onClick={() => handleSectionSwitch('coding')}
              className={`px-4 py-2 text-sm rounded-t-lg font-medium transition-all relative
                ${currentSection === 'coding' 
                  ? 'text-blue-600 bg-white border-t-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-800'
                }`}
            >
              Coding Section
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
              setAnalytics={handleSetAnalytics}
              test={test}
            />
          ) : (
            <CodingSection
              challenges={test?.codingChallenges || []}
              answers={answers.coding}
              setAnswers={(codingAnswers) => handleAnswerUpdate('coding', codingAnswers)}
              onSubmitCoding={handleCodingSubmission}
              setAnalytics={handleSetAnalytics}
              testId={uuid}
              testStartTime={localStorage.getItem('testStartTime')}
              test={test}
              
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
          onClose={() => {
            handleWarningModalClose();
            document.documentElement.requestFullscreen().catch(() => {
              toast.error('Fullscreen is required to continue the test');
            });
          }}
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