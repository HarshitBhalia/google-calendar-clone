import React from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCalendarStore } from '../../store/calendarStore';

const DAY_NAMES = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const MiniCalendar: React.FC = () => {
  const { currentDate, setCurrentDate, setSelectedView } = useCalendarStore();
  const [displayMonth, setDisplayMonth] = React.useState<Date>(currentDate);

  // Sync display month when currentDate changes externally
  React.useEffect(() => {
    setDisplayMonth(currentDate);
  }, [currentDate]);

  const monthStart = startOfMonth(displayMonth);
  const monthEnd = endOfMonth(displayMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const handlePrevMonth = () => {
    setDisplayMonth(subMonths(displayMonth, 1));
  };

  const handleNextMonth = () => {
    setDisplayMonth(addMonths(displayMonth, 1));
  };

  const handleDayClick = (day: Date) => {
    setCurrentDate(day);
    setSelectedView('timeGridDay');
  };

  return (
    <div className="px-3 py-2">
      {/* Month/Year header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gc-gray-900 font-google-sans">
          {format(displayMonth, 'MMMM yyyy')}
        </span>
        <div className="flex items-center gap-0">
          <button
            onClick={handlePrevMonth}
            className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-gc-gray-200/60 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft size={14} className="text-gc-gray-600" />
          </button>
          <button
            onClick={handleNextMonth}
            className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-gc-gray-200/60 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight size={14} className="text-gc-gray-600" />
          </button>
        </div>
      </div>

      {/* Day name headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map((day, idx) => (
          <div
            key={idx}
            className="text-center text-[10px] font-medium text-gc-gray-600 py-0.5"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const inMonth = isSameMonth(day, displayMonth);
          const today = isToday(day);
          const selected = isSameDay(day, currentDate) && !today;

          return (
            <button
              key={idx}
              onClick={() => handleDayClick(day)}
              className={`
                w-7 h-7 flex items-center justify-center text-[11px] rounded-full transition-colors
                ${!inMonth ? 'text-gc-gray-400' : 'text-gc-gray-900'}
                ${today ? 'bg-gc-blue text-white font-medium' : ''}
                ${selected ? 'border border-gc-blue text-gc-blue font-medium' : ''}
                ${!today && !selected ? 'hover:bg-gc-gray-100' : ''}
              `}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MiniCalendar;
