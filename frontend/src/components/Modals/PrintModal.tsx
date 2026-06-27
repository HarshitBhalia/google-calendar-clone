import React, { useState } from 'react';
import { useCalendarStore } from '../../store/calendarStore';
import { ChevronDown, X } from 'lucide-react';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrintModal({ isOpen, onClose }: PrintModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex bg-[#202124]/90 sm:bg-transparent">
      {/* Overlay background for desktop */}
      <div className="absolute inset-0 bg-[#e6e6e6] hidden sm:block z-0" onClick={onClose}></div>
      
      {/* Left Sidebar Menu */}
      <div className="w-full sm:w-[360px] bg-[#28292c] h-full flex flex-col z-10 text-white shadow-2xl relative overflow-y-auto">
        <div className="p-6">
          <h2 className="text-[22px] font-google-sans mb-6">Print preview</h2>
          
          <div className="space-y-6">
            {/* Print Range */}
            <div>
              <label className="text-sm text-gray-400 block mb-2">Print range</label>
              <div className="flex items-center gap-2">
                <div className="bg-[#3c4043] rounded px-3 py-2 text-sm flex-1 cursor-pointer">Jun 21, 2026</div>
                <span className="text-sm text-gray-400">to</span>
                <div className="bg-[#3c4043] rounded px-3 py-2 text-sm flex-1 cursor-pointer">Jun 27, 2026</div>
              </div>
            </div>

            {/* View */}
            <div>
              <label className="text-sm text-gray-400 block mb-2">View</label>
              <div className="bg-[#3c4043] rounded px-3 py-2 text-sm flex justify-between items-center cursor-pointer">
                <span>Auto</span>
                <ChevronDown size={18} />
              </div>
            </div>

            {/* Font size */}
            <div>
              <label className="text-sm text-gray-400 block mb-2">Font size</label>
              <div className="bg-[#3c4043] rounded px-3 py-2 text-sm flex justify-between items-center cursor-pointer">
                <span>Normal</span>
                <ChevronDown size={18} />
              </div>
            </div>

            {/* Orientation */}
            <div>
              <label className="text-sm text-gray-400 block mb-2">Orientation</label>
              <div className="bg-[#3c4043] rounded px-3 py-2 text-sm flex justify-between items-center cursor-pointer">
                <span>Auto</span>
                <ChevronDown size={18} />
              </div>
            </div>

            {/* Color & style */}
            <div>
              <label className="text-sm text-gray-400 block mb-2">Color & style</label>
              <div className="bg-[#3c4043] rounded px-3 py-2 text-sm flex justify-between items-center cursor-pointer">
                <span>Outline</span>
                <ChevronDown size={18} />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-4 pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="w-5 h-5 bg-[#8ab4f8] rounded border-2 border-transparent flex items-center justify-center">
                  <svg className="w-4 h-4 text-[#28292c]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <span className="text-sm">Show weekends</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="w-5 h-5 border-2 border-gray-400 rounded flex items-center justify-center"></div>
                <span className="text-sm">Show events you have declined</span>
              </label>
            </div>
          </div>
        </div>

        <div className="mt-auto p-4 flex justify-end gap-2 border-t border-[#3c4043]">
          <button 
            onClick={onClose}
            className="px-6 py-2 text-[#8ab4f8] text-sm font-medium rounded hover:bg-[#8ab4f8]/10 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              window.print();
              onClose();
            }}
            className="px-6 py-2 text-[#8ab4f8] text-sm font-medium rounded hover:bg-[#8ab4f8]/10 transition-colors"
          >
            Print
          </button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 hidden sm:flex items-center justify-center z-10 pointer-events-none p-12">
        {/* Placeholder image resembling the calendar print preview */}
        <div className="w-full max-w-4xl bg-white shadow-lg border border-gray-200 aspect-[1.414/1] p-8 flex flex-col">
          <div className="flex justify-between items-end mb-2">
             <div className="text-[10px] text-gray-500">My Calendar, Holidays</div>
             <div className="text-[10px] text-gray-500">Sun Jun 21 - Sat Jun 27, 2026 (Coordinated Universal Time)</div>
          </div>
          <div className="flex-1 border border-blue-200 bg-blue-50/10 flex flex-col">
             {/* Header */}
             <div className="flex border-b border-blue-200 text-[10px] text-blue-700 font-bold bg-blue-50/50">
                {['Sun 6/21', 'Mon 6/22', 'Tue 6/23', 'Wed 6/24', 'Thu 6/25', 'Fri 6/26', 'Sat 6/27'].map((d, i) => (
                  <div key={i} className="flex-1 text-center py-1 border-r border-blue-200 last:border-0">{d}</div>
                ))}
             </div>
             {/* Body */}
             <div className="flex-1 flex text-[9px] text-gray-400">
               <div className="w-8 flex flex-col border-r border-blue-200 bg-gray-50/50">
                  {['7am','8am','9am','10am','11am','12pm','1pm','2pm','3pm','4pm','5pm'].map(h => (
                    <div key={h} className="flex-1 flex justify-end pr-1 border-b border-blue-100 items-start pt-1">{h}</div>
                  ))}
               </div>
               <div className="flex-1 flex relative">
                  {[0,1,2,3,4,5,6].map(i => (
                    <div key={i} className="flex-1 border-r border-blue-200 last:border-0 flex flex-col">
                       {['7am','8am','9am','10am','11am','12pm','1pm','2pm','3pm','4pm','5pm'].map(h => (
                         <div key={h} className="flex-1 border-b border-blue-100 border-dashed"></div>
                       ))}
                    </div>
                  ))}
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
