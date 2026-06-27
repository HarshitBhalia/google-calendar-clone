import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Calendar as CalendarIcon, Clock, X, Loader2 } from 'lucide-react';
import * as chrono from 'chrono-node';
import { format } from 'date-fns';
import { useCreateEvent, useCalendars } from '../../hooks/useEvents';
import { getTimezone } from '../../utils/timezone';
import type { CreateEventPayload } from '../../types';

interface SmartAddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SmartAddModal: React.FC<SmartAddModalProps> = ({ isOpen, onClose }) => {
  const [text, setText] = useState('');
  const [parsedInfo, setParsedInfo] = useState<{
    title: string;
    start: Date | null;
    end: Date | null;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const { data: calendars = [] } = useCalendars();
  const createMutation = useCreateEvent();

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setText('');
      setParsedInfo(null);
    }
  }, [isOpen]);

  // Parse natural language as user types
  useEffect(() => {
    if (!text.trim()) {
      setParsedInfo(null);
      return;
    }

    // Parse the string for date/time references
    const results = chrono.parse(text);

    if (results.length > 0) {
      const result = results[0];
      const parsedStart = result.start.date();
      const parsedEnd = result.end ? result.end.date() : null;

      // Extract title by removing the parsed date string from the original text
      let title = text.replace(result.text, '').trim();
      // Remove any trailing or leading prepositions left behind (e.g., "at", "on", "for")
      title = title.replace(/^(at|on|for|from|to|by)\s+/i, '');
      title = title.replace(/\s+(at|on|for|from|to|by)$/i, '');
      
      if (!title) {
        title = 'Event';
      }

      setParsedInfo({
        title,
        start: parsedStart,
        end: parsedEnd,
      });
    } else {
      setParsedInfo({
        title: text,
        start: null,
        end: null,
      });
    }
  }, [text]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!parsedInfo?.start || !text.trim() || createMutation.isPending) return;

    const calendarId = calendars[0]?.id;
    if (!calendarId) return;

    // Default to 1 hour event if no end time specified
    const endUtc = parsedInfo.end 
      ? parsedInfo.end.toISOString() 
      : new Date(parsedInfo.start.getTime() + 60 * 60 * 1000).toISOString();

    const payload: CreateEventPayload = {
      title: parsedInfo.title || '(No title)',
      startUtc: parsedInfo.start.toISOString(),
      endUtc,
      isAllDay: false, // Smart add generally assumes timed events unless we add more advanced parsing
      calendarId,
      timezone: getTimezone(),
    };

    createMutation.mutate(
      { payload },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm transition-all duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fadeIn border border-gc-gray-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-1">
          <div className="bg-white p-4 flex items-center justify-between rounded-t-[14px]">
            <div className="flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 font-bold text-lg">
              <Sparkles className="text-indigo-500" size={20} />
              Smart Add
            </div>
            <button onClick={onClose} className="p-1 hover:bg-gc-gray-100 rounded-full text-gc-gray-500 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Main Input */}
          <div className="mb-6">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g., Lunch with Sarah tomorrow at 1pm at Starbucks"
              className="w-full text-xl md:text-2xl text-gc-gray-900 placeholder:text-gc-gray-400 outline-none border-b-2 border-transparent focus:border-purple-400 pb-2 transition-colors bg-transparent"
              autoFocus
            />
          </div>

          {/* Live Preview Area */}
          <div className="bg-gc-gray-50 rounded-xl p-4 border border-gc-gray-100 min-h-[100px] flex flex-col justify-center transition-all duration-300">
            {parsedInfo && parsedInfo.start ? (
              <div className="animate-fadeIn">
                <p className="text-sm text-gc-gray-500 font-medium mb-1 uppercase tracking-wider">Preview</p>
                <h3 className="text-lg font-semibold text-gc-gray-900 mb-2 truncate">
                  {parsedInfo.title}
                </h3>
                <div className="flex items-center gap-4 text-sm text-gc-gray-700">
                  <div className="flex items-center gap-1.5">
                    <CalendarIcon size={16} className="text-purple-500" />
                    <span>{format(parsedInfo.start, 'EEEE, MMMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={16} className="text-indigo-500" />
                    <span>
                      {format(parsedInfo.start, 'h:mm a')}
                      {parsedInfo.end && ` - ${format(parsedInfo.end, 'h:mm a')}`}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gc-gray-400">
                <Sparkles size={24} className="mx-auto mb-2 opacity-30" />
                <p>Type a sentence and watch the magic happen...</p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gc-gray-600 font-medium hover:bg-gc-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!parsedInfo?.start || createMutation.isPending}
              className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 disabled:hover:shadow-none flex items-center gap-2"
            >
              {createMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
              Add to Calendar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
