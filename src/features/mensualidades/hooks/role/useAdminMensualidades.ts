import { useList, UseListMensualidadesReturn } from '../useList';
import { useForm, UseFormMensualidadesReturn } from '../useForm';
import { MensualidadesService, Mensualidad } from '../../services/mensualidadesService';

export interface UseAdminMensualidadesReturn {
  list: UseListMensualidadesReturn;
  form: UseFormMensualidadesReturn;
  // Admin has full permissions
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewAll: boolean;
  visibleColumns: string[];
}

export function useAdminMensualidades(): UseAdminMensualidadesReturn {
  const list = useList({
    fetchItems: MensualidadesService.getAll,
    calculateStats: (mensualidades) => ({
      total: mensualidades.length,
      pendientes: mensualidades.filter(m => m.estado_pago === 'Pendiente').length,
      pagadas: mensualidades.filter(m => m.estado_pago === 'Pagado').length,
      canceladas: mensualidades.filter(m => m.estado_pago === 'Cancelado').length,
      vencidas: mensualidades.filter(m => {
        const today = new Date();
        const vencimiento = new Date(m.fecha_vencimiento);
        return m.estado_pago === 'Pendiente' && vencimiento < today;
      }).length,
    }),
    searchFields: ['jugador.nombre', 'jugador.apellido', 'mes_referencia'],
  });

  const form = useForm({
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
