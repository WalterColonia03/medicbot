import { useEffect, useState } from 'react';
import { Calendar, Clock, Plus } from 'lucide-react';
import Link from 'next/link';
import { Schedule } from '@/lib/types';

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    doctor_id: '',
    specific_date: '',
    start_time: '09:00',
    end_time: '17:00',
    slot_duration: '30',
  });

  const daysOfWeek = [
    'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
  ];

  useEffect(() => {
    fetchSchedules();
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await fetch('/api/doctors');
      const data = await response.json();
      setDoctors(data.filter((d: any) => d.is_active));
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/schedules');

      if (response.ok) {
        const data = await response.json();
        // Asegurar que data sea un array
        setSchedules(Array.isArray(data) ? data : []);
      } else {
        const errorData = await response.json();
        console.error('Error:', errorData);
        setSchedules([]); // Asegurar que sea un array vacío en caso de error
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
      setSchedules([]); // Asegurar que sea un array vacío
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 FRONTEND: Enviando formulario', formData);
    
    try {
      const payload = {
        doctor_id: formData.doctor_id,
        specific_date: formData.specific_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        slot_duration: parseInt(formData.slot_duration),
      };
      console.log('📤 FRONTEND: Payload:', payload);

      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('📥 FRONTEND: Response:', data);

      if (response.ok) {
        alert('Horario creado correctamente');
        setShowForm(false);
        setFormData({
          doctor_id: '',
          specific_date: '',
          start_time: '09:00',
          end_time: '17:00',
          slot_duration: '30',
        });
        fetchSchedules();
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error creating schedule:', error);
      alert('Error al crear el horario');
    }
  };

  const generateTimeSlots = async (doctorName: string) => {
    try {
      const response = await fetch('/api/timeslots/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorName, daysAhead: 30 }),
      });

      const data = await response.json();
      alert(`Se generaron ${data.slots?.length || 0} espacios de tiempo`);
    } catch (error) {
      console.error('Error generating time slots:', error);
      alert('Error al generar los espacios de tiempo');
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
                href="/appointments"
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Citas
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Horarios por Fecha</h2>
            <p className="mt-2 text-gray-600">
              Crea horarios específicos para fechas particulares
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nuevo Horario
          </button>
        </div>

        {/* Formulario */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Crear Horario para Fecha Específica</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Médico
                </label>
                <select
                  value={formData.doctor_id}
                  onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                >
                  <option value="">Seleccionar médico</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name} - {doctor.specialty}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha específica
                </label>
                <input
                  type="date"
                  value={formData.specific_date}
                  onChange={(e) => setFormData({ ...formData, specific_date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]} // No permitir fechas pasadas
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora de inicio
                  </label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora de fin
                  </label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duración de cada cita (minutos)
                </label>
                <select
                  value={formData.slot_duration}
                  onChange={(e) => setFormData({ ...formData, slot_duration: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                >
                  <option value="15">15 minutos</option>
                  <option value="20">20 minutos</option>
                  <option value="30">30 minutos</option>
                  <option value="45">45 minutos</option>
                  <option value="60">60 minutos</option>
                </select>
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de horarios */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Cargando...</p>
          </div>
        ) : !Array.isArray(schedules) || schedules.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No hay horarios configurados</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  {schedule.doctor?.name}
                </h3>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-gray-700">
                    <Calendar className="h-5 w-5 mr-2 text-primary-600" />
                    <p className="text-sm">
                      {schedule.specific_date
                        ? new Date(schedule.specific_date).toLocaleDateString('es-ES')
                        : 'Fecha no especificada'
                      }
                    </p>
                  </div>

                  <div className="flex items-center text-gray-700">
                    <Clock className="h-5 w-5 mr-2 text-primary-600" />
                    <p className="text-sm">
                      {schedule.start_time} - {schedule.end_time}
                    </p>
                  </div>

                  <div className="text-sm text-gray-600">
                    Duración por cita: {schedule.slot_duration} min
                  </div>
                </div>

                <button
                  onClick={() => generateTimeSlots(schedule.doctor?.name || 'Doctor')}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
                >
                  Generar Espacios de Tiempo
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
