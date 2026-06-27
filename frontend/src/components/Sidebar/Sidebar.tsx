import React from 'react';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react';
import MiniCalendar from '../Calendar/MiniCalendar';
import { useCalendarStore } from '../../store/calendarStore';
import { useCalendars } from '../../hooks/useEvents';
import type { Calendar } from '../../types';

interface SidebarProps {
  onCreateEvent: () => void;
  onCreateTask?: () => void;
  onCreateAppointment?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onCreateEvent, onCreateTask, onCreateAppointment }) => {
  const { sidebarOpen, calendarVisibility, toggleCalendarVisibility, toggleSidebar } = useCalendarStore();
  const { data: calendars = [] } = useCalendars();
  const [calendarsExpanded, setCalendarsExpanded] = React.useState(true);
  const [createMenuOpen, setCreateMenuOpen] = React.useState(false);
  const createMenuRef = React.useRef<HTMLDivElement>(null);

  // Close create menu on click outside
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (createMenuRef.current && !createMenuRef.current.contains(e.target as Node)) {
        setCreateMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isCalendarVisible = (calendarId: string): boolean => {
    return calendarVisibility[calendarId] !== false; // Default visible
  };

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/30 z-[50]" 
          onClick={toggleSidebar}
        />
      )}
      <aside
        className={`
          no-print flex-shrink-0 border-r border-gc-gray-200 bg-white overflow-y-auto overflow-x-hidden
          transition-all duration-300 ease-in-out
          absolute md:relative z-[60] h-full
          ${sidebarOpen ? 'w-64 opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-full md:translate-x-0'}
        `}
        style={{ minWidth: sidebarOpen ? '256px' : '0px' }}
      >
      <div className="w-64">
        {/* Create button */}
        <div className="p-4 pt-3 relative" ref={createMenuRef}>
          <button
            onClick={() => setCreateMenuOpen(!createMenuOpen)}
            className="flex items-center gap-3 px-6 py-3 bg-white border border-gc-gray-300 rounded-full shadow-md hover:shadow-lg hover:bg-gc-gray-50 transition-all duration-200 group"
          >
            <Plus
              size={22}
              className="text-gc-blue group-hover:rotate-90 transition-transform duration-200"
              strokeWidth={2.5}
            />
            <span className="text-sm font-medium text-gc-gray-700 font-google-sans">Create</span>
            <ChevronDown size={18} className="text-gc-gray-500 ml-1" />
          </button>

          {createMenuOpen && (
            <div className="absolute left-4 top-full mt-1 w-56 bg-white rounded-lg shadow-xl border border-gc-gray-200 py-2 z-[100] animate-fadeIn">
              <button
                onClick={() => {
                  setCreateMenuOpen(false);
                  onCreateEvent();
                }}
                className="w-full text-left px-4 py-2 hover:bg-gc-gray-100 text-sm text-gc-gray-800"
              >
                Event
              </button>
              <button
                onClick={() => {
                  setCreateMenuOpen(false);
                  if (onCreateTask) onCreateTask();
                }}
                className="w-full text-left px-4 py-2 hover:bg-gc-gray-100 text-sm text-gc-gray-800"
              >
                Task
              </button>
              <button
                onClick={() => {
                  setCreateMenuOpen(false);
                  if (onCreateAppointment) onCreateAppointment();
                }}
                className="w-full text-left px-4 py-2 hover:bg-gc-gray-100 text-sm text-gc-gray-800"
              >
                Appointment schedule
              </button>
            </div>
          )}
        </div>

        {/* Mini Calendar */}
        <MiniCalendar />

        {/* Booking pages section */}
        <div className="mt-4 px-3 flex items-center justify-between group cursor-pointer hover:bg-gc-gray-50 py-1.5 rounded-r-full mr-2">
          <span className="font-google-sans text-[13px] font-medium text-gc-gray-700 ml-3">
            Booking pages
          </span>
          <Plus size={16} className="text-gc-gray-500 mr-2" />
        </div>

        {/* My calendars section */}
        <div className="mt-2 px-3">
          <button
            onClick={() => setCalendarsExpanded(!calendarsExpanded)}
            className="flex items-center gap-1 w-full text-left text-sm font-medium text-gc-gray-700 hover:text-gc-gray-900 py-1 px-1 group"
          >
            {calendarsExpanded ? (
              <ChevronDown size={14} className="text-gc-gray-600" />
            ) : (
              <ChevronRight size={14} className="text-gc-gray-600" />
            )}
            <span className="font-google-sans text-[11px] font-medium uppercase tracking-wider">
              My calendars
            </span>
          </button>

          {calendarsExpanded && (
            <div className="mt-1 space-y-0.5">
              {calendars.length === 0 ? (
                <p className="text-xs text-gc-gray-400 px-2 py-2">No calendars yet</p>
              ) : (
                calendars.map((cal: Calendar) => (
                  <label
                    key={cal.id}
                    className="flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-gc-gray-50 cursor-pointer group transition-colors"
                  >
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={isCalendarVisible(cal.id)}
                        onChange={() => toggleCalendarVisibility(cal.id)}
                        className="sr-only"
                      />
                      <div
                        className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center transition-colors ${
                          isCalendarVisible(cal.id)
                            ? 'border-transparent'
                            : 'border-gc-gray-400 bg-white'
                        }`}
                        style={{
                          backgroundColor: isCalendarVisible(cal.id)
                            ? cal.color
                            : undefined,
                        }}
                      >
                        {isCalendarVisible(cal.id) && (
                          <svg
                            width="10"
                            height="8"
                            viewBox="0 0 10 8"
                            fill="none"
                            className="text-white"
                          >
                            <path
                              d="M1 4L3.5 6.5L9 1"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-[13px] text-gc-gray-900 truncate flex-1">
                      {cal.name}
                    </span>
                  </label>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
