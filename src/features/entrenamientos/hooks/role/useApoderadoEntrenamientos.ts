import { useList, UseListEntrenamientosReturn } from '../useList';
import { EntrenamientosService, Entrenamiento } from '../../services/entrenamientosService';

export interface UseApoderadoEntrenamientosReturn {
  list: UseListEntrenamientosReturn;
  // Apoderado can view trainings of their associated players
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewAll: boolean;
  visibleColumns: string[];
}

export function useApoderadoEntrenamientos(): UseApoderadoEntrenamientosReturn {
  const list = useList({
    fetchItems: EntrenamientosService.getProximos, // Apoderado ve entrenamientos próximos
    calculateStats: (entrenamientos) => {
      const now = new Date();
      return {
        total: entrenamientos.length,
        estaSemana: entrenamientos.filter(e => {
          const fecha = new Date(e.fecha_hora);
          const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          return fecha >= now && fecha <= weekFromNow;
        }).length,
        esteMes: entrenamientos.filter(e => {
          const fecha = new Date(e.fecha_hora);
          return fecha.getMonth() === now.getMonth() && fecha.getFullYear() === now.getFullYear();
        }).length,
      };
    },
    searchFields: ['lugar', 'entrenador.nombre', 'entrenador.apellido'],
  });

  return {
    list,
    canCreate: false, // Apoderado no puede crear entrenamientos
    canEdit: false,   // Solo puede ver entrenamientos de sus hijos
    canDelete: false,
    canViewAll: false, // Solo ve entrenamientos próximos
    visibleColumns: ['fecha_hora', 'lugar', 'duracion_minutos', 'entrenador.nombre'],
  };
}
