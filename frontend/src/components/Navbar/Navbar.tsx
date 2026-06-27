import React from 'react';
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  Settings,
  Search,
  LogOut,
} from 'lucide-react';
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns';
import { useCalendarStore } from '../../store/calendarStore';
import { useLogout } from '../../hooks/useAuth';
import type { CalendarView } from '../../types';
import { SearchModal } from '../Modals/SearchModal';
import { SettingsModal } from '../Modals/SettingsModal';
import { AppearanceModal } from '../Modals/AppearanceModal';
import { PrintModal } from '../Modals/PrintModal';
import { TrashModal } from '../Modals/TrashModal';
import { SmartAddModal } from '../Modals/SmartAddModal';
import { Sparkles } from 'lucide-react';

const VIEW_LABELS: Record<CalendarView, string> = {
  timeGridDay: 'Day',
  timeGridWeek: 'Week',
  dayGridMonth: 'Month',
};

const Navbar: React.FC = () => {
  const {
    currentDate,
    selectedView,
    user,
    setCurrentDate,
    setSelectedView,
    toggleSidebar,
  } = useCalendarStore();
  const logout = useLogout();
  const [viewMenuOpen, setViewMenuOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [isAppearanceOpen, setIsAppearanceOpen] = React.useState(false);
  const [isPrintOpen, setIsPrintOpen] = React.useState(false);
  const [isTrashOpen, setIsTrashOpen] = React.useState(false);
  const [isSmartAddOpen, setIsSmartAddOpen] = React.useState(false);
  const [settingsMenuOpen, setSettingsMenuOpen] = React.useState(false);
  const viewMenuRef = React.useRef<HTMLDivElement>(null);
  const userMenuRef = React.useRef<HTMLDivElement>(null);
  const settingsMenuRef = React.useRef<HTMLDivElement>(null);

  // Close menus on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (viewMenuRef.current && !viewMenuRef.current.contains(e.target as Node)) {
        setViewMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(e.target as Node)) {
        setSettingsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navigateBack = () => {
    if (selectedView === 'dayGridMonth') {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (selectedView === 'timeGridWeek') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subDays(currentDate, 1));
    }
  };

  const navigateForward = () => {
    if (selectedView === 'dayGridMonth') {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (selectedView === 'timeGridWeek') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getHeaderText = (): string => {
    if (selectedView === 'dayGridMonth') {
      return format(currentDate, 'MMMM yyyy');
    }
    if (selectedView === 'timeGridDay') {
      return format(currentDate, 'MMMM d, yyyy');
    }
    return format(currentDate, 'MMMM yyyy');
  };

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <header className="h-16 border-b border-gc-gray-200 bg-white flex items-center px-4 z-50 no-print flex-shrink-0">
      {/* Left section */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={toggleSidebar}
          className="btn-icon"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} className="text-gc-gray-600" />
        </button>

        <div className="flex items-center gap-1 ml-1">
          <div className="w-9 h-9 flex items-center justify-center">
            <svg viewBox="0 0 36 36" width="36" height="36">
              <rect x="2" y="6" width="32" height="28" rx="4" fill="#fff" stroke="#4285f4" strokeWidth="2" />
              <rect x="2" y="6" width="32" height="8" rx="4" fill="#4285f4" />
              <rect x="10" y="2" width="3" height="8" rx="1.5" fill="#4285f4" />
              <rect x="23" y="2" width="3" height="8" rx="1.5" fill="#4285f4" />
              <text x="18" y="28" textAnchor="middle" fontSize="13" fontWeight="500" fill="#4285f4">
                {format(new Date(), 'd')}
              </text>
            </svg>
          </div>
          <h1 className="text-[22px] font-google-sans text-gc-gray-700 font-normal tracking-tight hidden sm:block">
            Calendar
          </h1>
        </div>
      </div>

      {/* Center section */}
      <div className="flex items-center gap-1 md:gap-2 ml-2 md:ml-6 flex-1 min-w-0">
        <button
          onClick={goToToday}
          className="px-2 md:px-4 py-1.5 border border-gc-gray-300 rounded text-xs md:text-sm font-medium text-gc-gray-700 hover:bg-gc-gray-50 transition-colors"
        >
          Today
        </button>

        <button onClick={navigateBack} className="btn-icon flex-shrink-0" aria-label="Previous">
          <ChevronLeft size={20} className="text-gc-gray-600" />
        </button>
        <button onClick={navigateForward} className="btn-icon flex-shrink-0" aria-label="Next">
          <ChevronRight size={20} className="text-gc-gray-600" />
        </button>

        <h2 className="text-lg md:text-[22px] font-google-sans text-gc-gray-900 font-normal ml-1 md:ml-2 truncate">
          {getHeaderText()}
        </h2>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-1 ml-auto">
        <button 
          className="btn-icon hidden sm:flex text-indigo-500 hover:bg-indigo-50" 
          aria-label="Smart Add"
          onClick={() => setIsSmartAddOpen(true)}
          title="Smart Add (Natural Language)"
        >
          <Sparkles size={20} />
        </button>

        <button 
          className="btn-icon hidden sm:flex" 
          aria-label="Search"
          onClick={() => setIsSearchOpen(true)}
        >
          <Search size={20} className="text-gc-gray-600" />
        </button>

        {/* View switcher */}
        <div className="relative" ref={viewMenuRef}>
          <button
            onClick={() => setViewMenuOpen(!viewMenuOpen)}
            className="px-4 py-1.5 border border-gc-gray-300 rounded text-sm font-medium text-gc-gray-700 hover:bg-gc-gray-50 transition-colors flex items-center gap-1"
          >
            {VIEW_LABELS[selectedView]}
            <ChevronLeft size={14} className="rotate-[-90deg] text-gc-gray-600" />
          </button>

          {viewMenuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gc-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[120px] animate-fadeIn">
              {(Object.entries(VIEW_LABELS) as [CalendarView, string][]).map(([view, label]) => (
                <button
                  key={view}
                  onClick={() => {
                    setSelectedView(view);
                    setViewMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gc-gray-50 transition-colors ${
                    selectedView === view
                      ? 'text-gc-blue font-medium bg-gc-blue/5'
                      : 'text-gc-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Settings Dropdown */}
        <div className="relative" ref={settingsMenuRef}>
          <button 
            className="btn-icon hidden sm:flex" 
            aria-label="Settings"
            onClick={() => setSettingsMenuOpen(!settingsMenuOpen)}
          >
            <Settings size={20} className="text-gc-gray-600" />
          </button>

          {settingsMenuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gc-gray-200 rounded-lg shadow-lg py-2 z-50 min-w-[200px] animate-fadeIn">
              <button
                onClick={() => {
                  setIsSettingsOpen(true);
                  setSettingsMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gc-gray-700 hover:bg-gc-gray-50 transition-colors"
              >
                Settings
              </button>
              <button
                onClick={() => {
                  setIsTrashOpen(true);
                  setSettingsMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gc-gray-700 hover:bg-gc-gray-50 transition-colors"
              >
                Trash
              </button>
              <div className="my-1 border-t border-gc-gray-200"></div>
              <button
                onClick={() => {
                  setIsAppearanceOpen(true);
                  setSettingsMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gc-gray-700 hover:bg-gc-gray-50 transition-colors"
              >
                Appearance
              </button>
              <button
                onClick={() => {
                  setIsPrintOpen(true);
                  setSettingsMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gc-gray-700 hover:bg-gc-gray-50 transition-colors"
              >
                Print
              </button>
            </div>
          )}
        </div>

        {/* User avatar */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-8 h-8 rounded-full bg-gc-blue text-white flex items-center justify-center text-sm font-medium ml-2 hover:opacity-90 transition-opacity"
            aria-label="User menu"
          >
            {userInitial}
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gc-gray-200 rounded-lg shadow-lg py-2 z-50 min-w-[200px] animate-fadeIn">
              <div className="px-4 py-2 border-b border-gc-gray-200">
                <p className="text-sm font-medium text-gc-gray-900">{user?.name}</p>
                <p className="text-xs text-gc-gray-600">{user?.email}</p>
              </div>
              <button
                onClick={() => {
                  logout();
                  setUserMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gc-gray-700 hover:bg-gc-gray-50 transition-colors flex items-center gap-2"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      <SmartAddModal
        isOpen={isSmartAddOpen}
        onClose={() => setIsSmartAddOpen(false)}
      />
      <SearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
      <AppearanceModal
        isOpen={isAppearanceOpen}
        onClose={() => setIsAppearanceOpen(false)}
      />
      <PrintModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
      />
      <TrashModal
        isOpen={isTrashOpen}
        onClose={() => setIsTrashOpen(false)}
      />
    </header>
  );
};

export default Navbar;
