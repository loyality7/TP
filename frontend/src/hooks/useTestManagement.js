import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const useTestManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createTest = async (testData) => {
    try {
      setLoading(true);
      // API call to create test
      // const response = await api.post('/tests', testData);
      console.log('Creating test:', testData);
      navigate('/vendor/tests');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const validateTestData = (testData) => {
    const errors = {};
    
    if (!testData.title?.trim()) errors.title = 'Title is required';
    if (!testData.category) errors.category = 'Category is required';
    if (!testData.type) errors.type = 'Test type is required';
    if (!testData.duration) errors.duration = 'Duration is required';
    if (!testData.passingScore) errors.passingScore = 'Passing score is required';
    
    return Object.keys(errors).length ? errors : null;
  };

  return {
    loading,
    error,
    createTest,
    validateTestData
  };
}; 