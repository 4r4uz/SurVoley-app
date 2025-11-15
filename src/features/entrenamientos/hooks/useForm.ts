import { useForm as useBaseForm, UseFormReturn, UseFormConfig } from '../../pagos/hooks/useForm';
import { EntrenamientosService, Entrenamiento } from '../services/entrenamientosService';
import { CreateEntrenamientoData, UpdateEntrenamientoData } from '../schema/entrenamientosSchema';

export interface EntrenamientoFormData {
  fecha_hora: Date;
  lugar: string;
  id_entrenador: string;
  duracion_minutos: number;
  descripcion?: string;
}

export interface UseFormEntrenamientosReturn extends UseFormReturn<EntrenamientoFormData> {}

export function useForm(config?: Partial<UseFormConfig<EntrenamientoFormData>>): UseFormEntrenamientosReturn {
  const baseConfig: UseFormConfig<EntrenamientoFormData> = {
    initialData: {
      fecha_hora: new Date(),
      lugar: '',
      id_entrenador: '',
      duracion_minutos: 90, // 90 minutos por defecto
      descripcion: '',
    },
    validate: (data) => {
      const errors: Record<string, string> = {};
      if (!data.lugar) errors.lugar = 'El lugar es obligatorio';
      if (!data.id_entrenador) errors.id_entrenador = 'Debe seleccionar un entrenador';
      if (data.duracion_minutos < 1) errors.duracion_minutos = 'La duración debe ser mayor a 0';
      if (data.fecha_hora <= new Date()) {
        errors.fecha_hora = 'La fecha y hora deben ser futuras';
      }
      return errors;
    },
    onSubmit: async (data, isEditing) => {
      if (isEditing) {
        // Para edición necesitaríamos el ID del entrenamiento
        throw new Error('Edit functionality needs entrenamiento ID');
      } else {
        await EntrenamientosService.create(data as CreateEntrenamientoData);
      }
    },
    onSuccess: () => {
      // Refresh logic would be handled by parent
    },
    ...config,
  };

  return useBaseForm<EntrenamientoFormData>(baseConfig);
}
