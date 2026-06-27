import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useCalendarStore } from '../../store/calendarStore';
import type { CalendarView, CalendarEvent } from '../../types';
import { useCreateCalendar, useCalendars } from '../../hooks/useEvents';
import { fetchEvents, createEvent } from '../../api/eventsApi';
import { getTimezone, combineDateAndTime, toLocalISODate, toLocalISOTime } from '../../utils/timezone';
import toast from 'react-hot-toast';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const {
    timeFormat,
    setTimeFormat,
    selectedView,
    setSelectedView,
    defaultDuration,
    setDefaultDuration,
    weekStartsOn,
    setWeekStartsOn,
  } = useCalendarStore();

  const [generalExpanded, setGeneralExpanded] = useState(true);
  const [addCalendarExpanded, setAddCalendarExpanded] = useState(true);
  const [importExportExpanded, setImportExportExpanded] = useState(true);
  
  const [activeSection, setActiveSection] = useState('language');

  // Dummy states for UI placeholders
  const [language, setLanguage] = useState('English (US)');
  const [country, setCountry] = useState('United States');
  const [dateFormat, setDateFormat] = useState('12/31/2026');
  const [timezone, setTimezone] = useState('(GMT-05:00) Eastern Time - New York');
  const [askUpdateTz, setAskUpdateTz] = useState(true);
  const [showWorldClock, setShowWorldClock] = useState(false);
  const [notifications, setNotifications] = useState('Desktop notifications');
  const [playSounds, setPlaySounds] = useState(false);
  const [showDeclined, setShowDeclined] = useState(true);
  const [showWeekends, setShowWeekends] = useState(true);
  const [smartFeatures, setSmartFeatures] = useState(true);
  const [enableShortcuts, setEnableShortcuts] = useState(true);
  const [offlineEnabled, setOfflineEnabled] = useState(false);

  // Add Calendar States
  const [newCalName, setNewCalName] = useState('');
  const [newCalDesc, setNewCalDesc] = useState('');
  const createCalendarMutation = useCreateCalendar();

  // Import Export States
  const { data: calendars = [] } = useCalendars();
  const [importCalId, setImportCalId] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (calendars.length > 0 && !importCalId) {
      setImportCalId(calendars[0].id);
    }
  }, [calendars, importCalId]);

  const contentRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to section logic
  const scrollToSection = (id: string, group: 'general' | 'addcal' | 'importexport') => {
    setActiveSection(id);
    
    if (group === 'general' && !generalExpanded) setGeneralExpanded(true);
    if (group === 'addcal' && !addCalendarExpanded) setAddCalendarExpanded(true);
    if (group === 'importexport' && !importExportExpanded) setImportExportExpanded(true);

    setTimeout(() => {
      const element = document.getElementById(`setting-section-${id}`);
      if (element && contentRef.current) {
        contentRef.current.scrollTo({
          top: element.offsetTop - 64, // offset for padding
          behavior: 'smooth'
        });
      }
    }, 50);
  };

  const handleCreateCalendar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCalName.trim()) return;
    
    // Pick a random Google Calendar color
    const colors = ['#d93025', '#e67c73', '#f4511e', '#f6bf26', '#33b679', '#0b8043', '#039be5', '#3f51b5', '#7986cb', '#8e24aa'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    createCalendarMutation.mutate(
      { name: newCalName, color },
      {
        onSuccess: () => {
          setNewCalName('');
          setNewCalDesc('');
        }
      }
    );
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      // Fetch events for a wide range to ensure we capture them
      const start = new Date(new Date().getFullYear() - 2, 0, 1).toISOString();
      const end = new Date(new Date().getFullYear() + 2, 11, 31).toISOString();
      const events = await fetchEvents(start, end, getTimezone());

      const jsonStr = JSON.stringify(events, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `google-calendar-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Calendar exported successfully');
    } catch (error) {
      toast.error('Failed to export calendar');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !importCalId) return;

    try {
      setIsImporting(true);
      const text = await file.text();
      const events = JSON.parse(text) as CalendarEvent[];

      if (!Array.isArray(events)) {
        throw new Error('Invalid JSON format');
      }

      // We'll import one by one to use the existing API
      for (const ev of events) {
        await createEvent({
          title: ev.title || '(No title)',
          description: ev.description,
          startUtc: ev.startUtc,
          endUtc: ev.endUtc,
          isAllDay: ev.isAllDay || false,
          color: ev.color,
          location: ev.location,
          calendarId: importCalId,
          recurrenceRule: ev.recurrenceRule,
          timezone: getTimezone()
        }, true); // force overlap
      }
      
      toast.success(`Successfully imported ${events.length} events`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to import events. Please ensure it is a valid JSON export.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex bg-white animate-fadeIn">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 h-16 border-b border-gc-gray-200 bg-white flex items-center px-4 z-10">
        <button
          onClick={onClose}
          className="p-3 rounded-full hover:bg-gc-gray-100 transition-colors mr-2"
        >
          <ArrowLeft size={20} className="text-gc-gray-600" />
        </button>
        <h1 className="text-xl font-google-sans text-gc-gray-900">Settings</h1>
      </div>

      <div className="flex w-full h-full pt-16">
        {/* Sidebar */}
        <div className="w-72 flex-shrink-0 border-r border-gc-gray-200 bg-gc-gray-50 overflow-y-auto hidden md:block">
          
          <div className="py-2">
            {/* General Section */}
            <button
              onClick={() => setGeneralExpanded(!generalExpanded)}
              className="w-full flex items-center justify-between px-6 py-3 text-gc-gray-800 hover:bg-gc-gray-200 transition-colors"
            >
              <span className="font-medium text-sm">General</span>
              {generalExpanded ? <ChevronUp size={18} className="text-gc-gray-500" /> : <ChevronDown size={18} className="text-gc-gray-500" />}
            </button>
            
            {generalExpanded && (
              <div className="flex flex-col relative">
                <div className="absolute left-6 top-0 bottom-0 w-[2px] bg-gc-gray-300"></div>
                <SidebarItem active={activeSection === 'language'} onClick={() => scrollToSection('language', 'general')} label="Language and region" />
                <SidebarItem active={activeSection === 'timezone'} onClick={() => scrollToSection('timezone', 'general')} label="Time zone" />
                <SidebarItem active={activeSection === 'worldclock'} onClick={() => scrollToSection('worldclock', 'general')} label="World clock" />
                <SidebarItem active={activeSection === 'eventsettings'} onClick={() => scrollToSection('eventsettings', 'general')} label="Event settings" />
                <SidebarItem active={activeSection === 'notifications'} onClick={() => scrollToSection('notifications', 'general')} label="Notification settings" />
                <SidebarItem active={activeSection === 'viewoptions'} onClick={() => scrollToSection('viewoptions', 'general')} label="View options" />
                <SidebarItem active={activeSection === 'smartfeatures'} onClick={() => scrollToSection('smartfeatures', 'general')} label="Google Workspace smart features" />
                <SidebarItem active={activeSection === 'shortcuts'} onClick={() => scrollToSection('shortcuts', 'general')} label="Keyboard shortcuts" />
                <SidebarItem active={activeSection === 'offline'} onClick={() => scrollToSection('offline', 'general')} label="Offline" />
              </div>
            )}

            {/* Add Calendar Section */}
            <button
              onClick={() => setAddCalendarExpanded(!addCalendarExpanded)}
              className="w-full flex items-center justify-between px-6 py-3 text-gc-gray-800 hover:bg-gc-gray-200 transition-colors mt-2"
            >
              <span className="font-medium text-sm">Add calendar</span>
              {addCalendarExpanded ? <ChevronUp size={18} className="text-gc-gray-500" /> : <ChevronDown size={18} className="text-gc-gray-500" />}
            </button>

            {addCalendarExpanded && (
              <div className="flex flex-col relative">
                <div className="absolute left-6 top-0 bottom-0 w-[2px] bg-gc-gray-300"></div>
                <SidebarItem active={activeSection === 'subscribe'} onClick={() => scrollToSection('subscribe', 'addcal')} label="Subscribe to calendar" />
                <SidebarItem active={activeSection === 'create'} onClick={() => scrollToSection('create', 'addcal')} label="Create new calendar" />
                <SidebarItem active={activeSection === 'browse'} onClick={() => scrollToSection('browse', 'addcal')} label="Browse calendars of interest" />
                <SidebarItem active={activeSection === 'fromurl'} onClick={() => scrollToSection('fromurl', 'addcal')} label="From URL" />
              </div>
            )}

            {/* Import & Export Section */}
            <button
              onClick={() => setImportExportExpanded(!importExportExpanded)}
              className="w-full flex items-center justify-between px-6 py-3 text-gc-gray-800 hover:bg-gc-gray-200 transition-colors mt-2"
            >
              <span className="font-medium text-sm">Import & export</span>
              {importExportExpanded ? <ChevronUp size={18} className="text-gc-gray-500" /> : <ChevronDown size={18} className="text-gc-gray-500" />}
            </button>

            {importExportExpanded && (
              <div className="flex flex-col relative">
                <div className="absolute left-6 top-0 bottom-0 w-[2px] bg-gc-gray-300"></div>
                <SidebarItem active={activeSection === 'import'} onClick={() => scrollToSection('import', 'importexport')} label="Import" />
                <SidebarItem active={activeSection === 'export'} onClick={() => scrollToSection('export', 'importexport')} label="Export" />
              </div>
            )}

          </div>
        </div>

        {/* Content Area */}
        <div ref={contentRef} className="flex-1 overflow-y-auto p-8 md:p-12 pb-32">
          <div className="max-w-3xl">
            
            <h1 className="text-3xl font-google-sans text-gc-gray-900 mb-8 border-b border-gc-gray-200 pb-4">General</h1>

            {/* General Settings */}
            <Section id="language" title="Language and region">
              <div className="space-y-4">
                <Field label="Language">
                  <select value={language} onChange={e => setLanguage(e.target.value)} className="input-base w-64">
                    <option>English (US)</option>
                    <option>English (UK)</option>
                    <option>Spanish</option>
                  </select>
                </Field>
                <Field label="Country">
                  <select value={country} onChange={e => setCountry(e.target.value)} className="input-base w-64">
                    <option>United States</option>
                    <option>United Kingdom</option>
                  </select>
                </Field>
                <Field label="Date format">
                  <select value={dateFormat} onChange={e => setDateFormat(e.target.value)} className="input-base w-64">
                    <option>12/31/2026</option>
                    <option>31/12/2026</option>
                    <option>2026-12-31</option>
                  </select>
                </Field>
                <Field label="Time format">
                  <select value={timeFormat} onChange={e => setTimeFormat(e.target.value as any)} className="input-base w-64">
                    <option value="12h">1:00 PM</option>
                    <option value="24h">13:00</option>
                  </select>
                </Field>
              </div>
            </Section>

            <Section id="timezone" title="Time zone">
              <div className="space-y-4">
                <Field label="Primary time zone">
                  <select value={timezone} onChange={e => setTimezone(e.target.value)} className="input-base w-80">
                    <option>(GMT-08:00) Pacific Time - Los Angeles</option>
                    <option>(GMT-05:00) Eastern Time - New York</option>
                    <option>(GMT+00:00) Coordinated Universal Time</option>
                    <option>(GMT+05:30) Indian Standard Time - Kolkata</option>
                  </select>
                </Field>
                <label className="flex items-center gap-2 mt-4 cursor-pointer">
                  <input type="checkbox" checked={askUpdateTz} onChange={e => setAskUpdateTz(e.target.checked)} className="checkbox-base" />
                  <span className="text-sm text-gc-gray-800">Ask to update my primary time zone to current location</span>
                </label>
              </div>
            </Section>

            <Section id="worldclock" title="World clock">
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input type="checkbox" checked={showWorldClock} onChange={e => setShowWorldClock(e.target.checked)} className="checkbox-base" />
                <span className="text-sm text-gc-gray-800 font-medium">Show world clock</span>
              </label>
              <p className="text-sm text-gc-gray-500 pl-6">See the time in other locations directly on your calendar.</p>
            </Section>

            <Section id="eventsettings" title="Event settings">
              <div className="space-y-4">
                <Field label="Default duration">
                  <select value={defaultDuration.toString()} onChange={e => setDefaultDuration(parseInt(e.target.value, 10))} className="input-base w-64">
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="90">90 minutes</option>
                    <option value="120">120 minutes</option>
                  </select>
                </Field>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="checkbox-base" />
                  <span className="text-sm text-gc-gray-800">Speedy meetings (end 5 minutes early)</span>
                </label>
              </div>
            </Section>

            <Section id="notifications" title="Notification settings">
              <div className="space-y-4">
                <Field label="Notifications">
                  <select value={notifications} onChange={e => setNotifications(e.target.value)} className="input-base w-64">
                    <option>Desktop notifications</option>
                    <option>Alerts</option>
                    <option>Off</option>
                  </select>
                </Field>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={playSounds} onChange={e => setPlaySounds(e.target.checked)} className="checkbox-base" />
                  <span className="text-sm text-gc-gray-800">Play notification sounds</span>
                </label>
              </div>
            </Section>

            <Section id="viewoptions" title="View options">
              <div className="space-y-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={showWeekends} onChange={e => setShowWeekends(e.target.checked)} className="checkbox-base" />
                  <span className="text-sm text-gc-gray-800">Show weekends</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={showDeclined} onChange={e => setShowDeclined(e.target.checked)} className="checkbox-base" />
                  <span className="text-sm text-gc-gray-800">Show declined events</span>
                </label>
                <Field label="Start week on">
                  <select value={weekStartsOn.toString()} onChange={e => setWeekStartsOn(parseInt(e.target.value, 10))} className="input-base w-64">
                    <option value="6">Saturday</option>
                    <option value="0">Sunday</option>
                    <option value="1">Monday</option>
                  </select>
                </Field>
                <Field label="Default view">
                  <select value={selectedView} onChange={e => setSelectedView(e.target.value as CalendarView)} className="input-base w-64">
                    <option value="timeGridDay">Day</option>
                    <option value="timeGridWeek">Week</option>
                    <option value="dayGridMonth">Month</option>
                  </select>
                </Field>
              </div>
            </Section>

            <Section id="smartfeatures" title="Google Workspace smart features">
              <label className="flex items-start gap-2 cursor-pointer mb-2">
                <input type="checkbox" checked={smartFeatures} onChange={e => setSmartFeatures(e.target.checked)} className="checkbox-base mt-1" />
                <div className="flex flex-col">
                  <span className="text-sm text-gc-gray-800 font-medium">Smart features and personalization</span>
                  <span className="text-sm text-gc-gray-500">Allow Gmail, Chat, and Meet to use your content.</span>
                </div>
              </label>
            </Section>

            <Section id="shortcuts" title="Keyboard shortcuts">
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={enableShortcuts} onChange={e => setEnableShortcuts(e.target.checked)} className="checkbox-base mt-1" />
                <div className="flex flex-col">
                  <span className="text-sm text-gc-gray-800 font-medium">Enable keyboard shortcuts</span>
                </div>
              </label>
            </Section>

            <Section id="offline" title="Offline">
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={offlineEnabled} onChange={e => setOfflineEnabled(e.target.checked)} className="checkbox-base mt-1" />
                <div className="flex flex-col">
                  <span className="text-sm text-gc-gray-800 font-medium">Turn on offline calendar</span>
                </div>
              </label>
            </Section>

            <h1 className="text-3xl font-google-sans text-gc-gray-900 mt-16 mb-8 border-b border-gc-gray-200 pb-4">Add calendar</h1>

            <Section id="subscribe" title="Subscribe to calendar">
              <div className="space-y-4 max-w-md">
                <p className="text-sm text-gc-gray-600">Add a coworker's calendar so you can see when they're available.</p>
                <input type="text" placeholder="Add calendar" className="input-base w-full" />
                <button type="button" className="btn-secondary text-sm">Subscribe</button>
              </div>
            </Section>

            <Section id="create" title="Create new calendar">
              <form onSubmit={handleCreateCalendar} className="space-y-4 max-w-md">
                <input 
                  type="text" 
                  placeholder="Name" 
                  value={newCalName}
                  onChange={e => setNewCalName(e.target.value)}
                  className="input-base w-full" 
                  required
                />
                <textarea 
                  placeholder="Description" 
                  value={newCalDesc}
                  onChange={e => setNewCalDesc(e.target.value)}
                  className="input-base w-full resize-none" 
                  rows={3} 
                />
                <button 
                  type="submit" 
                  disabled={createCalendarMutation.isPending || !newCalName.trim()}
                  className="btn-primary text-sm flex items-center gap-2"
                >
                  {createCalendarMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                  Create calendar
                </button>
              </form>
            </Section>

            <Section id="browse" title="Browse calendars of interest">
              <div className="space-y-4 max-w-xl">
                <div className="flex items-center justify-between p-4 border border-gc-gray-200 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gc-gray-900">Holidays in United States</h3>
                    <p className="text-sm text-gc-gray-500">Public holidays</p>
                  </div>
                  <button type="button" className="btn-secondary text-sm">Add to calendar</button>
                </div>
                <div className="flex items-center justify-between p-4 border border-gc-gray-200 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gc-gray-900">Phases of the Moon</h3>
                    <p className="text-sm text-gc-gray-500">Astronomical events</p>
                  </div>
                  <button type="button" className="btn-secondary text-sm">Add to calendar</button>
                </div>
              </div>
            </Section>

            <Section id="fromurl" title="From URL">
              <div className="space-y-4 max-w-md">
                <p className="text-sm text-gc-gray-600">You can add a calendar using its iCal address.</p>
                <input type="url" placeholder="URL of calendar" className="input-base w-full" />
                <button type="button" className="btn-secondary text-sm">Add calendar</button>
              </div>
            </Section>

            <h1 className="text-3xl font-google-sans text-gc-gray-900 mt-16 mb-8 border-b border-gc-gray-200 pb-4">Import & export</h1>

            <Section id="import" title="Import">
              <div className="space-y-6 max-w-md">
                <p className="text-sm text-gc-gray-600">Import your events from a previously exported JSON file.</p>
                
                <div>
                  <label className="block text-sm font-medium text-gc-gray-700 mb-1">Select file</label>
                  <input 
                    type="file" 
                    accept=".json"
                    ref={fileInputRef}
                    className="block w-full text-sm text-gc-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gc-blue/10 file:text-gc-blue hover:file:bg-gc-blue/20 cursor-pointer"
                  />
                </div>

                {calendars.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gc-gray-700 mb-1">Add to calendar</label>
                    <select 
                      value={importCalId} 
                      onChange={e => setImportCalId(e.target.value)}
                      className="input-base w-full"
                    >
                      {calendars.map(cal => (
                        <option key={cal.id} value={cal.id}>{cal.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <button 
                  onClick={() => fileInputRef.current?.dispatchEvent(new Event('change'))}
                  onChange={handleImport as any}
                  disabled={isImporting}
                  className="btn-primary text-sm flex items-center gap-2 relative overflow-hidden"
                >
                  {isImporting && <Loader2 size={14} className="animate-spin" />}
                  {isImporting ? 'Importing...' : 'Import'}
                  
                  {/* Invisible file input trigger */}
                  <input 
                    type="file" 
                    accept=".json"
                    onChange={handleImport}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </button>
              </div>
            </Section>

            <Section id="export" title="Export">
              <div className="space-y-4 max-w-md">
                <p className="text-sm text-gc-gray-600">Export your events into a JSON file.</p>
                <button 
                  onClick={handleExport}
                  disabled={isExporting}
                  className="btn-primary text-sm flex items-center gap-2"
                >
                  {isExporting && <Loader2 size={14} className="animate-spin" />}
                  {isExporting ? 'Exporting...' : 'Export'}
                </button>
              </div>
            </Section>

          </div>
        </div>
      </div>
    </div>
  );
}

// Subcomponents

function SidebarItem({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative pl-10 pr-4 py-2 text-sm text-left transition-colors ${
        active ? 'text-gc-blue font-medium bg-blue-50/50' : 'text-gc-gray-700 hover:bg-gc-gray-200'
      }`}
    >
      {label}
    </button>
  );
}

function Section({ id, title, children }: { id: string, title: string, children: React.ReactNode }) {
  return (
    <div id={`setting-section-${id}`} className="mb-12 scroll-mt-24">
      <h2 className="text-[22px] font-google-sans text-gc-gray-900 mb-6 font-normal">{title}</h2>
      <div className="pl-0 sm:pl-4">
        {children}
      </div>
      <div className="h-px bg-gc-gray-200 w-full mt-12"></div>
    </div>
  );
}

function Field({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-12">
      <label className="text-sm text-gc-gray-800 font-medium w-48 flex-shrink-0">{label}</label>
      {children}
    </div>
  );
}
