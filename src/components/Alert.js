export const Alert = ({ title, description, onClose }) => {
  return (
    <div className="mt-4 mb-6 p-4 border rounded-lg bg-green-50 border-green-200">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium text-green-800">{title}</h3>
          <p className="mt-1 text-green-700">{description}</p>
        </div>
        <button 
          onClick={onClose}
          className="text-green-500 hover:text-green-700 p-1"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg"
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="w-5 h-5"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  );
};