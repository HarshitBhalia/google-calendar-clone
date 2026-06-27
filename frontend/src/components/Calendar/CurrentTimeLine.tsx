import React from 'react';

/**
 * CurrentTimeLine provides additional custom CSS for FullCalendar's nowIndicator.
 * FullCalendar already renders the now indicator line; this component injects
 * supplementary styles to enhance the visual (red circle on left edge).
 * The main styling is in index.css via FullCalendar overrides.
 */
const CurrentTimeLine: React.FC = () => {
  return (
    <style>{`
      /* Enhanced now indicator styles */
      .fc .fc-timegrid-now-indicator-line {
        border-color: #d93025 !important;
        border-width: 2px 0 0 0 !important;
        z-index: 4;
        position: relative;
      }

      .fc .fc-timegrid-now-indicator-arrow {
        border-color: #d93025 !important;
        border-width: 6px 0 6px 8px !important;
        border-top-color: transparent !important;
        border-bottom-color: transparent !important;
        border-right-color: transparent !important;
        left: -1px;
        margin-top: -6px;
      }

      /* Ensure the now indicator container is visible */
      .fc .fc-timegrid-now-indicator-container {
        overflow: visible;
      }
    `}</style>
  );
};

export default CurrentTimeLine;
