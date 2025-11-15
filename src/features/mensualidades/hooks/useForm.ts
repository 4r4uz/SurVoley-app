import { useForm as useBaseForm, UseFormReturn, UseFormConfig } from '../../pagos/hooks/useForm';
import { MensualidadesService, Mensualidad } from '../services/mensualidadesService';
import { CreatePagoData, UpdatePagoData } from '../schema/mensualidadesSchema';

export interface MensualidadFormData {
  monto: number;
  fecha_pago?: Date;
  metodo_pago?: string;
  estado_pago: 'Pendiente' | 'Pagado' | 'Cancelado';
  id_jugador: string;
  fecha_vencimiento: Date;
  mes_referencia: string;
  anio_referencia: number;
}

export interface UseFormMensualidadesReturn extends UseFormReturn<MensualidadFormData> {}

export function useForm(config?: Partial<UseFormConfig<MensualidadFormData>>): UseFormMensualidadesReturn {
  const baseConfig: UseFormConfig<MensualidadFormData> = {
    initialData: {
      monto: 0,
      estado_pago: 'Pendiente',
      id_jugador: '',
      fecha_vencimiento: new Date(),
      mes_referencia: '',
      anio_referencia: new Date().getFullYear(),
    },
    validate: (data) => {
      const errors: Record<string, string> = {};
      if (data.monto <= 0) errors.monto = 'El monto debe ser mayor a 0';
      if (!data.id_jugador) errors.id_jugador = 'Debe seleccionar un jugador';
      if (!data.mes_referencia) errors.mes_referencia = 'El mes de referencia es obligatorio';
      if (data.anio_referencia < 2020 || data.anio_referencia > 2050) {
        errors.anio_referencia = 'El año debe estar entre 2020 y 2050';
      }
      return errors;
    },
    onSubmit: async (data, isEditing) => {
      if (isEditing) {
        // Para edición necesitaríamos el ID de la mensualidad
        throw new Error('Edit functionality needs mensualidad ID');
      } else {
        await MensualidadesService.create(data as CreatePagoData);
      }
    },
    onSuccess: () => {
      // Refresh logic would be handled by parent
    },
    ...config,
  };

  return useBaseForm<MensualidadFormData>(baseConfig);
}
