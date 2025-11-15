import { useList, UseListAsistenciasReturn } from '../useList';
import { AsistenciasService, Asistencia } from '../../services/asistenciasService';

export interface UseJugadorAsistenciasReturn {
  list: UseListAsistenciasReturn;
  // Jugador has limited permissions - solo ve su propia asistencia
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewAll: boolean;
  visibleColumns: string[];
}

export function useJugadorAsistencias(userId?: string): UseJugadorAsistenciasReturn {
  const list = useList({
    fetchItems: () => userId ? AsistenciasService.getByJugador(userId) : Promise.resolve([]),
    calculateStats: (asistencias) => ({
      total: asistencias.length,
      presentes: asistencias.filter(a => a.estado_asistencia === 'Presente').length,
      ausentes: asistencias.filter(a => a.estado_asistencia === 'Ausente').length,
      justificados: asistencias.filter(a => a.estado_asistencia === 'Justificado').length,
    }),
    searchFields: ['entrenamiento.lugar', 'evento.titulo'],
  });

  return {
    list,
    canCreate: false, // Jugador no puede crear asistencias
    canEdit: false,   // Solo puede ver sus asistencias
    canDelete: false,
    canViewAll: false, // Solo ve sus propias asistencias
    visibleColumns: ['estado_asistencia', 'fecha_asistencia', 'entrenamiento.lugar', 'entrenamiento.fecha_hora', 'evento.titulo', 'evento.fecha_hora'],
  };
}
