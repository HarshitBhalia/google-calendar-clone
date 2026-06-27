import React, { useState, useEffect } from 'react';
import { Search, X, Calendar as CalendarIcon, Clock, MapPin, ChevronDown, Filter } from 'lucide-react';
import { useSearchEvents } from '../../hooks/useEvents';
import { useCalendarStore } from '../../store/calendarStore';
import { formatTime } from '../../utils/timezone';
import type { CalendarEvent } from '../../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [query, setQuery] = useState('');
  
  // Advanced fields
  const [what, setWhat] = useState('');
  const [who, setWho] = useState('');
  const [where, setWhere] = useState('');
  const [doesNotHave, setDoesNotHave] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [debouncedParams, setDebouncedParams] = useState<Omit<import('../../api/eventsApi').SearchQuery, 'timezone'>>({ q: '' });
  const { setCurrentDate, setSelectedView } = useCalendarStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAdvanced) {
        setDebouncedParams({
          q: query,
          what,
          who,
          where,
          not: doesNotHave,
          from: fromDate,
          to: toDate,
        });
      } else {
        setDebouncedParams({ q: query });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, isAdvanced, what, who, where, doesNotHave, fromDate, toDate]);

  const { data: events, isLoading } = useSearchEvents(debouncedParams);

  const handleResultClick = (event: CalendarEvent) => {
    setCurrentDate(new Date(event.startUtc));
    setSelectedView('timeGridDay');
    onClose();
  };

  const handleReset = () => {
    setQuery('');
    setWhat('');
    setWho('');
    setWhere('');
    setDoesNotHave('');
    setFromDate('');
    setToDate('');
  };

  if (!isOpen) return null;

  const hasSearch = Object.values(debouncedParams).some((val) => val && val.trim().length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/50">
      <div className="bg-[#202124] rounded-lg shadow-xl w-full max-w-3xl overflow-hidden animate-fadeIn flex flex-col max-h-[80vh] border border-[#3c4043]">
        
        {/* Basic Search Input Area */}
        <div className="flex items-center px-4 py-3 border-b border-[#3c4043]">
          <Search size={20} className="text-gray-400 mr-3 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="flex-1 text-base outline-none bg-transparent text-gray-200 placeholder:text-gray-500"
            autoFocus
          />
          
          <button
            onClick={() => setIsAdvanced(!isAdvanced)}
            className="p-2 ml-2 rounded transition-colors text-gray-400 hover:bg-gray-800"
            title="Advanced search"
          >
            <ChevronDown size={18} className={`transition-transform ${isAdvanced ? 'rotate-180' : ''}`} />
          </button>
          
          <button
            onClick={onClose}
            className="p-2 ml-1 rounded transition-colors text-gray-400 hover:bg-gray-800"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Advanced Search Form */}
        {isAdvanced && (
          <div className="p-6 bg-[#202124] border-b border-[#3c4043] space-y-5">
            <div className="grid grid-cols-[120px_1fr] items-center gap-6">
              <label className="text-sm text-gray-300 font-medium">Search in</label>
              <button className="flex items-center justify-between w-[200px] bg-[#303134] text-gray-200 px-3 py-1.5 rounded border border-transparent hover:bg-[#3c4043] focus:border-[#8ab4f8]">
                <div className="flex items-center gap-2">
                  <span className="text-gray-200 text-sm">✓ Active calendars</span>
                </div>
                <ChevronDown size={16} className="text-gray-500" />
              </button>
            </div>
            
            <div className="grid grid-cols-[120px_1fr] items-center gap-6">
              <label className="text-sm text-gray-300 font-medium">What</label>
              <input
                type="text"
                value={what}
                onChange={(e) => setWhat(e.target.value)}
                placeholder="Keywords contained in event"
                className="w-full bg-[#303134] text-gray-200 px-3 py-2 rounded text-sm placeholder:text-gray-500 border border-transparent focus:border-[#8ab4f8] focus:bg-[#202124] outline-none transition-colors"
              />
            </div>
            
            <div className="grid grid-cols-[120px_1fr] items-center gap-6">
              <label className="text-sm text-gray-300 font-medium">Who</label>
              <input
                type="text"
                value={who}
                onChange={(e) => setWho(e.target.value)}
                placeholder="Enter a participant, organizer, or creator"
                className="w-full bg-[#303134] text-gray-200 px-3 py-2 rounded text-sm placeholder:text-gray-500 border border-transparent focus:border-[#8ab4f8] focus:bg-[#202124] outline-none transition-colors"
              />
            </div>
            
            <div className="grid grid-cols-[120px_1fr] items-center gap-6">
              <label className="text-sm text-gray-300 font-medium">Where</label>
              <input
                type="text"
                value={where}
                onChange={(e) => setWhere(e.target.value)}
                placeholder="Enter a location or room"
                className="w-full bg-[#303134] text-gray-200 px-3 py-2 rounded text-sm placeholder:text-gray-500 border border-transparent focus:border-[#8ab4f8] focus:bg-[#202124] outline-none transition-colors"
              />
            </div>
            
            <div className="grid grid-cols-[120px_1fr] items-center gap-6">
              <label className="text-sm text-gray-300 font-medium">Doesn't have</label>
              <input
                type="text"
                value={doesNotHave}
                onChange={(e) => setDoesNotHave(e.target.value)}
                placeholder="Keywords not contained in event"
                className="w-full bg-[#303134] text-gray-200 px-3 py-2 rounded text-sm placeholder:text-gray-500 border border-transparent focus:border-[#8ab4f8] focus:bg-[#202124] outline-none transition-colors"
              />
            </div>
            
            <div className="grid grid-cols-[120px_1fr] items-center gap-6">
              <label className="text-sm text-gray-300 font-medium">Date</label>
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-[150px] bg-[#303134] text-gray-200 px-3 py-2 rounded text-sm placeholder:text-gray-500 border border-transparent focus:border-[#8ab4f8] focus:bg-[#202124] outline-none transition-colors [color-scheme:dark]"
                />
                <span className="text-sm text-gray-300">to</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-[150px] bg-[#303134] text-gray-200 px-3 py-2 rounded text-sm placeholder:text-gray-500 border border-transparent focus:border-[#8ab4f8] focus:bg-[#202124] outline-none transition-colors [color-scheme:dark]"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-6 pt-4 pr-2">
              <button onClick={handleReset} className="text-[#8ab4f8] text-sm font-medium hover:bg-white/10 px-4 py-2 rounded transition-colors">
                Reset
              </button>
              <button onClick={() => setIsAdvanced(false)} className="text-[#8ab4f8] text-sm font-medium hover:bg-white/10 px-4 py-2 rounded transition-colors">
                Search
              </button>
            </div>
          </div>
        )}

        {/* Results Area */}
        <div className="overflow-y-auto flex-1 p-2 bg-[#202124]">
          {isLoading && hasSearch ? (
            <div className="p-8 text-center text-gray-500">Searching...</div>
          ) : events && events.length > 0 ? (
            <div className="space-y-1">
              {events.map((event) => {
                const startDate = new Date(event.startUtc);
                const endDate = new Date(event.endUtc);
                
                return (
                  <button
                    key={event.id}
                    onClick={() => handleResultClick(event)}
                    className="w-full text-left p-3 hover:bg-white/5 rounded-lg transition-colors group flex items-start gap-4"
                  >
                    <div 
                      className="w-3 h-3 rounded-full mt-1.5 shrink-0" 
                      style={{ backgroundColor: event.color || '#8ab4f8' }}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-200 truncate">
                        {event.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <CalendarIcon size={12} />
                          {startDate.toLocaleDateString()}
                        </div>
                        {!event.isAllDay && (
                          <div className="flex items-center gap-1">
                            <Clock size={12} />
                            {formatTime(startDate)} - {formatTime(endDate)}
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin size={12} />
                            <span className="truncate max-w-[150px]">{event.location}</span>
                          </div>
                        )}
                      </div>
                      {event.description && (
                        <p className="mt-1 text-xs text-gray-400 line-clamp-1">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : hasSearch ? (
            <div className="p-8 text-center text-gray-500">
              No results found
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              Type to search for events...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
