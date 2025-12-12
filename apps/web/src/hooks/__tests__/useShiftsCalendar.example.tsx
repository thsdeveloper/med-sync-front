/**
 * Example usage of useShiftsCalendar hook
 *
 * This is a demonstration file showing how to use the hook in a React component.
 * Not meant to be a unit test, but rather documentation through example.
 */

import { useState } from 'react';
import { useShiftsCalendar } from '../useShiftsCalendar';

// Mock useOrganization hook for demonstration purposes
function useOrganization() {
  return {
    activeOrganization: { id: 'org-uuid', name: 'Example Org' }
  };
}

/**
 * Example 1: Basic usage with required parameters
 */
function BasicCalendarExample() {
  const { shifts, isLoading, error } = useShiftsCalendar({
    organizationId: 'org-uuid-here',
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-01-31T23:59:59Z',
  });

  if (isLoading) return <div>Loading calendar...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Total shifts: {shifts.length}</h2>
      {shifts.map((shift) => (
        <div key={shift.id}>
          {shift.title} - {shift.facility_name}
        </div>
      ))}
    </div>
  );
}

/**
 * Example 2: Using filters (facility and specialty)
 */
function FilteredCalendarExample() {
  const { shifts, isLoading, error } = useShiftsCalendar({
    organizationId: 'org-uuid-here',
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-01-31T23:59:59Z',
    facilityId: 'facility-uuid-here', // Optional filter
    specialty: 'cardio', // Optional filter
  });

  if (isLoading) return <div>Loading filtered calendar...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Cardio shifts: {shifts.length}</h2>
    </div>
  );
}

/**
 * Example 3: Using transformed events with Date objects
 */
function EventsCalendarExample() {
  const { events, isLoading, error } = useShiftsCalendar({
    organizationId: 'org-uuid-here',
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-01-31T23:59:59Z',
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {events.map((event) => (
        <div key={event.id}>
          <h3>{event.title}</h3>
          <p>
            Starts: {event.startDate.toLocaleString()}
            <br />
            Ends: {event.endDate.toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}

/**
 * Example 4: Using grouped data for calendar grid rendering
 */
function GroupedCalendarExample() {
  const { groupedByDate, isLoading, error } = useShiftsCalendar({
    organizationId: 'org-uuid-here',
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-01-31T23:59:59Z',
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="calendar-grid">
      {Object.entries(groupedByDate).map(([date, events]) => (
        <div key={date} className="calendar-day">
          <h3>{date}</h3>
          <div className="events">
            {events.map((event) => (
              <div key={event.id} className="event">
                <span>{event.title}</span>
                <span>{event.facility_name}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Example 5: Using refetch and advanced states
 */
function AdvancedCalendarExample() {
  const {
    shifts,
    isLoading,
    error,
    isFetching,
    isRefetching,
    refetch
  } = useShiftsCalendar({
    organizationId: 'org-uuid-here',
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-01-31T23:59:59Z',
  });

  return (
    <div>
      <div className="controls">
        <button onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? 'Refreshing...' : 'Refresh Calendar'}
        </button>
        {isRefetching && <span>Updating in background...</span>}
      </div>

      {isLoading && <div>Initial load...</div>}
      {error && <div>Error: {error.message}</div>}

      {shifts && (
        <div>
          <h2>Shifts ({shifts.length})</h2>
          {/* Render shifts */}
        </div>
      )}
    </div>
  );
}

/**
 * Example 6: Disabled query (fetch on demand)
 */
function OnDemandCalendarExample() {
  const [shouldFetch, setShouldFetch] = useState(false);

  const { shifts, isLoading, error } = useShiftsCalendar(
    {
      organizationId: 'org-uuid-here',
      startDate: '2024-01-01T00:00:00Z',
      endDate: '2024-01-31T23:59:59Z',
    },
    {
      enabled: shouldFetch, // Only fetch when enabled
      refetchOnWindowFocus: false, // Disable auto-refetch
    }
  );

  return (
    <div>
      <button onClick={() => setShouldFetch(true)}>Load Calendar</button>
      {isLoading && <div>Loading...</div>}
      {error && <div>Error: {error.message}</div>}
      {shifts && <div>Loaded {shifts.length} shifts</div>}
    </div>
  );
}

/**
 * Example 7: Integration with OrganizationProvider
 */
function IntegratedCalendarExample() {
  // Assuming you have OrganizationProvider context
  const { activeOrganization } = useOrganization();

  const { shifts, isLoading, error } = useShiftsCalendar({
    organizationId: activeOrganization?.id || '',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
  });

  if (!activeOrganization) {
    return <div>Please select an organization</div>;
  }

  if (isLoading) return <div>Loading calendar...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>{activeOrganization.name} - Calendar</h2>
      <p>Total shifts: {shifts.length}</p>
    </div>
  );
}

// Note: These are example components for documentation purposes.
// They demonstrate various ways to use the useShiftsCalendar hook.
// Import the necessary dependencies (useState, useOrganization) when using these patterns.
