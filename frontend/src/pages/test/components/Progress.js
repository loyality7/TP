import React from 'react';

export function Progress({ steps, currentStep }) {
  return (
    <div className="relative">
      {/* Progress Line */}
      <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200">
        <div 
          className="h-full bg-blue-600 transition-all duration-500"
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        />
      </div>

      {/* Steps */}
      <div className="relative flex justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          
          return (
            <div 
              key={index}
              className={`flex flex-col items-center ${
                isCompleted ? 'text-blue-600' : 
                isCurrent ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center
                ${isCompleted ? 'bg-blue-600 text-white' :
                  isCurrent ? 'bg-white border-2 border-blue-600' :
                  'bg-white border-2 border-gray-200'}
              `}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs mt-2">{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
} 