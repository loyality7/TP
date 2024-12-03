export default function TestCompletionMessage({ testType, score }) {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">Test Completed!</h2>
      <p className="text-lg mb-4">Your score: {score}</p>
      
      {testType === 'assessment' ? (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-blue-800">
            This was an assessment test. You cannot retake it unless authorized by the vendor.
          </p>
        </div>
      ) : (
        <div className="mt-4">
          <p className="text-gray-600">
            You can retake this test anytime to improve your score.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Take Again
          </button>
        </div>
      )}
    </div>
  );
} 