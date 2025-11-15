import { useList, UseListMensualidadesReturn } from '../useList';
import { MensualidadesService, Mensualidad } from '../../services/mensualidadesService';

export interface UseJugadorMensualidadesReturn {
  list: UseListMensualidadesReturn;
  // Jugador has limited permissions - solo ve sus propias mensualidades
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewAll: boolean;
  visibleColumns: string[];
}

export function useJugadorMensualidades(userId?: string): UseJugadorMensualidadesReturn {
  const list = useList({
    fetchItems: () => userId ? MensualidadesService.getByJugador(userId) : Promise.resolve([]),
    calculateStats: (mensualidades) => ({
      total: mensualidades.length,
      pendientes: mensualidades.filter(m => m.estado_pago === 'Pendiente').length,
      pagadas: mensualidades.filter(m => m.estado_pago === 'Pagado').length,
      vencidas: mensualidades.filter(m => {
        const today = new Date();
        const vencimiento = new Date(m.fecha_vencimiento);
        return m.estado_pago === 'Pendiente' && vencimiento < today;
      }).length,
    }),
    searchFields: ['mes_referencia'],
  });

  return {
    list,
    canCreate: false, // Jugador no puede crear mensualidades
    canEdit: false,   // Solo puede ver sus mensualidades
    canDelete: false,
    canViewAll: false, // Solo ve sus propias mensualidades
    visibleColumns: ['monto', 'estado_pago', 'fecha_vencimiento', 'mes_referencia', 'anio_referencia'],
  };
}
