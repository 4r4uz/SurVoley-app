import { useList, UseListReturn } from '../useList';
import { PagosService, Pago } from '../../services/pagosService';

export interface UseApoderadoPagosReturn {
  list: UseListReturn<Pago>;
  // Apoderado has limited permissions - solo ve pagos de su jugador tutorado
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewAll: boolean;
  visibleColumns: string[];
}

export function useApoderadoPagos(jugadorTutoradoId?: string): UseApoderadoPagosReturn {
  const list = useList<Pago>({
    fetchItems: () => jugadorTutoradoId ? PagosService.getByJugador(jugadorTutoradoId) : Promise.resolve([]),
    calculateStats: (pagos) => ({
      total: pagos.length,
      pendientes: pagos.filter(p => p.estado_pago === 'Pendiente').length,
      pagados: pagos.filter(p => p.estado_pago === 'Pagado').length,
    }),
    searchFields: ['mes_referencia'],
  });

  return {
    list,
    canCreate: false, // Apoderados no pueden crear pagos
    canEdit: false,   // Solo pueden ver pagos de su tutorado
    canDelete: false,
    canViewAll: false, // Solo ven pagos de su jugador tutorado
    visibleColumns: ['monto', 'estado_pago', 'fecha_vencimiento', 'mes_referencia', 'anio_referencia'],
  };
}
