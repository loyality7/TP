import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import { toast } from 'react-hot-toast';

export default function SharedTest() {
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [registrationStatus, setRegistrationStatus] = useState(null);
  const [vendorBalance, setVendorBalance] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const { uuid } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyAndCheckRegistration = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          localStorage.setItem('redirectAfterLogin', window.location.pathname);
          navigate('/login');
          return;
        }

        // Step 1: Parse UUID to get test and vendor IDs
        const parseResponse = await apiService.get(`tests/parse-uuid/${uuid}`);
        console.log('Parse Response:', parseResponse?.data);

        if (!parseResponse?.data?.data) {
          throw new Error('Invalid test data received');
        }

        const { testId, vendorId } = parseResponse.data.data;
        
        // Store IDs immediately
        localStorage.setItem('currentTestId', testId);
        localStorage.setItem('currentVendorId', vendorId);

        // Step 2: Verify Test
        const verifyResponse = await apiService.post(`tests/verify/${uuid}`);
        console.log('Verify Response:', verifyResponse?.data);

        if (!verifyResponse?.data?.test) {
          throw new Error('Invalid test data received');
        }

        // Check vendor balance
        const vendorData = verifyResponse?.data?.test?.vendor || {};
        if (!vendorData.hasBalance) {
          setError(`This test is currently unavailable. Please contact the test administrator.`);
          setVendorBalance({ hasBalance: false });
          return;
        }

        const testData = verifyResponse.data.test;
        setVendorBalance({ hasBalance: true });
        
        // Set test data
        setTest({
          ...testData,
          id: testId,
          uuid: uuid,
          vendorId: vendorId
        });

        // Step 3: Check Registration Status
        const regResponse = await apiService.post(`tests/${uuid}/check-registration`);
        console.log('Registration Response:', regResponse?.data);

        if (!regResponse?.data) {
          throw new Error('Invalid registration status received');
        }

        setRegistrationStatus({
          canAccess: regResponse.data.canAccess || false,
          requiresRegistration: regResponse.data.requiresRegistration || false,
          isRegistered: regResponse.data.isRegistered || false,
          message: regResponse.data.message || '',
          testType: regResponse.data.test?.type,
          lastSession: regResponse.data.lastSession || null,
          accessControl: regResponse.data.test?.accessControl || null
        });

      } catch (err) {
        console.error('Error details:', err);
        const errorMessage = err.response?.data?.message || err.message || 'Error loading test';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    verifyAndCheckRegistration();
  }, [uuid, navigate]);

  useEffect(() => {
    // Add mobile detection
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
    };
    checkMobile();
  }, []);

  const handleRegister = async () => {
    try {
      setLoading(true);
      setError(null);

      const testId = localStorage.getItem('currentTestId');
      const vendorId = localStorage.getItem('currentVendorId');

      if (!testId || !vendorId) {
        throw new Error('Missing test or vendor information');
      }

      // First try to debit the test fee from vendor's wallet
      const debitResponse = await apiService.post('vendor/wallet/debit-test-fee', {
        vendorId: vendorId,
        testId: testId
      });

      if (!debitResponse.data.success) {
        throw new Error(debitResponse.data.message || 'Failed to process test fee');
      }

      // Store complete test data
      localStorage.setItem('currentTestData', JSON.stringify({
        id: testId,
        uuid: uuid,
        title: test.title,
        type: test.type,
        duration: test.duration,
        totalMarks: test.totalMarks,
        vendorId: vendorId
      }));

      toast.success('Registration successful');
      navigate(`/test/take/${uuid}`);

    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || error.message;
      
      if (error.response?.status === 400 && error.response?.data?.error === "Insufficient balance") {
        setError("This test is currently unavailable. Please contact the test coordinator for assistance.");
        toast.error("Test registration unavailable. Please contact coordinator.");
      } else {
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = async () => {
    try {
      setLoading(true);
      setError(null);

      const testId = localStorage.getItem('currentTestId');
      const vendorId = localStorage.getItem('currentVendorId');

      if (!testId || !vendorId) {
        throw new Error('Missing test or vendor information');
      }

      localStorage.setItem('currentTestData', JSON.stringify({
        id: testId,
        uuid: uuid,
        title: test.title,
        type: test.type,
        duration: test.duration,
        totalMarks: test.totalMarks,
        vendorId: vendorId
      }));

      toast.success('Starting test');
      navigate(`/test/take/${uuid}`);

    } catch (error) {
      console.error('Error starting test:', error);
      const errorMessage = error.message || 'Failed to start test';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading test details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow-lg rounded-xl p-8 border-l-4 border-red-500">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <svg className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Test</h1>
                <p className="text-gray-600">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow-lg rounded-xl p-8 border-l-4 border-yellow-500">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <svg className="h-12 w-12 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 mb-2">Desktop Mode Recommended</h1>
                <p className="text-gray-600">For the best test-taking experience, please use a computer or switch to desktop mode.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {test && (
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header Section */}
          <div className="bg-white shadow-lg rounded-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-8 py-6">
              <h1 className="text-3xl font-bold text-white mb-2">{test.title}</h1>
              <p className="text-blue-100">{test.description}</p>
            </div>

            {/* Test Details Grid */}
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="font-semibold text-gray-900">{test.duration} minutes</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="p-3 bg-green-100 rounded-full">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Marks</p>
                    <p className="font-semibold text-gray-900">{test.totalMarks}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="p-3 bg-purple-100 rounded-full">
                    <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Type</p>
                    <p className="font-semibold text-gray-900">{test.type}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Category</p>
                    <p className="font-semibold text-gray-900">{test.category}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons - Updated styling and layout */}
              {registrationStatus && (
                <div className="mt-8 space-y-4">
                  {!registrationStatus.isRegistered && registrationStatus.canAccess && vendorBalance?.hasBalance && (
                    <button
                      onClick={handleRegister}
                      disabled={loading || !vendorBalance?.hasBalance}
                      className="w-full flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    >
                      {loading ? (
                        <span className="flex items-center space-x-3">
                          <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Processing Registration...</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-2">
                          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span>Register for Test</span>
                        </span>
                      )}
                    </button>
                  )}
                  
                  {registrationStatus.isRegistered && registrationStatus.canAccess && vendorBalance?.hasBalance && (
                    <button
                      onClick={handleStartTest}
                      disabled={loading || !vendorBalance?.hasBalance}
                      className="w-full flex items-center justify-center bg-gradient-to-r from-green-600 to-green-700 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transform transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    >
                      <span className="flex items-center space-x-2">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Start Test Now</span>
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Status Messages - Updated styling */}
          {vendorBalance && !vendorBalance.hasBalance && (
            <div className="mt-6 bg-red-50 rounded-xl p-6 border border-red-200">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-800">Test Unavailable</h3>
                  <p className="text-red-600 mt-1">This test is currently unavailable. Please contact the test administrator for assistance.</p>
                </div>
              </div>
            </div>
          )}

          {registrationStatus && (
            <div className="bg-white shadow-lg rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Access Status</h3>
              {registrationStatus.canAccess && vendorBalance?.hasBalance ? (
                <div className="flex items-center space-x-3 text-green-600">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-medium">You are authorized to take this test</p>
                    {registrationStatus.accessControl?.allowedUsers?.[0] && (
                      <p className="text-sm text-gray-600 mt-1">
                        Registered email: {registrationStatus.accessControl.allowedUsers[0].email}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3 text-yellow-600">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="font-medium">
                    {!vendorBalance?.hasBalance 
                      ? 'This test is currently unavailable. Please try again later.' 
                      : (registrationStatus.message || 'This is a private test. Please contact the test administrator for access.')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 
