import { useList as useBaseList, UseListReturn, UseListConfig } from '../../pagos/hooks/useList';
import { AsistenciasService, Asistencia } from '../services/asistenciasService';

export interface FiltrosAsistencias {
  busqueda: string;
  estado_asistencia: string;
  tipo_actividad: string; // 'entrenamiento' | 'evento' | 'todos'
}

export interface UseListAsistenciasReturn extends UseListReturn<Asistencia> {
  filtros: FiltrosAsistencias;
}

export function useList(config?: Partial<UseListConfig<Asistencia>>): UseListAsistenciasReturn {
  const baseConfig: UseListConfig<Asistencia> = {
    fetchItems: AsistenciasService.getAll,
    calculateStats: (asistencias) => ({
      total: asistencias.length,
      presentes: asistencias.filter(a => a.estado_asistencia === 'Presente').length,
      ausentes: asistencias.filter(a => a.estado_asistencia === 'Ausente').length,
      justificados: asistencias.filter(a => a.estado_asistencia === 'Justificado').length,
      sinRegistro: asistencias.filter(a => a.estado_asistencia === 'Sin registro').length,
    }),
    searchFields: ['jugador.nombre', 'jugador.apellido'],
    ...config,
  };

  const baseList = useBaseList<Asistencia>(baseConfig);

  // Override filtros to use our custom type
  const filtros: FiltrosAsistencias = {
    ...baseList.filtros,
    busqueda: baseList.filtros.busqueda || '',
    estado_asistencia: 'todos',
    tipo_actividad: 'todos',
  };

  return {
    ...baseList,
    filtros,
  };
}
