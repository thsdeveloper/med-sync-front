'use client';

import { useState } from 'react';
import { startOfMonth, endOfMonth, addMonths } from 'date-fns';
import {
  CalendarFilters,
  type CalendarFiltersState,
} from '@/components/molecules/CalendarFilters';

/**
 * CalendarFilters Component Examples
 *
 * This file demonstrates various usage patterns for the CalendarFilters component.
 */

// Example 1: Basic Usage with Current Month
export function Example1_BasicUsage() {
  const [filters, setFilters] = useState<CalendarFiltersState>({
    startDate: startOfMonth(new Date()).toISOString(),
    endDate: endOfMonth(new Date()).toISOString(),
    facilityId: 'todas',
    specialty: 'todas',
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Example 1: Basic Usage</h3>
      <CalendarFilters
        filters={filters}
        onFiltersChange={(partial) => setFilters({ ...filters, ...partial })}
        organizationId="org-123"
      />
      <pre className="bg-muted p-4 rounded-md text-xs">
        {JSON.stringify(filters, null, 2)}
      </pre>
    </div>
  );
}

// Example 2: With Custom Initial Filters
export function Example2_CustomInitialFilters() {
  const [filters, setFilters] = useState<CalendarFiltersState>({
    startDate: startOfMonth(new Date()).toISOString(),
    endDate: endOfMonth(addMonths(new Date(), 1)).toISOString(), // Next month
    facilityId: 'facility-uuid-123',
    specialty: 'cardio',
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        Example 2: Custom Initial Filters
      </h3>
      <CalendarFilters
        filters={filters}
        onFiltersChange={(partial) => setFilters({ ...filters, ...partial })}
        organizationId="org-123"
      />
      <pre className="bg-muted p-4 rounded-md text-xs">
        {JSON.stringify(filters, null, 2)}
      </pre>
    </div>
  );
}

// Example 3: With Clear Filters Callback
export function Example3_WithClearCallback() {
  const [filters, setFilters] = useState<CalendarFiltersState>({
    startDate: startOfMonth(new Date()).toISOString(),
    endDate: endOfMonth(new Date()).toISOString(),
    facilityId: 'todas',
    specialty: 'todas',
  });
  const [clearCount, setClearCount] = useState(0);

  const handleClear = () => {
    setClearCount((prev) => prev + 1);
    console.log('Filters cleared!');
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        Example 3: With Clear Callback
      </h3>
      <p className="text-sm text-muted-foreground">
        Filters cleared {clearCount} times
      </p>
      <CalendarFilters
        filters={filters}
        onFiltersChange={(partial) => setFilters({ ...filters, ...partial })}
        organizationId="org-123"
        onClear={handleClear}
      />
    </div>
  );
}

// Example 4: Integration with Calendar Component
export function Example4_WithCalendarIntegration() {
  const [filters, setFilters] = useState<CalendarFiltersState>({
    startDate: startOfMonth(new Date()).toISOString(),
    endDate: endOfMonth(new Date()).toISOString(),
    facilityId: 'todas',
    specialty: 'todas',
  });

  // Simulate calendar data fetching based on filters
  const handleFiltersChange = (partial: Partial<CalendarFiltersState>) => {
    const updatedFilters = { ...filters, ...partial };
    setFilters(updatedFilters);
    console.log('Fetching calendar data with filters:', updatedFilters);
    // Here you would call your useShiftsCalendar hook or API
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        Example 4: Calendar Integration
      </h3>
      <CalendarFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        organizationId="org-123"
      />
      <div className="bg-muted p-4 rounded-md">
        <p className="text-sm font-medium mb-2">Calendar Data Query:</p>
        <pre className="text-xs">
          {JSON.stringify(
            {
              organizationId: 'org-123',
              ...filters,
            },
            null,
            2
          )}
        </pre>
      </div>
    </div>
  );
}

// Example 5: Controlled Empty State
export function Example5_EmptyState() {
  const [filters, setFilters] = useState<CalendarFiltersState>({
    startDate: '',
    endDate: '',
    facilityId: 'todas',
    specialty: 'todas',
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Example 5: Empty State</h3>
      <p className="text-sm text-muted-foreground">
        No date range selected initially
      </p>
      <CalendarFilters
        filters={filters}
        onFiltersChange={(partial) => setFilters({ ...filters, ...partial })}
        organizationId="org-123"
      />
    </div>
  );
}

// Example 6: Multiple Organizations
export function Example6_MultipleOrganizations() {
  const [selectedOrg, setSelectedOrg] = useState('org-1');
  const [filters, setFilters] = useState<CalendarFiltersState>({
    startDate: startOfMonth(new Date()).toISOString(),
    endDate: endOfMonth(new Date()).toISOString(),
    facilityId: 'todas',
    specialty: 'todas',
  });

  const organizations = [
    { id: 'org-1', name: 'Organization 1' },
    { id: 'org-2', name: 'Organization 2' },
    { id: 'org-3', name: 'Organization 3' },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        Example 6: Multiple Organizations
      </h3>
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Select Organization
        </p>
        <div className="flex gap-2">
          {organizations.map((org) => (
            <button
              key={org.id}
              onClick={() => {
                setSelectedOrg(org.id);
                // Reset filters when changing organization
                setFilters({
                  startDate: startOfMonth(new Date()).toISOString(),
                  endDate: endOfMonth(new Date()).toISOString(),
                  facilityId: 'todas',
                  specialty: 'todas',
                });
              }}
              className={`px-3 py-2 rounded-md text-sm ${
                selectedOrg === org.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              {org.name}
            </button>
          ))}
        </div>
      </div>
      <CalendarFilters
        filters={filters}
        onFiltersChange={(partial) => setFilters({ ...filters, ...partial })}
        organizationId={selectedOrg}
      />
    </div>
  );
}

// Example 7: With OrganizationProvider Integration
export function Example7_WithOrganizationProvider() {
  const [filters, setFilters] = useState<CalendarFiltersState>({
    startDate: startOfMonth(new Date()).toISOString(),
    endDate: endOfMonth(new Date()).toISOString(),
    facilityId: 'todas',
    specialty: 'todas',
  });

  // In real usage, you would use:
  // const { activeOrganization } = useOrganization();

  const mockActiveOrganization = {
    id: 'org-from-provider',
    name: 'Active Organization',
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        Example 7: With OrganizationProvider
      </h3>
      <p className="text-sm text-muted-foreground">
        Active Organization: {mockActiveOrganization.name}
      </p>
      <CalendarFilters
        filters={filters}
        onFiltersChange={(partial) => setFilters({ ...filters, ...partial })}
        organizationId={mockActiveOrganization.id}
      />
    </div>
  );
}

// Example 8: Compact Version (for smaller screens)
export function Example8_CompactVersion() {
  const [filters, setFilters] = useState<CalendarFiltersState>({
    startDate: startOfMonth(new Date()).toISOString(),
    endDate: endOfMonth(new Date()).toISOString(),
    facilityId: 'todas',
    specialty: 'todas',
  });

  return (
    <div className="space-y-4 max-w-2xl">
      <h3 className="text-lg font-semibold">Example 8: Compact Version</h3>
      <p className="text-sm text-muted-foreground">
        Filters automatically stack on smaller screens
      </p>
      <CalendarFilters
        filters={filters}
        onFiltersChange={(partial) => setFilters({ ...filters, ...partial })}
        organizationId="org-123"
      />
    </div>
  );
}

/**
 * All Examples Together
 */
export function AllCalendarFiltersExamples() {
  return (
    <div className="space-y-12 p-8">
      <h1 className="text-3xl font-bold">CalendarFilters Examples</h1>
      <Example1_BasicUsage />
      <Example2_CustomInitialFilters />
      <Example3_WithClearCallback />
      <Example4_WithCalendarIntegration />
      <Example5_EmptyState />
      <Example6_MultipleOrganizations />
      <Example7_WithOrganizationProvider />
      <Example8_CompactVersion />
    </div>
  );
}

export default AllCalendarFiltersExamples;
