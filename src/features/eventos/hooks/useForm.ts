import { useForm as useBaseForm, UseFormReturn, UseFormConfig } from '../../pagos/hooks/useForm';
import { EventosService, Evento } from '../services/eventosService';
import { CreateEventoData, UpdateEventoData } from '../schema/eventosSchema';

export interface EventoFormData {
  titulo: string;
  tipo_evento: 'Partido' | 'Torneo' | 'Amistoso' | 'Entrenamiento';
  fecha_hora: Date;
  ubicacion: string;
  id_organizador: string;
}

export interface UseFormEventosReturn extends UseFormReturn<EventoFormData> {}

export function useForm(config?: Partial<UseFormConfig<EventoFormData>>): UseFormEventosReturn {
  const baseConfig: UseFormConfig<EventoFormData> = {
    initialData: {
      titulo: '',
      tipo_evento: 'Partido',
      fecha_hora: new Date(),
      ubicacion: '',
      id_organizador: '',
    },
    validate: (data) => {
      const errors: Record<string, string> = {};
      if (!data.titulo) errors.titulo = 'El título es obligatorio';
      if (!data.ubicacion) errors.ubicacion = 'La ubicación es obligatoria';
      if (!data.id_organizador) errors.id_organizador = 'Debe seleccionar un organizador';
      if (data.fecha_hora <= new Date()) {
        errors.fecha_hora = 'La fecha y hora deben ser futuras';
      }
      return errors;
    },
    onSubmit: async (data, isEditing) => {
      if (isEditing) {
        // Para edición necesitaríamos el ID del evento
        throw new Error('Edit functionality needs evento ID');
      } else {
        await EventosService.create(data as CreateEventoData);
      }
    },
    onSuccess: () => {
      // Refresh logic would be handled by parent
    },
    ...config,
  };

  return useBaseForm<EventoFormData>(baseConfig);
}
