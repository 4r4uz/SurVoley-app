import { useList, UseListMensualidadesReturn } from '../useList';
import { MensualidadesService, Mensualidad } from '../../services/mensualidadesService';

export interface UseEntrenadorMensualidadesReturn {
  list: UseListMensualidadesReturn;
  // Entrenador has read-only permissions for mensualidades
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewAll: boolean;
  visibleColumns: string[];
}

export function useEntrenadorMensualidades(): UseEntrenadorMensualidadesReturn {
  const list = useList({
    fetchItems: MensualidadesService.getAll, // Entrenador ve todas las mensualidades
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
    searchFields: ['jugador.nombre', 'jugador.apellido', 'mes_referencia'],
  });

  return {
    list,
    canCreate: false, // Entrenadores no pueden crear mensualidades
    canEdit: false,   // Solo pueden ver las mensualidades
    canDelete: false,
    canViewAll: true, // Pueden ver todas las mensualidades
    visibleColumns: ['jugador.nombre', 'jugador.apellido', 'monto', 'estado_pago', 'fecha_vencimiento', 'mes_referencia'],
  };
}
