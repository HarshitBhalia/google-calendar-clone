import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useCreateEvent, useUpdateEvent } from '../../hooks/useEvents';
import { formatDateRange, utcToLocal } from '../../utils/timezone';
import type { CalendarEvent, CreateEventPayload, UpdateEventPayload, OverlapWarning } from '../../types';

interface OverlapWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  warning: OverlapWarning | null;
  payload: CreateEventPayload | UpdateEventPayload | null;
  isEdit: boolean;
}

const OverlapWarningModal: React.FC<OverlapWarningModalProps> = ({
  isOpen,
  onClose,
  warning,
  payload,
  isEdit,
}) => {
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();

  const handleSaveAnyway = () => {
    if (!payload) return;

    if (isEdit) {
      const updatePayload = payload as UpdateEventPayload;
      updateMutation.mutate(
        { payload: updatePayload, forceOverlap: true },
        {
          onSuccess: () => {
            onClose();
          },
        }
      );
    } else {
      const createPayload = payload as CreateEventPayload;
      createMutation.mutate(
        { payload: createPayload, forceOverlap: true },
        {
          onSuccess: () => {
            onClose();
          },
        }
      );
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (!isOpen || !warning) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 modal-content overflow-hidden">
        {/* Header */}
        <div className="p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={24} className="text-yellow-600" />
          </div>
          <h2 className="text-lg font-google-sans font-medium text-gc-gray-900 mb-2">
            Schedule Conflict
          </h2>
          <p className="text-sm text-gc-gray-600">
            This event overlaps with:
          </p>
        </div>

        {/* Overlapping events list */}
        <div className="px-6 pb-4">
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {warning.overlaps.map((overlap: CalendarEvent) => {
              const start = utcToLocal(overlap.startUtc);
              const end = utcToLocal(overlap.endUtc);
              const dateRange = overlap.isAllDay
                ? 'All day'
                : formatDateRange(start, end);

              return (
                <div
                  key={overlap.id}
                  className="flex items-start gap-3 p-3 bg-gc-gray-50 rounded-lg"
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: overlap.color || '#1a73e8' }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gc-gray-900 truncate">
                      {overlap.title}
                    </p>
                    <p className="text-xs text-gc-gray-600">{dateRange}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 pb-6">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveAnyway}
            disabled={isSubmitting}
            className="btn-primary flex items-center gap-2"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            Save Anyway
          </button>
        </div>
      </div>
    </div>
  );
};

export default OverlapWarningModal;
