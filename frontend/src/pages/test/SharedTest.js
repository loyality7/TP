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

        // Step 1: Verify Test
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
        
        // Store test ID immediately after verification
        localStorage.setItem('currentTestId', testData.id);
        console.log('Stored test ID:', testData.id);

        // Set test data
        setTest({
          ...testData,
          id: testData.id,
          uuid: uuid
        });

        // Step 2: Check Registration Status
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

  // Update handleRegister to store test data
  const handleRegister = async () => {
    try {
      setLoading(true);
      setError(null);

      // Store test data directly
      localStorage.setItem('currentTestId', test.id);
      localStorage.setItem('currentTestData', JSON.stringify({
        id: test.id,
        uuid: uuid,
        title: test.title,
        type: test.type,
        duration: test.duration,
        totalMarks: test.totalMarks
      }));

      toast.success('Starting test');
      navigate(`/test/take/${uuid}`);

    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to register for test';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = async () => {
    try {
      setLoading(true);
      setError(null);

      // Store test data directly without parsing
      localStorage.setItem('currentTestId', test.id);
      localStorage.setItem('currentTestData', JSON.stringify({
        id: test.id,
        uuid: uuid,
        title: test.title,
        type: test.type,
        duration: test.duration,
        totalMarks: test.totalMarks
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
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-600">Loading test details...</p>
      </div>
    );
  }

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

  return (
    <div className="max-w-4xl mx-auto p-6">
      {test && (
        <>
          <h1 className="text-2xl font-bold mb-4">{test.title}</h1>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold mb-2">Test Details</h2>
              <p className="text-gray-600">{test.description}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="font-medium">Duration:</p>
                <p className="text-gray-600">{test.duration} minutes</p>
              </div>
              <div>
                <p className="font-medium">Total Marks:</p>
                <p className="text-gray-600">{test.totalMarks}</p>
              </div>
              <div>
                <p className="font-medium">Type:</p>
                <p className="text-gray-600">{test.type}</p>
              </div>
              <div>
                <p className="font-medium">Category:</p>
                <p className="text-gray-600">{test.category}</p>
              </div>
            </div>

            {vendorBalance && !vendorBalance.hasBalance && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="text-lg font-semibold text-red-700 mb-2">Test Unavailable</h3>
                <p className="text-red-600">
                  This test is currently unavailable due to administrative reasons. 
                  Please contact the test administrator.
                </p>
              </div>
            )}

            {registrationStatus && (
              <div className="mt-6">
                {!registrationStatus.isRegistered && registrationStatus.canAccess && vendorBalance?.hasBalance && (
                  <button
                    onClick={handleRegister}
                    disabled={loading || !vendorBalance?.hasBalance}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-blue-300"
                  >
                    {loading ? 'Processing...' : 'Register for Test'}
                  </button>
                )}
                
                {registrationStatus.isRegistered && registrationStatus.canAccess && vendorBalance?.hasBalance && (
                  <button
                    onClick={handleStartTest}
                    disabled={!vendorBalance?.hasBalance}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:bg-gray-300"
                  >
                    Start Test
                  </button>
                )}
              </div>
            )}
          </div>

          {registrationStatus && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Access Status</h3>
              {registrationStatus.canAccess && vendorBalance?.hasBalance ? (
                <>
                  <div className="text-green-600">
                    ✓ You are authorized to take this test
                    {registrationStatus.accessControl?.allowedUsers?.[0] && (
                      <p className="text-sm text-gray-600 mt-1">
                        Registered email: {registrationStatus.accessControl.allowedUsers[0].email}
                      </p>
                    )}
                  </div>
                  {registrationStatus.message && (
                    <p className="text-sm text-gray-600 mt-2">{registrationStatus.message}</p>
                  )}
                </>
              ) : (
                <div className="text-yellow-600">
                  ⚠ {!vendorBalance?.hasBalance 
                    ? 'This test is currently unavailable. Please try again later.' 
                    : (registrationStatus.message || 'This is a private test. Please contact the test administrator for access.')}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
} 
