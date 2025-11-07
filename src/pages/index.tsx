import { useEffect, useState } from 'react';
import { Calendar, Clock, Users, Bell } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [stats, setStats] = useState({
    totalAppointments: 0,
    confirmedToday: 0,
    availableSlots: 0,
  });

  useEffect(() => {
    // Cargar estadísticas
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/appointments?status=confirmed');
      const appointments = await response.json();
      
      const today = new Date().toISOString().split('T')[0];
      const todayAppointments = appointments.filter(
        (apt: any) => apt.date === today
      );

      setStats({
        totalAppointments: appointments.length,
        confirmedToday: todayAppointments.length,
        availableSlots: 0, // Se puede calcular
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-primary-600" />
              <h1 className="ml-2 text-2xl font-bold text-gray-900">MedicBot</h1>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/appointments"
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Citas
              </Link>
              <Link
                href="/schedules"
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Horarios
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Panel de Control
          </h2>
          <p className="mt-2 text-gray-600">
            Sistema de gestión de citas médicas por WhatsApp
          </p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Citas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalAppointments}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Hoy</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.confirmedToday}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Médicos</p>
                <p className="text-2xl font-bold text-gray-900">3</p>
              </div>
            </div>
          </div>
        </div>

        {/* Instrucciones de uso */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Bell className="h-6 w-6 mr-2 text-primary-600" />
            Cómo usar el sistema
          </h3>
          <div className="space-y-4">
            <div className="border-l-4 border-primary-500 pl-4">
              <h4 className="font-semibold text-gray-900">1. Configurar Horarios</h4>
              <p className="text-gray-600">
                Primero, configura los horarios de atención de cada médico en la sección de Horarios.
              </p>
            </div>
            <div className="border-l-4 border-primary-500 pl-4">
              <h4 className="font-semibold text-gray-900">2. Generar Slots de Tiempo</h4>
              <p className="text-gray-600">
                Genera automáticamente los espacios de tiempo disponibles basados en los horarios.
              </p>
            </div>
            <div className="border-l-4 border-primary-500 pl-4">
              <h4 className="font-semibold text-gray-900">3. Los Pacientes Reservan por WhatsApp</h4>
              <p className="text-gray-600">
                Los pacientes pueden reservar citas enviando un mensaje al número de WhatsApp configurado.
              </p>
            </div>
            <div className="border-l-4 border-primary-500 pl-4">
              <h4 className="font-semibold text-gray-900">4. Ver y Gestionar Citas</h4>
              <p className="text-gray-600">
                Visualiza todas las citas confirmadas en la sección de Citas.
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">📱 Configuración de WhatsApp</h4>
            <p className="text-blue-800 text-sm">
              Para que el chatbot funcione, necesitas configurar Twilio con tu número de WhatsApp Business.
              Consulta el archivo README.md para instrucciones detalladas.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
