/**
 * CalendarWrapper Component Usage Examples
 *
 * This file demonstrates various usage patterns for the CalendarWrapper component.
 * These examples show how to integrate the calendar with shift data, handle events,
 * and customize the appearance.
 */

'use client';

import React, { useState } from 'react';
import { CalendarWrapper, CalendarWrapperEvent } from '../CalendarWrapper';
import { View } from 'react-big-calendar';

/**
 * Example 1: Basic Calendar with Sample Events
 *
 * Demonstrates the simplest usage with hardcoded events.
 */
export function BasicCalendarExample() {
  const events: CalendarWrapperEvent[] = [
    {
      id: '1',
      title: 'Dr. Silva - Cardiologia',
      start: new Date(2024, 0, 15, 9, 0),
      end: new Date(2024, 0, 15, 17, 0),
      resource: {
        doctorId: 'uuid-1',
        doctorName: 'Dr. Silva',
        facilityId: 'facility-1',
        facilityName: 'Clínica VIVA',
        specialty: 'cardiologia',
        status: 'accepted',
      },
    },
    {
      id: '2',
      title: 'Dr. Santos - Neurologia',
      start: new Date(2024, 0, 16, 14, 0),
      end: new Date(2024, 0, 16, 22, 0),
      resource: {
        doctorId: 'uuid-2',
        doctorName: 'Dr. Santos',
        facilityId: 'facility-2',
        facilityName: 'Hospital São Carlos',
        specialty: 'neuro',
        status: 'accepted',
      },
    },
  ];

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Calendário de Plantões</h2>
      <CalendarWrapper events={events} />
    </div>
  );
}

/**
 * Example 2: Calendar with Event Handling
 *
 * Demonstrates how to handle event clicks and slot selections.
 */
export function InteractiveCalendarExample() {
  const [events] = useState<CalendarWrapperEvent[]>([
    {
      id: '1',
      title: 'Dr. Oliveira - Pediatria',
      start: new Date(2024, 0, 15, 8, 0),
      end: new Date(2024, 0, 15, 18, 0),
      resource: {
        specialty: 'pediatria',
        status: 'accepted',
      },
    },
  ]);

  const handleSelectEvent = (event: CalendarWrapperEvent) => {
    console.log('Event selected:', event);
    alert(`Plantão selecionado:\n${event.title}\n${event.start.toLocaleString('pt-BR')}`);
  };

  const handleSelectSlot = (slotInfo: any) => {
    console.log('Slot selected:', slotInfo);
    alert(`Criar novo plantão:\nInício: ${slotInfo.start.toLocaleString('pt-BR')}\nFim: ${slotInfo.end.toLocaleString('pt-BR')}`);
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Calendário Interativo</h2>
      <CalendarWrapper
        events={events}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        selectable
      />
    </div>
  );
}

/**
 * Example 3: Calendar with View State Management
 *
 * Demonstrates how to control the calendar view and navigation.
 */
export function ControlledCalendarExample() {
  const [events] = useState<CalendarWrapperEvent[]>([]);
  const [currentView, setCurrentView] = useState<View>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  const handleViewChange = (view: View) => {
    console.log('View changed to:', view);
    setCurrentView(view);
  };

  const handleNavigate = (date: Date) => {
    console.log('Navigated to:', date);
    setCurrentDate(date);
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Calendário Controlado</h2>
      <div className="mb-4 p-4 bg-muted rounded-md">
        <p>
          <strong>Visualização:</strong> {currentView}
        </p>
        <p>
          <strong>Data:</strong> {currentDate.toLocaleDateString('pt-BR')}
        </p>
      </div>
      <CalendarWrapper
        events={events}
        defaultView={currentView}
        defaultDate={currentDate}
        onView={handleViewChange}
        onNavigate={handleNavigate}
      />
    </div>
  );
}

/**
 * Example 4: Calendar with Custom Event Styling
 *
 * Demonstrates custom styling based on event properties.
 */
export function StyledCalendarExample() {
  const events: CalendarWrapperEvent[] = [
    {
      id: '1',
      title: 'Dr. Costa - Cardiologia',
      start: new Date(2024, 0, 15, 9, 0),
      end: new Date(2024, 0, 15, 17, 0),
      resource: { specialty: 'cardio', status: 'accepted' },
    },
    {
      id: '2',
      title: 'Dr. Lima - Anestesia',
      start: new Date(2024, 0, 16, 14, 0),
      end: new Date(2024, 0, 16, 22, 0),
      resource: { specialty: 'anestesia', status: 'completed' },
    },
    {
      id: '3',
      title: 'Dr. Alves - Neurologia',
      start: new Date(2024, 0, 17, 10, 0),
      end: new Date(2024, 0, 17, 20, 0),
      resource: { specialty: 'neuro', status: 'cancelled' },
    },
  ];

  const customEventStyleGetter = (event: CalendarWrapperEvent) => {
    const status = event.resource?.status;

    // Custom color scheme
    let backgroundColor = '#3B82F6'; // Default blue

    if (status === 'completed') {
      backgroundColor = '#10B981'; // Green for completed
    } else if (status === 'cancelled') {
      backgroundColor = '#EF4444'; // Red for cancelled
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '8px',
        opacity: status === 'cancelled' ? 0.6 : 1,
        border: 'none',
        color: 'white',
        fontWeight: 500,
      },
    };
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Calendário com Estilos Customizados</h2>
      <div className="mb-4 flex gap-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span className="text-sm">Aceito</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-sm">Concluído</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded opacity-60"></div>
          <span className="text-sm">Cancelado</span>
        </div>
      </div>
      <CalendarWrapper events={events} eventStyleGetter={customEventStyleGetter} />
    </div>
  );
}

/**
 * Example 5: Integration with useShiftsCalendar Hook
 *
 * Demonstrates how to use the CalendarWrapper with the useShiftsCalendar data hook.
 */
export function CalendarWithDataHookExample() {
  // This would normally use the useShiftsCalendar hook from F022
  // import { useShiftsCalendar } from '@/hooks/useShiftsCalendar';

  // const { events, isLoading, error, refetch } = useShiftsCalendar({
  //   organizationId: 'org-id',
  //   startDate: new Date().toISOString(),
  //   endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  //   facilityId: 'todas',
  //   specialty: 'todas',
  // });

  // Mock data for example purposes
  // In a real implementation, you would use the useShiftsCalendar hook here
  const events: CalendarWrapperEvent[] = [];

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Calendário com Dados Reais</h2>
      <p className="mb-4 text-muted-foreground">
        Este exemplo demonstra a integração com o hook useShiftsCalendar.
        Os dados seriam carregados automaticamente da API.
      </p>
      <CalendarWrapper
        events={events}
        onSelectEvent={(event) => {
          console.log('Shift selected:', event);
        }}
        height="800px"
      />
    </div>
  );
}

/**
 * Example 6: Calendar with Different Heights and Styles
 *
 * Demonstrates custom sizing and container styling.
 */
export function CustomSizedCalendarExample() {
  const events: CalendarWrapperEvent[] = [];

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Calendário Customizado</h2>
      <CalendarWrapper
        events={events}
        height="600px"
        className="shadow-xl"
        style={{ borderWidth: 2 }}
      />
    </div>
  );
}
