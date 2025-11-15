import { useList, UseListReturn } from '../useList';
import { useForm, UseFormReturn } from '../useForm';
import { PagosService, Pago } from '../../services/pagosService';
import { CreatePagoData, UpdatePagoData } from '../../schema/pagosSchema';

export interface UseAdminPagosReturn {
  list: UseListReturn<Pago>;
  form: UseFormReturn<PagoFormData>;
  // Admin has full permissions
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewAll: boolean;
  visibleColumns: string[];
}

export interface PagoFormData {
  monto: number;
  fecha_pago?: Date;
  metodo_pago?: string;
  estado_pago: 'Pendiente' | 'Pagado' | 'Cancelado';
  id_jugador: string;
  fecha_vencimiento: Date;
  mes_referencia: string;
  anio_referencia: number;
}

export function useAdminPagos(): UseAdminPagosReturn {
  const list = useList<Pago>({
    fetchItems: PagosService.getAll,
    calculateStats: (pagos) => ({
      total: pagos.length,
      pendientes: pagos.filter(p => p.estado_pago === 'Pendiente').length,
      pagados: pagos.filter(p => p.estado_pago === 'Pagado').length,
      cancelados: pagos.filter(p => p.estado_pago === 'Cancelado').length,
    }),
    searchFields: ['jugador.nombre', 'jugador.apellido', 'mes_referencia'],
  });

  const form = useForm<PagoFormData>({
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
        // For editing, we need the pago ID - this would be set when opening edit modal
        throw new Error('Edit functionality needs pago ID');
      } else {
        await PagosService.create(data as CreatePagoData);
      }
    },
    onSuccess: () => {
      list.onRefresh();
    },
  });

  return {
    list,
    form,
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canViewAll: true,
    visibleColumns: ['all'], // Show all columns
  };
}
