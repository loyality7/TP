import React from 'react';

const TimeRangeSelector = ({ activeRange, onRangeChange }) => {
  const ranges = [
    { label: '1H', value: '1H' },
    { label: '1D', value: '1D' },
    { label: '7D', value: '7D' },
    { label: '1M', value: '1M' },
    { label: '1Y', value: '1Y' },
  ];

  return (
    <div className="flex items-center space-x-2">
      {ranges.map(range => (
        <button
          key={range.value}
          onClick={() => onRangeChange(range.value)}
          className={`px-3 py-1 rounded-lg text-sm ${
            activeRange === range.value
              ? 'bg-blue-50 text-blue-600'
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          {range.label}
        </button>
      ))}
      <button className="px-3 py-1 rounded-lg text-sm text-gray-500 hover:bg-gray-100">
        Export
      </button>
    </div>
  );
};

export default TimeRangeSelector; 