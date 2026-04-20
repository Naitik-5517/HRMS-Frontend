import React from 'react';
import { AlertCircle } from 'lucide-react';

const ErrorMessage = ({ message, onRetry }) => {
  // Ensure message is always a string
  const safeMessage = typeof message === 'string' 
    ? message 
    : typeof message === 'object' && message?.text 
      ? message.text 
      : JSON.stringify(message || 'An error occurred');
  
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      <div className="flex items-center gap-3 text-red-600">
        <AlertCircle size={24} />
        <p className="text-lg font-semibold">Error</p>
      </div>
      <p className="text-gray-600 text-center max-w-md">{safeMessage}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
