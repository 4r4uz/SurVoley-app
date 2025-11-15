import { useList, UseListAsistenciasReturn } from '../useList';
import { AsistenciasService, Asistencia } from '../../services/asistenciasService';

export interface UseApoderadoAsistenciasReturn {
  list: UseListAsistenciasReturn;
  // Apoderado ve asistencias de sus jugadores asociados
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewAll: boolean;
  visibleColumns: string[];
}

export function useApoderadoAsistencias(jugadoresAsociados: string[] = []): UseApoderadoAsistenciasReturn {
  const list = useList({
    fetchItems: async () => {
      // Obtener asistencias de todos los jugadores asociados
      const allAsistencias: Asistencia[] = [];
      for (const jugadorId of jugadoresAsociados) {
        const asistencias = await AsistenciasService.getByJugador(jugadorId);
        allAsistencias.push(...asistencias);
      }
      return allAsistencias;
    },
    calculateStats: (asistencias) => ({
      total: asistencias.length,
      presentes: asistencias.filter(a => a.estado_asistencia === 'Presente').length,
      ausentes: asistencias.filter(a => a.estado_asistencia === 'Ausente').length,
      justificados: asistencias.filter(a => a.estado_asistencia === 'Justificado').length,
    }),
    searchFields: ['jugador.nombre', 'jugador.apellido', 'entrenamiento.lugar', 'evento.titulo'],
  });

  return {
    list,
    canCreate: false, // Apoderado no puede crear asistencias
    canEdit: false,   // Solo puede ver asistencias de sus hijos
    canDelete: false,
    canViewAll: false, // Solo ve asistencias de sus jugadores asociados
    visibleColumns: ['jugador.nombre', 'jugador.apellido', 'estado_asistencia', 'fecha_asistencia', 'entrenamiento.lugar', 'evento.titulo'],
  };
}
