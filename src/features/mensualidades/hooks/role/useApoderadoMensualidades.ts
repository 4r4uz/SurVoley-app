import { useList, UseListMensualidadesReturn } from '../useList';
import { MensualidadesService, Mensualidad } from '../../services/mensualidadesService';

export interface UseApoderadoMensualidadesReturn {
  list: UseListMensualidadesReturn;
  // Apoderado ve mensualidades de sus jugadores asociados y puede pagarlas
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewAll: boolean;
  visibleColumns: string[];
  // Funciones específicas del apoderado
  pagarMensualidad: (mensualidadId: string, metodoPago: string) => Promise<void>;
}

export function useApoderadoMensualidades(jugadoresAsociados: string[] = []): UseApoderadoMensualidadesReturn {
  const list = useList({
    fetchItems: async () => {
      // Obtener mensualidades de todos los jugadores asociados
      const allMensualidades: Mensualidad[] = [];
      for (const jugadorId of jugadoresAsociados) {
        const mensualidades = await MensualidadesService.getByJugador(jugadorId);
        allMensualidades.push(...mensualidades);
      }
      return allMensualidades;
    },
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

  const pagarMensualidad = async (mensualidadId: string, metodoPago: string) => {
    await MensualidadesService.update(mensualidadId, {
      estado_pago: 'Pagado',
      fecha_pago: new Date(),
      metodo_pago: metodoPago,
    });
    list.onRefresh();
  };

  return {
    list,
    canCreate: false, // Apoderado no puede crear mensualidades
    canEdit: true,    // Puede marcar como pagadas
    canDelete: false,
    canViewAll: false, // Solo ve mensualidades de sus hijos
    visibleColumns: ['jugador.nombre', 'jugador.apellido', 'monto', 'estado_pago', 'fecha_vencimiento', 'mes_referencia'],
    pagarMensualidad,
  };
}
