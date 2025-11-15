import { useForm as useBaseForm, UseFormReturn, UseFormConfig } from '../../pagos/hooks/useForm';
import { AsistenciasService, Asistencia } from '../services/asistenciasService';
import { CreateAsistenciaData, UpdateAsistenciaData } from '../schema/asistenciasSchema';

export interface AsistenciaFormData {
  estado_asistencia: 'Presente' | 'Ausente' | 'Justificado' | 'Sin registro';
  id_jugador: string;
  id_entrenamiento?: string;
  id_evento?: string;
  fecha_asistencia: Date;
}

export interface UseFormAsistenciasReturn extends UseFormReturn<AsistenciaFormData> {}

export function useForm(config?: Partial<UseFormConfig<AsistenciaFormData>>): UseFormAsistenciasReturn {
  const baseConfig: UseFormConfig<AsistenciaFormData> = {
    initialData: {
      estado_asistencia: 'Sin registro',
      id_jugador: '',
      fecha_asistencia: new Date(),
    },
    validate: (data) => {
      const errors: Record<string, string> = {};
      if (!data.id_jugador) errors.id_jugador = 'Debe seleccionar un jugador';
      if (!data.id_entrenamiento && !data.id_evento) {
        errors.id_entrenamiento = 'Debe seleccionar un entrenamiento o evento';
      }
      return errors;
    },
    onSubmit: async (data, isEditing) => {
      if (isEditing) {
        // Para edición necesitaríamos el ID de la asistencia
        throw new Error('Edit functionality needs asistencia ID');
      } else {
        await AsistenciasService.create(data as CreateAsistenciaData);
      }
    },
    onSuccess: () => {
      // Refresh logic would be handled by parent
    },
    ...config,
  };

  return useBaseForm<AsistenciaFormData>(baseConfig);
}
