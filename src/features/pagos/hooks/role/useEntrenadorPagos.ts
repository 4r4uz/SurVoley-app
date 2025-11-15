import { useList, UseListReturn } from '../useList';
import { PagosService, Pago } from '../../services/pagosService';

export interface UseEntrenadorPagosReturn {
  list: UseListReturn<Pago>;
  // Entrenador has read-only permissions for pagos
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewAll: boolean;
  visibleColumns: string[];
}

export function useEntrenadorPagos(): UseEntrenadorPagosReturn {
  const list = useList<Pago>({
    fetchItems: PagosService.getAll, // Entrenadores pueden ver todos los pagos
    calculateStats: (pagos) => ({
      total: pagos.length,
      pendientes: pagos.filter(p => p.estado_pago === 'Pendiente').length,
      pagados: pagos.filter(p => p.estado_pago === 'Pagado').length,
      cancelados: pagos.filter(p => p.estado_pago === 'Cancelado').length,
    }),
    searchFields: ['jugador.nombre', 'jugador.apellido', 'mes_referencia'],
  });

  return {
    list,
    canCreate: false, // Entrenadores no pueden crear pagos
    canEdit: false,   // Solo pueden ver los pagos
    canDelete: false,
    canViewAll: true, // Pueden ver todos los pagos
    visibleColumns: ['jugador.nombre', 'jugador.apellido', 'monto', 'estado_pago', 'fecha_vencimiento', 'mes_referencia'],
  };
}
