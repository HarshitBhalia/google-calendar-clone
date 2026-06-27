import React, { useState } from 'react';
import { X, CheckCircle2, AlignLeft, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { toLocalISODate } from '../../utils/timezone';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TaskModal({ isOpen, onClose }: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(toLocalISODate(new Date()));
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
        <div className="flex items-center justify-between px-6 py-4 bg-blue-600 border-b border-blue-700">
          <h2 className="text-lg font-google-sans font-medium text-white flex items-center gap-2">
            <CheckCircle2 size={20} />
            New Task
          </h2>
          <button onClick={onClose} className="text-blue-100 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add title"
            className="w-full text-xl font-google-sans text-gc-gray-900 border-0 border-b-2 border-gc-gray-200 focus:border-blue-600 outline-none pb-2 transition-colors placeholder:text-gc-gray-400"
            autoFocus
          />

          <div className="flex items-center gap-2 text-gc-gray-700">
            <CalendarIcon size={18} className="text-gc-gray-500" />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="input-base w-auto"
            />
          </div>

          <div className="flex items-start gap-2">
            <AlignLeft size={18} className="text-gc-gray-500 mt-2" />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details"
              rows={4}
              className="input-base resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gc-gray-200">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Save Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
