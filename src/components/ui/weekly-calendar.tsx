import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Appointment {
  id: string;
  start_time: string;
  end_time: string;
  client_name?: string;
  service_name?: string;
  status: string;
}

interface WeeklyCalendarProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  appointments?: Appointment[];
  onTimeSlotClick?: (date: string, time: string) => void;
  compact?: boolean;
  className?: string;
}

const DAYS_OF_WEEK = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
const FULL_DAYS_OF_WEEK = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

// Horários de 7:00 às 22:00
const TIME_SLOTS = Array.from({ length: 16 }, (_, i) => {
  const hour = i + 7;
  return `${hour.toString().padStart(2, '0')}:00`;
});

const COMPACT_TIME_SLOTS = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];

export function WeeklyCalendar({
  selectedDate,
  onDateChange,
  appointments = [],
  onTimeSlotClick,
  compact = false,
  className
}: WeeklyCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState<Date[]>([]);
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(new Date());

  // Função para obter o início da semana (domingo)
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    d.setDate(diff);
    return d;
  };

  // Função para gerar os dias da semana
  const generateWeekDays = (startDate: Date) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  };

  // Inicializar semana baseada na data selecionada
  useEffect(() => {
    const date = new Date(selectedDate);
    const weekStart = getWeekStart(date);
    setSelectedWeekStart(weekStart);
    setCurrentWeek(generateWeekDays(weekStart));
  }, [selectedDate]);

  // Navegar para semana anterior
  const goToPreviousWeek = () => {
    const newWeekStart = new Date(selectedWeekStart);
    newWeekStart.setDate(selectedWeekStart.getDate() - 7);
    setSelectedWeekStart(newWeekStart);
    setCurrentWeek(generateWeekDays(newWeekStart));
  };

  // Navegar para próxima semana
  const goToNextWeek = () => {
    const newWeekStart = new Date(selectedWeekStart);
    newWeekStart.setDate(selectedWeekStart.getDate() + 7);
    setSelectedWeekStart(newWeekStart);
    setCurrentWeek(generateWeekDays(newWeekStart));
  };

  // Verificar se uma data é hoje
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Verificar se uma data é a selecionada
  const isSelected = (date: Date) => {
    const selected = new Date(selectedDate);
    return date.toDateString() === selected.toDateString();
  };

  // Obter agendamentos para uma data e horário específicos
  const getAppointmentsForSlot = (date: Date, time: string) => {
    // Verificar se a data é válida
    if (!date || isNaN(date.getTime())) {
      return [];
    }
    
    const dateStr = date.toISOString().split('T')[0];
    
    return appointments.filter(apt => {
      // Verificar se apt.start_time existe e é válido
      if (!apt.start_time) return false;
      
      try {
        // Se start_time tem formato de data completa (ISO string com data e hora)
        if (apt.start_time.includes('T')) {
          const aptDateObj = new Date(apt.start_time);
          if (isNaN(aptDateObj.getTime())) return false;
          
          const aptDate = aptDateObj.toISOString().split('T')[0];
          const aptTime = aptDateObj.toTimeString().substring(0, 5); // HH:MM
          
          return aptDate === dateStr && aptTime === time;
        } else {
          // Se start_time é apenas horário (formato HH:MM:SS ou HH:MM)
          // Neste caso, assumimos que o appointment já está filtrado por data
          const aptTime = apt.start_time.substring(0, 5); // Pega apenas HH:MM
          return aptTime === time;
        }
      } catch (error) {
        console.warn('Invalid appointment time format:', apt.start_time, error);
        return false;
      }
    });
  };

  // Lidar com clique em um slot de tempo
  const handleTimeSlotClick = (date: Date, time: string) => {
    const dateStr = date.toISOString().split('T')[0];
    onDateChange?.(dateStr);
    onTimeSlotClick?.(dateStr, time);
  };

  // Obter o mês e ano atual da semana
  const getMonthYear = () => {
    const firstDay = currentWeek[0];
    const lastDay = currentWeek[6];
    
    if (firstDay?.getMonth() === lastDay?.getMonth()) {
      return firstDay?.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    } else {
      return `${firstDay?.toLocaleDateString('pt-BR', { month: 'short' })} - ${lastDay?.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`;
    }
  };

  const timeSlots = compact ? COMPACT_TIME_SLOTS : TIME_SLOTS;

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className={cn('font-semibold', compact ? 'text-lg' : 'text-xl')}>
              {getMonthYear()}
            </h3>
            {!compact && (
              <p className="text-sm text-muted-foreground">
                {currentWeek[0]?.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - {currentWeek[6]?.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextWeek}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border-t">
          {/* Cabeçalho dos dias da semana */}
          <div className="grid grid-cols-8 border-b bg-muted/30">
            <div className={cn('p-2 text-center text-sm font-medium border-r', compact ? 'text-xs' : '')}>
              GMT-03
            </div>
            {currentWeek.map((date, index) => (
              <div
                key={index}
                className={cn(
                  'p-2 text-center border-r last:border-r-0 cursor-pointer transition-colors',
                  compact ? 'text-xs' : 'text-sm',
                  isSelected(date) && 'bg-primary text-primary-foreground',
                  isToday(date) && !isSelected(date) && 'bg-blue-50 text-blue-600 font-medium'
                )}
                onClick={() => onDateChange(date.toISOString().split('T')[0])}
              >
                <div className="font-medium">{DAYS_OF_WEEK[index]}</div>
                <div className={cn('mt-1', compact ? 'text-lg' : 'text-xl', isSelected(date) && 'font-bold')}>
                  {date.getDate()}
                </div>
              </div>
            ))}
          </div>

          {/* Grade de horários */}
          <div className="max-h-96 overflow-y-auto">
            {timeSlots.map((time) => (
              <div key={time} className="grid grid-cols-8 border-b last:border-b-0">
                <div className={cn('p-2 text-center text-sm border-r bg-muted/20', compact ? 'text-xs py-1' : '')}>
                  {time}
                </div>
                {currentWeek.map((date, dayIndex) => {
                  const slotAppointments = getAppointmentsForSlot(date, time);
                  const hasAppointment = slotAppointments.length > 0;
                  
                  return (
                    <div
                      key={`${dayIndex}-${time}`}
                      className={cn(
                        'border-r last:border-r-0 cursor-pointer transition-colors relative',
                        compact ? 'min-h-[32px]' : 'min-h-[48px]',
                        'hover:bg-muted/50',
                        hasAppointment && 'bg-blue-100'
                      )}
                      onClick={() => handleTimeSlotClick(date, time)}
                    >
                      {hasAppointment && (
                        <div className={cn(
                          'absolute inset-1 rounded text-white text-xs p-1 overflow-hidden',
                          compact ? 'text-[10px]' : '',
                          slotAppointments[0].status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                        )}>
                          <div className="font-medium truncate">
                            {slotAppointments[0].client_name || '(Sem título)'}
                          </div>
                          {!compact && (
                            <div className="text-[10px] opacity-90 truncate">
                              {slotAppointments[0].service_name}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}