import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function TestRegister() {
  const { uuid } = useParams();
  const [testStatus, setTestStatus] = useState(null);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const response = await axios.post(`/api/tests/${uuid}/check-registration`);
        setTestStatus(response.data);
      } catch (error) {
        console.error('Access check failed:', error);
      }
    };

    checkAccess();
  }, [uuid]);

  return (
    <div>
      {testStatus && (
        <div>
          <h2>{testStatus.test.title}</h2>
          {testStatus.test.type === 'coding_challenge' && (
            <>
              <p>This is a challenge test - registration required</p>
              {!testStatus.isRegistered && (
                <button onClick={handleRegister}>Register for Test</button>
              )}
            </>
          )}
          {testStatus.test.type === 'public' && (
            <button onClick={handleStartTest}>Start Test</button>
          )}
          {testStatus.test.type === 'assessment' && (
            <p>{testStatus.canAccess ? 
              'You are authorized to take this test' : 
              'This test requires vendor approval'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}