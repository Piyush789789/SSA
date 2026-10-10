import React from 'react';
import { AdminPageShell } from '@/components/dashboard/AdminPageShell';
import { EventCalendar } from '@/components/calendar/EventCalendar';

/** /admin/calendar — add, edit and delete school holidays and events. */
export const CalendarAdminPage = () => (
  <AdminPageShell
    activeItemId="calendar"
    title="Holiday & Event Calendar"
    description="Holidays block attendance for that day. Adding an upcoming entry notifies everyone."
  >
    <EventCalendar canEdit />
  </AdminPageShell>
);

export default CalendarAdminPage;
