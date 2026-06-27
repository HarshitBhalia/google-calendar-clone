import React from 'react';
import { useCalendarStore } from '../../store/calendarStore';
import { X, CheckCircle2, ChevronDown } from 'lucide-react';

interface AppearanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppearanceModal({ isOpen, onClose }: AppearanceModalProps) {
  const { theme, setTheme } = useCalendarStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div 
        className="bg-white dark:bg-[#303134] rounded-lg shadow-xl w-full max-w-[600px] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-2xl font-google-sans text-gc-gray-900 dark:text-gray-100 mb-8">Appearance</h2>
          
          <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 justify-center">
            
            {/* Light Theme */}
            <div className="flex flex-col items-center gap-4">
              <button 
                onClick={() => setTheme('light')}
                className={`w-40 h-48 rounded-xl flex flex-col p-4 border-2 transition-all ${theme === 'light' ? 'border-gc-blue bg-[#e8f0fe]' : 'border-transparent bg-gc-gray-100 hover:bg-gc-gray-200'}`}
              >
                <div className="w-full bg-white rounded-lg shadow-sm h-full p-3 flex flex-col">
                  <div className="w-6 h-6 bg-gc-blue text-white rounded text-xs flex items-center justify-center font-bold mb-3">31</div>
                  <div className="h-8 border rounded-full flex items-center px-2 mb-4">
                    <span className="text-lg">+</span>
                    <div className="h-0.5 w-10 bg-gc-gray-400 ml-2"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-1 w-full bg-gc-gray-400"></div>
                    <div className="h-1 w-full bg-gc-gray-400"></div>
                    <div className="h-1 w-3/4 bg-gc-gray-400"></div>
                  </div>
                </div>
              </button>
              <label className="flex items-center gap-2 cursor-pointer" onClick={() => setTheme('light')}>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${theme === 'light' ? 'border-gc-blue' : 'border-gc-gray-500'}`}>
                  {theme === 'light' && <div className="w-2.5 h-2.5 rounded-full bg-gc-blue"></div>}
                </div>
                <span className="text-sm font-medium dark:text-gray-200">Light</span>
              </label>
            </div>

          </div>

          <div className="space-y-4">
            <div className="bg-gc-gray-50 dark:bg-[#202124] rounded-lg p-3 flex justify-between items-center cursor-pointer border border-transparent hover:border-gc-gray-300 transition-colors">
              <div className="flex flex-col">
                <span className="text-xs text-gc-gray-500 dark:text-gray-400">Color set</span>
                <span className="text-sm text-gc-gray-900 dark:text-gray-200">Modern</span>
              </div>
              <ChevronDown size={20} className="text-gc-gray-500" />
            </div>

            <div className="bg-gc-gray-50 dark:bg-[#202124] rounded-lg p-3 flex justify-between items-center cursor-pointer border border-transparent hover:border-gc-gray-300 transition-colors">
              <div className="flex flex-col">
                <span className="text-xs text-gc-gray-500 dark:text-gray-400">Information density</span>
                <span className="text-sm text-gc-gray-900 dark:text-gray-200">Responsive to your screen</span>
              </div>
              <ChevronDown size={20} className="text-gc-gray-500" />
            </div>
          </div>
          
        </div>

        <div className="p-4 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 text-gc-blue dark:text-[#8ab4f8] text-sm font-medium rounded hover:bg-gc-blue/10 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
