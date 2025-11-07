// src/lib/utils/date.ts
import { format, addDays, isBefore, isAfter, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { PERU_UTC_OFFSET } from './constants';

/**
Obtiene la fecha/hora actual en zona horaria de Perú */
export function getPeruDateTime(): Date {
  const now = new Date();
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
  const peruTime = new Date(utcTime + 3600000 * PERU_UTC_OFFSET);
  return peruTime;
}

/**
Formatea fecha en zona horaria de Perú */
export function formatPeruDate(date: Date, formatStr: string): string {
  return format(date, formatStr, { locale: es });
}

/**
Obtiene la hora actual en formato HH:mm (Perú) */
export function getCurrentPeruTime(): string {
  const peru = getPeruDateTime();
  const hours = peru.getHours().toString().padStart(2, '0');
  const minutes = peru.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
Obtiene la fecha actual en formato yyyy-MM-dd (Perú) */
export function getTodayPeruDate(): string {
  return formatPeruDate(getPeruDateTime(), 'yyyy-MM-dd');
}

/**
Convierte string de fecha a Date en zona de Perú */
export function parseDateInPeru(dateString: string): Date {
  return new Date(dateString + 'T00:00:00');
}

/**
Valida si una fecha es futura (considerando Perú) */
export function isFutureDate(dateString: string): boolean {
  const date = startOfDay(parseDateInPeru(dateString));
  const today = startOfDay(getPeruDateTime());
  return !isBefore(date, today);
}

/**
Valida si una fecha está dentro de un rango permitido */
export function isDateInRange(
  dateString: string,
  maxMonthsAhead: number
): boolean {
  const date = parseDateInPeru(dateString);
  const maxDate = addDays(getPeruDateTime(), maxMonthsAhead * 30);
  return !isAfter(date, maxDate);
}

/**
Formatea fecha para mostrar (DD/MM/YYYY) */
export function formatDateDisplay(dateString: string): string {
  try {
    const date = parseDateInPeru(dateString);
    return formatPeruDate(date, 'dd/MM/yyyy');
  } catch {
    return dateString;
  }
}

/**
Formatea hora para mostrar (HH:mm) */
export function formatTimeDisplay(timeString: string): string {
  return timeString.substring(0, 5);
}

/**
Calcula la diferencia en minutos entre dos horas */
export function getMinutesBetween(startTime: string, endTime: string): number {
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  return (end.getTime() - start.getTime()) / 60000;
}

/**
Valida formato de hora HH:mm */
export function isValidTimeFormat(time: string): boolean {
  return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
}

/**
Genera array de fechas futuras */
export function generateUpcomingDates(daysAhead: number): Array<{
  value: string;
  label: string;
  dayName: string;
}> {
  const dates = [];
  const today = getPeruDateTime();

  for (let i = 0; i < daysAhead; i++) {
    const date = addDays(today, i);
    dates.push({
      value: formatPeruDate(date, 'yyyy-MM-dd'),
      label: formatPeruDate(date, 'dd/MM/yyyy'),
      dayName: formatPeruDate(date, 'EEEE'),
    });
  }

  return dates;
}
