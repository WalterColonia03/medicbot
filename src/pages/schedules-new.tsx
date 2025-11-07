import { useEffect, useState } from 'react';
import { Calendar, Clock, Plus, Trash2, Edit2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import Alert from '@/components/Alert';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
}

interface Schedule {
  id: string;
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration: number;
  is_active: boolean;
  doctor?: Doctor;
}

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [alert, setAlert] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    title?: string;
    message: string;
    errors?: string[];
  } | null>(null);
  
  const [formData, setFormData] = useState({
    doctor_id: '',
    day_of_week: '1',
    specific_date: '', // Nueva: fecha específica
    start_time: '09:00',
    end_time: '17:00',
    slot_duration: '30',
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const daysOfWeek = [
    'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
  ];

  useEffect(() => {
    fetchDoctors();
    fetchSchedules();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await fetch('/api/doctors');
      if (response.ok) {
        const data = await response.json();
        setDoctors(data);
      }
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
        setSchedules(data);
      } else {
        const errorData = await response.json();
        setAlert({
          type: 'error',
          title: 'Error',
          message: errorData.message || 'No se pudieron cargar los horarios'
        });
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
      setAlert({
        type: 'error',
        title: 'Error de conexión',
        message: 'No se pudo conectar con el servidor'
      });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    // Validar doctor
    if (!formData.doctor_id) {
      newErrors.doctor_id = 'Debe seleccionar un médico';
    }

    // Validar fecha específica
    if (!formData.specific_date) {
      newErrors.specific_date = 'Debe seleccionar una fecha';
    } else {
      const selectedDate = new Date(formData.specific_date + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.specific_date = 'No puede seleccionar fechas pasadas';
      }
    }

    // Validar horarios
    const start = parseInt(formData.start_time.split(':')[0]);
    const end = parseInt(formData.end_time.split(':')[0]);

    if (start >= end) {
      newErrors.time_range = 'La hora de fin debe ser posterior a la hora de inicio';
    }

    if (start < 6) {
      newErrors.start_time = 'La hora de inicio no puede ser antes de las 6:00 AM';
    }

    if (end > 22) {
      newErrors.end_time = 'La hora de fin no puede ser después de las 10:00 PM';
    }

    // Validar duración del slot
    const duration = parseInt(formData.slot_duration);
    if (duration < 15) {
      newErrors.slot_duration = 'La duración mínima es 15 minutos';
    }
    
    if (duration > 240) {
      newErrors.slot_duration = 'La duración máxima es 4 horas (240 minutos)';
    }

    if (duration % 5 !== 0) {
      newErrors.slot_duration = 'La duración debe ser múltiplo de 5 minutos';
    }

    // Validar que la duración quepa en el rango
    const totalMinutes = (end - start) * 60;
    if (duration > totalMinutes) {
      newErrors.slot_duration = `La duración (${duration} min) no cabe en el rango horario (${totalMinutes} min)`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 FRONTEND: Iniciando envío de formulario');
    console.log('📝 Datos del formulario:', formData);
    
    // Validar formulario
    if (!validateForm()) {
      console.log('❌ FRONTEND: Validación falló', errors);
      setAlert({
        type: 'error',
        title: 'Datos inválidos',
        message: 'Por favor corrija los errores en el formulario',
        errors: Object.values(errors)
      });
      return;
    }

    console.log('✅ FRONTEND: Validación OK, enviando request...');
    setSubmitting(true);
    setAlert(null);
    
    try {
      const payload = {
        doctor_id: formData.doctor_id,
        day_of_week: parseInt(formData.day_of_week),
        start_time: formData.start_time,
        end_time: formData.end_time,
        slot_duration: parseInt(formData.slot_duration),
      };
      console.log('📤 FRONTEND: Enviando payload:', payload);

      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('📥 FRONTEND: Response status:', response.status);
      const data = await response.json();
      console.log('📥 FRONTEND: Response data:', data);

      if (response.ok) {
        console.log('✅ FRONTEND: Horario creado exitosamente');
        setAlert({
          type: 'success',
          title: '¡Éxito!',
          message: data.message || 'Horario creado correctamente'
        });
        
        setShowForm(false);
        setFormData({
          doctor_id: '',
          day_of_week: '1',
          specific_date: '',
          start_time: '09:00',
          end_time: '17:00',
          slot_duration: '30',
        });
        setErrors({});
        fetchSchedules();
      } else {
        console.log('❌ FRONTEND: Error al crear horario');
        setAlert({
          type: 'error',
          title: data.error || 'Error',
          message: data.message || 'No se pudo crear el horario',
          errors: data.errors
        });
      }
    } catch (error) {
      console.error('❌ FRONTEND: Error de conexión:', error);
      setAlert({
        type: 'error',
        title: 'Error de conexión',
        message: 'No se pudo conectar con el servidor. Verifique su conexión e intente nuevamente.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const generateTimeSlots = async (scheduleId: string, doctorName: string) => {
    if (!confirm(`¿Generar espacios de tiempo para ${doctorName}?\n\nEsto creará slots disponibles para los próximos 30 días.`)) {
      return;
    }

    try {
      const response = await fetch('/api/timeslots/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduleId, daysAhead: 30 }),
      });

      const data = await response.json();

      if (response.ok) {
        setAlert({
          type: 'success',
          title: '¡Espacios generados!',
          message: data.message || `Se generaron ${data.slotsCreated || 0} espacios de tiempo`
        });
      } else {
        setAlert({
          type: 'error',
          title: 'Error',
          message: data.message || 'No se pudieron generar los espacios de tiempo'
        });
      }
    } catch (error) {
      console.error('Error generating slots:', error);
      setAlert({
        type: 'error',
        title: 'Error',
        message: 'Error al generar espacios de tiempo'
      });
    }
  };

  const deleteSchedule = async (scheduleId: string, doctorName: string) => {
    if (!confirm(`¿Está seguro de desactivar este horario?\n\nDoctor: ${doctorName}\n\nNota: El horario será marcado como inactivo y no se generarán más slots.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/schedules?id=${scheduleId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setAlert({
          type: 'success',
          title: 'Horario desactivado',
          message: data.message || 'El horario fue desactivado exitosamente'
        });
        fetchSchedules();
      } else {
        setAlert({
          type: 'error',
          title: data.error || 'Error',
          message: data.message || 'No se pudo desactivar el horario',
          errors: data.errors
        });
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      setAlert({
        type: 'error',
        title: 'Error',
        message: 'Error al desactivar el horario'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <Calendar className="w-8 h-8" />
              Gestión de Horarios
            </h1>
            <p className="text-gray-600 mt-1">Configure los horarios de atención de los médicos</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/"
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg"
            >
              Volver
            </Link>
            <button
              onClick={() => {
                setShowForm(!showForm);
                setAlert(null);
                setErrors({});
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {showForm ? 'Cancelar' : 'Nuevo Horario'}
            </button>
          </div>
        </div>

        {/* Alert */}
        {alert && (
          <div className="mb-6">
            <Alert
              type={alert.type}
              title={alert.title}
              message={alert.message}
              errors={alert.errors}
              onClose={() => setAlert(null)}
            />
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Crear Nuevo Horario</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Doctor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Médico *
                </label>
                <select
                  value={formData.doctor_id}
                  onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.doctor_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={submitting}
                >
                  <option value="">Seleccione un médico</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name} - {doctor.specialty}
                    </option>
                  ))}
                </select>
                {errors.doctor_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.doctor_id}</p>
                )}
              </div>

              {/* Specific Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Específica *
                </label>
                <input
                  type="date"
                  value={formData.specific_date}
                  onChange={(e) => {
                    const selectedDate = e.target.value;
                    const date = new Date(selectedDate + 'T00:00:00');
                    const dayOfWeek = date.getDay();
                    setFormData({ 
                      ...formData, 
                      specific_date: selectedDate,
                      day_of_week: dayOfWeek.toString()
                    });
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.specific_date ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={submitting}
                />
                {formData.specific_date && (
                  <p className="mt-1 text-sm text-gray-600">
                    📅 {daysOfWeek[parseInt(formData.day_of_week)]}
                  </p>
                )}
                {errors.specific_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.specific_date}</p>
                )}
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora de Inicio *
                  </label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.start_time ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={submitting}
                  />
                  {errors.start_time && (
                    <p className="mt-1 text-sm text-red-600">{errors.start_time}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora de Fin *
                  </label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.end_time ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={submitting}
                  />
                  {errors.end_time && (
                    <p className="mt-1 text-sm text-red-600">{errors.end_time}</p>
                  )}
                </div>
              </div>

              {errors.time_range && (
                <div className="flex items-start gap-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{errors.time_range}</span>
                </div>
              )}

              {/* Slot Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duración de cada cita (minutos) *
                </label>
                <select
                  value={formData.slot_duration}
                  onChange={(e) => setFormData({ ...formData, slot_duration: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.slot_duration ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={submitting}
                >
                  <option value="15">15 minutos</option>
                  <option value="20">20 minutos</option>
                  <option value="30">30 minutos</option>
                  <option value="45">45 minutos</option>
                  <option value="60">1 hora</option>
                  <option value="90">1.5 horas</option>
                  <option value="120">2 horas</option>
                </select>
                {errors.slot_duration && (
                  <p className="mt-1 text-sm text-red-600">{errors.slot_duration}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Cada cita ocupará este tiempo en el calendario
                </p>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setErrors({});
                    setAlert(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Guardando...
                    </>
                  ) : (
                    'Crear Horario'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Schedules List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" message="Cargando horarios..." />
          </div>
        ) : schedules.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay horarios configurados</h3>
            <p className="text-gray-600 mb-6">Cree el primer horario para comenzar a agendar citas</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Crear Primer Horario
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {schedules.map((schedule) => (
              <div key={schedule.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {schedule.doctor?.name || 'Doctor desconocido'}
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{daysOfWeek[schedule.day_of_week]}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{schedule.start_time} - {schedule.end_time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>Citas de {schedule.slot_duration} minutos</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Especialidad:</span>
                        <span className="ml-2">{schedule.doctor?.specialty}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => generateTimeSlots(schedule.id, schedule.doctor?.name || '')}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Generar Espacios
                    </button>
                    <button
                      onClick={() => deleteSchedule(schedule.id, schedule.doctor?.name || '')}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
