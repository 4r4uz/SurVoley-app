import { useList, UseListReturn } from '../useList';
import { PagosService, Pago } from '../../services/pagosService';

export interface UseJugadorPagosReturn {
  list: UseListReturn<Pago>;
  // Jugador has limited permissions
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewAll: boolean;
  visibleColumns: string[];
}

export function useJugadorPagos(userId?: string): UseJugadorPagosReturn {
  const list = useList<Pago>({
    fetchItems: () => userId ? PagosService.getByJugador(userId) : Promise.resolve([]),
    calculateStats: (pagos) => ({
      total: pagos.length,
      pendientes: pagos.filter(p => p.estado_pago === 'Pendiente').length,
      pagados: pagos.filter(p => p.estado_pago === 'Pagado').length,
    }),
    searchFields: ['mes_referencia'],
  });

  return {
    list,
    canCreate: false, // Jugadores no pueden crear pagos
    canEdit: false,   // Solo pueden ver sus propios pagos
    canDelete: false,
    canViewAll: false, // Solo ven sus propios pagos
    visibleColumns: ['monto', 'estado_pago', 'fecha_vencimiento', 'mes_referencia', 'anio_referencia'],
  };
}
