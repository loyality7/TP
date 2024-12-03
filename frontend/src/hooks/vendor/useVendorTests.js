import { useQuery } from 'react-query';
import { vendorService } from '../../services/vendorService';

export const useVendorTests = () => {
  return useQuery('vendorTests', vendorService.getAllTests);
};

export const useTestAnalytics = (testId) => {
  return useQuery(
    ['testAnalytics', testId],
    () => vendorService.getTestDetailedAnalytics(testId),
    {
      enabled: !!testId,
    }
  );
};

export const useTestResults = (testId) => {
  return useQuery(
    ['testResults', testId],
    () => vendorService.getTestResults(testId),
    {
      enabled: !!testId,
    }
  );
}; 