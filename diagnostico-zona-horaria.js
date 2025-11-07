// Script de diagnóstico para zona horaria
const PERU_UTC_OFFSET = -5;

function getPeruDateTime(): Date {
  const now = new Date();
  console.log('Server now:', now);
  console.log('Server timezone offset (minutes):', now.getTimezoneOffset());

  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  console.log('Calculated UTC time:', new Date(utcTime));

  const peruTime = new Date(utcTime + (3600000 * PERU_UTC_OFFSET));
  console.log('Calculated Peru time:', peruTime);

  return peruTime;
}

function formatPeruDate(date: Date, formatStr: string): string {
  // Simple date formatting for testing
  return date.toISOString().split('T')[0];
}

// Test
console.log('=== DIAGNÓSTICO DE ZONA HORARIA ===');
const peruNow = getPeruDateTime();
console.log('Peru date (yyyy-MM-dd):', formatPeruDate(peruNow, 'yyyy-MM-dd'));
console.log('Peru date (dd/MM/yyyy):', peruNow.toLocaleDateString('es-ES'));

// Test date calculations
const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

console.log('Today:', formatPeruDate(peruNow, 'yyyy-MM-dd'));
console.log('Tomorrow:', formatPeruDate(addDays(peruNow, 1), 'yyyy-MM-dd'));
console.log('Day after tomorrow:', formatPeruDate(addDays(peruNow, 2), 'yyyy-MM-dd'));
