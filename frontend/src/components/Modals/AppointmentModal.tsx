import React, { useState } from 'react';
import { X, CalendarPlus, Clock, AlignLeft, Loader2 } from 'lucide-react';
import { toLocalISODate, toLocalISOTime } from '../../utils/timezone';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppointmentModal({ isOpen, onClose }: AppointmentModalProps) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(toLocalISODate(new Date()));
  const [startTime, setStartTime] = useState(toLocalISOTime(new Date()));
  const [endTime, setEndTime] = useState(toLocalISOTime(new Date(Date.now() + 60 * 60 * 1000)));
  const [duration, setDuration] = useState('30');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Placeholder for backend submission
    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-fadeIn">
        <div className="flex items-center justify-between px-6 py-4 bg-purple-600 border-b border-purple-700">
          <h2 className="text-lg font-google-sans font-medium text-white flex items-center gap-2">
            <CalendarPlus size={20} />
            Appointment Schedule
          </h2>
          <button onClick={onClose} className="text-purple-100 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add schedule title"
            className="w-full text-xl font-google-sans text-gc-gray-900 border-0 border-b-2 border-gc-gray-200 focus:border-purple-600 outline-none pb-2 transition-colors placeholder:text-gc-gray-400"
            autoFocus
          />

          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-gc-gray-500 flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gc-gray-700 w-24">Availability:</span>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-base w-auto" />
                </div>
                <div className="flex items-center gap-2 pl-26">
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="input-base w-auto" />
                  <span className="text-gc-gray-400">to</span>
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="input-base w-auto" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-7 pt-2 border-t border-gc-gray-100">
              <span className="text-sm font-medium text-gc-gray-700 w-24">Slot duration:</span>
              <select value={duration} onChange={(e) => setDuration(e.target.value)} className="input-base w-auto">
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">1 hour</option>
              </select>
            </div>
          </div>

          <div className="flex items-start gap-2 pt-4">
            <AlignLeft size={18} className="text-gc-gray-500 mt-2" />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Booking page description"
              rows={3}
              className="input-base resize-none flex-1"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gc-gray-200">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Save Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
