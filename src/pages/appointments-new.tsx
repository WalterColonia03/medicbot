import { useEffect, useState } from 'react';
import { Calendar, User, Phone, Clock, Filter, X } from 'lucide-react';
import Link from 'next/link';
import Alert from '@/components/Alert';
import LoadingSpinner from '@/components/LoadingSpinner';
import { format } from 'date-fns';

interface Appointment {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  reason: string | null;
  notification_sent: boolean;
  reminder_sent: boolean;
  created_at: string;
  patient_name: string;
  patient_phone: string;
  patient_email: string | null;
  doctor_name: string;
  doctor_specialty: string;
  cancellation_reason?: string;
  cancelled_at?: string;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [alert, setAlert] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    title?: string;
    message: string;
    errors?: string[];
  } | null>(null);

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const statusOptions = [
    { value: 'all', label: 'Todas las citas', color: 'gray' },
    { value: 'confirmed', label: 'Confirmadas', color: 'green' },
    { value: 'pending', label: 'Pendientes', color: 'yellow' },
    { value: 'cancelled', label: 'Canceladas', color: 'red' },
    { value: 'completed', label: 'Completadas', color: 'blue' },
  ];

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [appointments, statusFilter, dateFilter]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/appointments');
      
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      } else {
        const errorData = await response.json();
        setAlert({
          type: 'error',
          title: 'Error',
          message: errorData.message || 'No se pudieron cargar las citas'
        });
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setAlert({
        type: 'error',
        title: 'Error de conexión',
        message: 'No se pudo conectar con el servidor'
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...appointments];

    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }

    // Filtro por fecha
    if (dateFilter) {
      filtered = filtered.filter(apt => apt.appointment_date === dateFilter);
    }

    setFilteredAppointments(filtered);
  };

  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;

    // Validar razón de cancelación
    if (cancellationReason.trim().length < 10) {
      setAlert({
        type: 'error',
        title: 'Razón incompleta',
        message: 'La razón de cancelación debe tener al menos 10 caracteres'
      });
      return;
    }

    setCancelling(true);
    setAlert(null);

    try {
      const response = await fetch(`/api/appointments?id=${selectedAppointment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'cancelled',
          cancellation_reason: cancellationReason
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setAlert({
          type: 'success',
          title: '¡Cita cancelada!',
          message: data.message || 'La cita fue cancelada exitosamente'
        });
        
        setShowCancelModal(false);
        setSelectedAppointment(null);
        setCancellationReason('');
        fetchAppointments();
      } else {
        setAlert({
          type: 'error',
          title: data.error || 'Error',
          message: data.message || 'No se pudo cancelar la cita',
          errors: data.errors
        });
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      setAlert({
        type: 'error',
        title: 'Error',
        message: 'Error al cancelar la cita'
      });
    } finally {
      setCancelling(false);
    }
  };

  const sendReminder = async (appointmentId: string, patientPhone: string, patientName: string) => {
    if (!confirm(`¿Enviar recordatorio a ${patientName}?\n\nSe enviará un mensaje de WhatsApp al número ${patientPhone}`)) {
      return;
    }

    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId,
          type: 'reminder'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setAlert({
          type: 'success',
          title: '¡Recordatorio enviado!',
          message: `Se envió el recordatorio a ${patientName}`
        });
        fetchAppointments();
      } else {
        setAlert({
          type: 'error',
          title: 'Error',
          message: data.message || 'No se pudo enviar el recordatorio'
        });
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
      setAlert({
        type: 'error',
        title: 'Error',
        message: 'Error al enviar recordatorio'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      confirmed: 'bg-green-100 text-green-800 border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      completed: 'bg-blue-100 text-blue-800 border-blue-200',
      no_show: 'bg-gray-100 text-gray-800 border-gray-200',
    };

    const labels = {
      confirmed: 'Confirmada',
      pending: 'Pendiente',
      cancelled: 'Cancelada',
      completed: 'Completada',
      no_show: 'No asistió',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles] || styles.pending}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const canCancelAppointment = (appointment: Appointment): boolean => {
    if (appointment.status === 'cancelled' || appointment.status === 'completed') {
      return false;
    }

    // Verificar que no sea en el pasado (más de 2 horas)
    const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.start_time}`);
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    return appointmentDateTime >= twoHoursAgo;
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy');
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string): string => {
    return timeString.substring(0, 5);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <Calendar className="w-8 h-8" />
              Gestión de Citas
            </h1>
            <p className="text-gray-600 mt-1">Visualice y administre todas las citas médicas</p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg"
          >
            Volver
          </Link>
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

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold">Filtros</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {dateFilter && (
                  <button
                    onClick={() => setDateFilter('')}
                    className="px-3 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg"
                    title="Limpiar filtro de fecha"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-3 text-sm text-gray-600">
            Mostrando {filteredAppointments.length} de {appointments.length} citas
          </div>
        </div>

        {/* Appointments List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" message="Cargando citas..." />
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {appointments.length === 0 ? 'No hay citas registradas' : 'No se encontraron citas'}
            </h3>
            <p className="text-gray-600">
              {appointments.length === 0 
                ? 'Las citas aparecerán aquí cuando los pacientes las agenden'
                : 'Intente cambiar los filtros para ver más resultados'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => (
              <div key={appointment.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {appointment.patient_name}
                      </h3>
                      {getStatusBadge(appointment.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 flex-shrink-0" />
                        <span className="font-medium">{appointment.doctor_name}</span>
                        <span className="text-gray-400">-</span>
                        <span>{appointment.doctor_specialty}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <span>{appointment.patient_phone}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span>{formatDate(appointment.appointment_date)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span>{formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}</span>
                      </div>
                    </div>

                    {appointment.reason && (
                      <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-700">
                        <span className="font-medium">Motivo:</span> {appointment.reason}
                      </div>
                    )}

                    {appointment.status === 'cancelled' && appointment.cancellation_reason && (
                      <div className="mt-3 p-2 bg-red-50 rounded text-sm text-red-700 border border-red-200">
                        <span className="font-medium">Razón de cancelación:</span> {appointment.cancellation_reason}
                      </div>
                    )}

                    {/* Notification status */}
                    <div className="mt-3 flex gap-4 text-xs text-gray-500">
                      <span>
                        Notificación: {appointment.notification_sent ? '✓ Enviada' : '✗ No enviada'}
                      </span>
                      <span>
                        Recordatorio: {appointment.reminder_sent ? '✓ Enviado' : '✗ No enviado'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 ml-4">
                    {appointment.status === 'confirmed' && !appointment.reminder_sent && (
                      <button
                        onClick={() => sendReminder(appointment.id, appointment.patient_phone, appointment.patient_name)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 whitespace-nowrap"
                      >
                        Enviar Recordatorio
                      </button>
                    )}
                    
                    {canCancelAppointment(appointment) && (
                      <button
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setShowCancelModal(true);
                          setAlert(null);
                        }}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 whitespace-nowrap"
                      >
                        Cancelar Cita
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cancel Modal */}
        {showCancelModal && selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-semibold mb-4">Cancelar Cita</h3>
              
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>Paciente:</strong> {selectedAppointment.patient_name}<br />
                  <strong>Fecha:</strong> {formatDate(selectedAppointment.appointment_date)} a las {formatTime(selectedAppointment.start_time)}<br />
                  <strong>Doctor:</strong> {selectedAppointment.doctor_name}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Razón de cancelación * (mínimo 10 caracteres)
                </label>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Ej: Paciente solicitó cancelación por motivos personales"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  disabled={cancelling}
                />
                <p className="mt-1 text-sm text-gray-500">
                  {cancellationReason.length} / 500 caracteres
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setSelectedAppointment(null);
                    setCancellationReason('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg"
                  disabled={cancelling}
                >
                  Volver
                </button>
                <button
                  onClick={handleCancelAppointment}
                  disabled={cancelling || cancellationReason.trim().length < 10}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {cancelling ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Cancelando...
                    </>
                  ) : (
                    'Confirmar Cancelación'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
