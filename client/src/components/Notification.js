import React from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

const Notification = ({ message, type = 'success', onClose }) => {
  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in max-w-md">
      <div className={`flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg ${
        type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
      } text-white`}>
        {type === 'success' && <CheckCircle size={20} />}
        {type === 'error' && <AlertCircle size={20} />}
        <span className="font-medium flex-1">{message}</span>
        {onClose && (
          <button onClick={onClose} className="hover:bg-white/20 rounded p-1">
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

export default Notification;