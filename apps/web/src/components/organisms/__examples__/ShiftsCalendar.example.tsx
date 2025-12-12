/**
 * ShiftsCalendar Example Usage
 *
 * This file demonstrates various usage patterns for the ShiftsCalendar component.
 * These examples show how to integrate the calendar in different contexts.
 */

'use client';

import React from 'react';
import { ShiftsCalendar } from '../ShiftsCalendar';

/**
 * Example 1: Basic Calendar
 * Simplest usage with just organization ID
 */
export function Example1_BasicCalendar() {
  const organizationId = 'your-organization-uuid';

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Calendário de Plantões</h2>
      <ShiftsCalendar organizationId={organizationId} />
    </div>
  );
}

/**
 * Example 2: Calendar with Facility Filter
 * Shows shifts for a specific facility
 */
export function Example2_CalendarWithFacilityFilter() {
  const organizationId = 'your-organization-uuid';
  const facilityId = 'facility-uuid';

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">
        Plantões - Clínica Específica
      </h2>
      <ShiftsCalendar
        organizationId={organizationId}
        facilityId={facilityId}
      />
    </div>
  );
}

/**
 * Example 3: Calendar with Specialty Filter
 * Shows shifts for a specific medical specialty
 */
export function Example3_CalendarWithSpecialtyFilter() {
  const organizationId = 'your-organization-uuid';
  const specialty = 'cardio';

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Plantões - Cardiologia</h2>
      <ShiftsCalendar organizationId={organizationId} specialty={specialty} />
    </div>
  );
}

/**
 * Example 4: Calendar with Both Filters
 * Shows shifts filtered by both facility and specialty
 */
export function Example4_CalendarWithMultipleFilters() {
  const organizationId = 'your-organization-uuid';
  const facilityId = 'facility-uuid';
  const specialty = 'neuro';

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">
        Plantões - Neurologia (Hospital São Carlos)
      </h2>
      <ShiftsCalendar
        organizationId={organizationId}
        facilityId={facilityId}
        specialty={specialty}
      />
    </div>
  );
}

/**
 * Example 5: Calendar with Default Week View
 * Shows calendar with week view by default
 */
export function Example5_CalendarWithWeekView() {
  const organizationId = 'your-organization-uuid';

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Calendário - Visão Semanal</h2>
      <ShiftsCalendar
        organizationId={organizationId}
        defaultView="week"
      />
    </div>
  );
}

/**
 * Example 6: Calendar with Custom Height and Styling
 * Shows calendar with custom dimensions and classes
 */
export function Example6_CalendarWithCustomStyling() {
  const organizationId = 'your-organization-uuid';

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Calendário Customizado</h2>
      <ShiftsCalendar
        organizationId={organizationId}
        height="800px"
        className="shadow-lg"
      />
    </div>
  );
}

/**
 * Example 7: Integration with OrganizationProvider
 * Real-world usage with organization context
 */
export function Example7_IntegrationWithOrganizationProvider() {
  // Import this in your actual component:
  // import { useOrganization } from '@/providers/OrganizationProvider';
  //
  // const { activeOrganization } = useOrganization();
  //
  // if (!activeOrganization) {
  //   return <div>Por favor, selecione uma organização</div>;
  // }

  const organizationId = 'your-organization-uuid'; // Replace with activeOrganization.id

  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Calendário de Plantões</h2>
        <p className="text-sm text-muted-foreground">
          Visualize e gerencie os plantões da sua organização
        </p>
      </div>

      <ShiftsCalendar organizationId={organizationId} />
    </div>
  );
}

/**
 * Example 8: Calendar with Dynamic Filters (State Management)
 * Shows how to integrate with filter controls
 */
export function Example8_CalendarWithDynamicFilters() {
  const [facilityId, setFacilityId] = React.useState<string>('todas');
  const [specialty, setSpecialty] = React.useState<string>('todas');

  const organizationId = 'your-organization-uuid';

  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Calendário de Plantões</h2>
        <p className="text-sm text-muted-foreground">
          Use os filtros para visualizar plantões específicos
        </p>
      </div>

      {/* Filter Controls (simplified example) */}
      <div className="flex gap-4">
        <div>
          <label className="text-sm font-medium">Unidade:</label>
          <select
            value={facilityId}
            onChange={(e) => setFacilityId(e.target.value)}
            className="ml-2 rounded border p-1"
          >
            <option value="todas">Todas</option>
            <option value="facility-1">Clínica VIVA</option>
            <option value="facility-2">Hospital São Carlos</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Especialidade:</label>
          <select
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="ml-2 rounded border p-1"
          >
            <option value="todas">Todas</option>
            <option value="cardio">Cardiologia</option>
            <option value="neuro">Neurologia</option>
            <option value="anestesia">Anestesia</option>
          </select>
        </div>
      </div>

      {/* Calendar with dynamic filters */}
      <ShiftsCalendar
        organizationId={organizationId}
        facilityId={facilityId}
        specialty={specialty}
      />
    </div>
  );
}

/**
 * Example 9: Compact Calendar for Dashboard
 * Smaller calendar for dashboard widgets
 */
export function Example9_CompactCalendar() {
  const organizationId = 'your-organization-uuid';

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-2">Próximos Plantões</h3>
      <ShiftsCalendar
        organizationId={organizationId}
        height="400px"
        defaultView="week"
      />
    </div>
  );
}

/**
 * Export all examples
 */
export default {
  Example1_BasicCalendar,
  Example2_CalendarWithFacilityFilter,
  Example3_CalendarWithSpecialtyFilter,
  Example4_CalendarWithMultipleFilters,
  Example5_CalendarWithWeekView,
  Example6_CalendarWithCustomStyling,
  Example7_IntegrationWithOrganizationProvider,
  Example8_CalendarWithDynamicFilters,
  Example9_CompactCalendar,
};
