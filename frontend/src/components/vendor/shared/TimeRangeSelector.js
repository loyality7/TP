import React from 'react';

export const TimeRangeSelector = () => {
  return (
    <select className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
      <option value="7d">Last 7 days</option>
      <option value="30d">Last 30 days</option>
      <option value="90d">Last 90 days</option>
      <option value="12m">Last 12 months</option>
    </select>
  );
}; 