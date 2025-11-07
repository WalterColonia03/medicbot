import { useEffect, useState } from 'react';
import { Calendar, Phone, User, Clock } from 'lucide-react';
import Link from 'next/link';
import { Appointment } from '@/lib/types';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'cancelled'>('all');

  useEffect(() => {
    fetchAppointments();
  }, [filter]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const url = filter === 'all' 
        ? '/api/appointments' 
        : `/api/appointments?status=${filter}`;
      
      const response = await fetch(url);
      const data = await response.json();
      setAppointments(data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendNotification = async (appointmentId: string) => {
    try {
      await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId }),
      });
      alert('Notificación enviada correctamente');
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Error al enviar la notificación');
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
                href="/"
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Inicio
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
          <h2 className="text-3xl font-bold text-gray-900">Citas Médicas</h2>
          <p className="mt-2 text-gray-600">
            Gestiona todas las citas programadas
          </p>
        </div>

        {/* Filtros */}
        <div className="mb-6 flex space-x-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('confirmed')}
            className={`px-4 py-2 rounded-md ${
              filter === 'confirmed'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Confirmadas
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`px-4 py-2 rounded-md ${
              filter === 'cancelled'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Canceladas
          </button>
        </div>

        {/* Lista de citas */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Cargando...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No hay citas registradas</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${
                      appointment.status === 'confirmed'
                        ? 'bg-green-500'
                        : appointment.status === 'cancelled'
                        ? 'bg-red-500'
                        : 'bg-yellow-500'
                    }`} />
                    <span className="text-xs font-semibold text-gray-600 uppercase">
                      {appointment.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-gray-700">
                    <User className="h-5 w-5 mr-2 text-primary-600" />
                    <div>
                      <p className="text-sm font-medium">{appointment.patientName}</p>
                    </div>
                  </div>

                  <div className="flex items-center text-gray-700">
                    <Phone className="h-5 w-5 mr-2 text-primary-600" />
                    <p className="text-sm">{appointment.patientPhone}</p>
                  </div>

                  <div className="flex items-center text-gray-700">
                    <Calendar className="h-5 w-5 mr-2 text-primary-600" />
                    <p className="text-sm">{appointment.doctorName}</p>
                  </div>

                  <div className="flex items-center text-gray-700">
                    <Clock className="h-5 w-5 mr-2 text-primary-600" />
                    <p className="text-sm">
                      {appointment.date} - {appointment.timeSlot}
                    </p>
                  </div>
                </div>

                {appointment.status === 'confirmed' && (
                  <button
                    onClick={() => sendNotification(appointment.id)}
                    className="mt-4 w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 text-sm"
                  >
                    Enviar Recordatorio
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
