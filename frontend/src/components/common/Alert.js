import React from 'react';

export const Alert = ({ children, className = '', variant = 'default' }) => {
  const variantClasses = {
    default: 'bg-blue-50 text-blue-700',
    destructive: 'bg-red-50 text-red-700',
  };

  return (
    <div className={`p-4 rounded-lg ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
};

export const AlertDescription = ({ children, className = '' }) => (
  <div className={`text-sm ${className}`}>
    {children}
  </div>
); 