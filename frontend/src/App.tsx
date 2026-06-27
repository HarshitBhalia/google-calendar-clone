import React, { useState, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useCalendarStore } from './store/calendarStore';
import Navbar from './components/Navbar/Navbar';
import Sidebar from './components/Sidebar/Sidebar';
import CalendarMain from './components/Calendar/CalendarMain';
import EventModal from './components/Modals/EventModal';
import EventPopover from './components/Modals/EventPopover';
import OverlapWarningModal from './components/Modals/OverlapWarningModal';
import LoginPage from './components/Auth/LoginPage';
import RegisterPage from './components/Auth/RegisterPage';
import type { CalendarEvent, CreateEventPayload, UpdateEventPayload, OverlapWarning } from './types';
import { TaskModal } from './components/Modals/TaskModal';
import { AppointmentModal } from './components/Modals/AppointmentModal';
import { CreateEventPopover } from './components/Modals/CreateEventPopover';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

type AuthPage = 'login' | 'register';

const AppContent: React.FC = () => {
  const token = useCalendarStore((s) => s.token);

  // Auth page state
  const [authPage, setAuthPage] = useState<AuthPage>('login');

  // Event modal state
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [modalInitialStart, setModalInitialStart] = useState<Date | undefined>();
  const [modalInitialEnd, setModalInitialEnd] = useState<Date | undefined>();

  // Event popover state
  const [popoverEvent, setPopoverEvent] = useState<CalendarEvent | null>(null);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });

  // Create event popover state
  const [createPopoverOpen, setCreatePopoverOpen] = useState(false);
  const [createPopoverPosition, setCreatePopoverPosition] = useState<{ x: number; y: number } | null>(null);
  const [createPopoverIsAllDay, setCreatePopoverIsAllDay] = useState(false);

  // Overlap warning state
  const [overlapWarningOpen, setOverlapWarningOpen] = useState(false);
  const [overlapWarning, setOverlapWarning] = useState<OverlapWarning | null>(null);
  const [overlapPayload, setOverlapPayload] = useState<CreateEventPayload | UpdateEventPayload | null>(null);
  const [overlapIsEdit, setOverlapIsEdit] = useState(false);

  // Open event modal for creating new event (from sidebar "Create" button)
  const handleCreateEvent = useCallback(() => {
    setEditingEvent(null);
    setModalInitialStart(undefined);
    setModalInitialEnd(undefined);
    setEventModalOpen(true);
  }, []);

  const handleCreateTask = useCallback(() => {
    setTaskModalOpen(true);
  }, []);

  const handleCreateAppointment = useCallback(() => {
    setAppointmentModalOpen(true);
  }, []);

  // Open event popover from date selection on calendar
  const handleDateSelect = useCallback((start: Date, end: Date, allDay: boolean, jsEvent?: MouseEvent) => {
    setEditingEvent(null);
    setModalInitialStart(start);
    setModalInitialEnd(end);
    setCreatePopoverIsAllDay(allDay);
    
    // Fallback to center screen if jsEvent is missing
    const x = jsEvent ? jsEvent.clientX : window.innerWidth / 2 - 250;
    const y = jsEvent ? jsEvent.clientY : window.innerHeight / 2 - 250;
    
    setCreatePopoverPosition({ x, y });
    setCreatePopoverOpen(true);
  }, []);

  // Open event popover on event click
  const handleEventClick = useCallback((event: CalendarEvent, jsEvent: MouseEvent) => {
    setPopoverEvent(event);
    setPopoverPosition({ x: jsEvent.clientX, y: jsEvent.clientY });
  }, []);

  // Close popover and open edit modal
  const handleEditFromPopover = useCallback((event: CalendarEvent) => {
    setPopoverEvent(null);
    setEditingEvent(event);
    setModalInitialStart(undefined);
    setModalInitialEnd(undefined);
    setEventModalOpen(true);
  }, []);

  // Handle overlap warning from EventModal
  const handleOverlapWarning = useCallback(
    (warning: OverlapWarning, payload: CreateEventPayload | UpdateEventPayload, isEdit: boolean) => {
      setOverlapWarning(warning);
      setOverlapPayload(payload);
      setOverlapIsEdit(isEdit);
      setOverlapWarningOpen(true);
    },
    []
  );

  // Close overlap warning and event modal
  const handleOverlapClose = useCallback(() => {
    setOverlapWarningOpen(false);
    setOverlapWarning(null);
    setOverlapPayload(null);
    setEventModalOpen(false);
  }, []);

  // If not authenticated, show auth pages
  if (!token) {
    if (authPage === 'register') {
      return <RegisterPage onSwitchToLogin={() => setAuthPage('login')} />;
    }
    return <LoginPage onSwitchToRegister={() => setAuthPage('register')} />;
  }

  // Main calendar layout
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          onCreateEvent={handleCreateEvent} 
          onCreateTask={handleCreateTask}
          onCreateAppointment={handleCreateAppointment}
        />
        <CalendarMain
          onDateSelect={handleDateSelect}
          onEventClick={handleEventClick}
        />
      </div>

      {/* Event Modal */}
      <EventModal
        isOpen={eventModalOpen}
        onClose={() => {
          setEventModalOpen(false);
          setEditingEvent(null);
        }}
        editEvent={editingEvent}
        initialStart={modalInitialStart}
        initialEnd={modalInitialEnd}
        onOverlapWarning={handleOverlapWarning}
      />

      {/* Task Modal */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
      />

      {/* Appointment Schedule Modal */}
      <AppointmentModal
        isOpen={appointmentModalOpen}
        onClose={() => setAppointmentModalOpen(false)}
      />

      {/* Event Popover (existing for viewing/editing) */}
      <EventPopover
        event={popoverEvent}
        position={popoverPosition}
        onClose={() => setPopoverEvent(null)}
        onEdit={handleEditFromPopover}
      />

      {/* Inline Create Event Popover */}
      {createPopoverOpen && (
        <CreateEventPopover
          position={createPopoverPosition}
          initialStart={modalInitialStart || null}
          initialEnd={modalInitialEnd || null}
          isAllDay={createPopoverIsAllDay}
          onClose={() => setCreatePopoverOpen(false)}
          onSaveSuccess={() => setCreatePopoverOpen(false)}
          onMoreOptions={(title) => {
            // Save the title locally to a draft, or just pass it 
            // In a real app we'd pass title to EventModal. 
            // For now, EventModal uses draft logic or opens fresh
            setCreatePopoverOpen(false);
            setEventModalOpen(true);
          }}
        />
      )}

      {/* Overlap Warning Modal */}
      <OverlapWarningModal
        isOpen={overlapWarningOpen}
        onClose={handleOverlapClose}
        warning={overlapWarning}
        payload={overlapPayload}
        isEdit={overlapIsEdit}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster
        position="bottom-left"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#323232',
            color: '#fff',
            fontSize: '14px',
            borderRadius: '8px',
            padding: '12px 16px',
          },
          success: {
            iconTheme: {
              primary: '#0f9d58',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#d93025',
              secondary: '#fff',
            },
          },
        }}
      />
      <AppContent />
    </QueryClientProvider>
  );
};

export default App;
