import React from 'react';

export const Avatar = ({ src, alt, fallback, className = '' }) => {
  const [error, setError] = React.useState(false);

  if (error || !src) {
    return (
      <div className={`flex items-center justify-center bg-gray-200 ${className}`}>
        <span className="text-gray-600 font-medium">
          {fallback || '?'}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  );
}; 