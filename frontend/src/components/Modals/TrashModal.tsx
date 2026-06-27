import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/eventsApi';
import type { CalendarEvent } from '../../types';
import { X, RotateCcw, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface TrashModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TrashModal({ isOpen, onClose }: TrashModalProps) {
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery<CalendarEvent[]>({
    queryKey: ['trashEvents'],
    queryFn: async () => {
      const res = await api.get('/events/trash');
      return res.data.events;
    },
    enabled: isOpen,
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/events/${id}/restore`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trashEvents'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event restored');
    },
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/events/${id}/permanent`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trashEvents'] });
      toast.success('Event permanently deleted');
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex bg-white dark:bg-[#202124] animate-fadeIn">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 h-16 border-b border-gc-gray-200 dark:border-gray-700 bg-white dark:bg-[#202124] flex items-center px-4 z-10">
        <button
          onClick={onClose}
          className="p-3 rounded-full hover:bg-gc-gray-100 dark:hover:bg-gray-800 transition-colors mr-2"
        >
          <ArrowLeft size={20} className="text-gc-gray-600 dark:text-gray-400" />
        </button>
        <h1 className="text-xl font-google-sans text-gc-gray-900 dark:text-gray-100 flex-1">Trash</h1>
      </div>

      <div className="flex-1 overflow-y-auto mt-16 p-4 sm:p-8 flex justify-center">
        <div className="w-full max-w-4xl">
          <p className="text-sm text-gc-gray-600 dark:text-gray-400 mb-6">
            Events in trash are permanently deleted after 30 days.
          </p>

          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 size={32} className="animate-spin text-gc-blue" />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center p-12 text-gc-gray-500 dark:text-gray-400">
              No events in trash.
            </div>
          ) : (
            <div className="border border-gc-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-[#202124]">
              <table className="w-full text-left">
                <thead className="bg-gc-gray-50 dark:bg-[#303134] text-sm text-gc-gray-600 dark:text-gray-400 border-b border-gc-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-3 font-medium">Title</th>
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium">Calendar</th>
                    <th className="px-6 py-3 font-medium w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gc-gray-200 dark:divide-gray-700">
                  {events.map((event) => (
                    <tr key={event.id} className="hover:bg-gc-gray-50 dark:hover:bg-gray-800/50 group">
                      <td className="px-6 py-4 text-sm font-medium text-gc-gray-900 dark:text-gray-200">
                        {event.title || '(No title)'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gc-gray-500 dark:text-gray-400">
                        {format(new Date(event.startUtc), 'PPp')}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: event.color || '#4285F4' }}
                          ></div>
                          <span className="text-gc-gray-600 dark:text-gray-400">My Calendar</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => restoreMutation.mutate(event.id)}
                            disabled={restoreMutation.isPending}
                            className="p-1.5 text-gc-blue hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                            title="Restore"
                          >
                            <RotateCcw size={18} />
                          </button>
                          <button
                            onClick={() => permanentDeleteMutation.mutate(event.id)}
                            disabled={permanentDeleteMutation.isPending}
                            className="p-1.5 text-gc-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                            title="Delete permanently"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
