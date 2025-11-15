import { useList as useBaseList, UseListReturn, UseListConfig } from '../../pagos/hooks/useList';
import { EntrenamientosService, Entrenamiento } from '../services/entrenamientosService';

export interface FiltrosEntrenamientos {
  busqueda: string;
  estado: string; // 'proximos' | 'pasados' | 'en_curso' | 'todos'
  entrenador: string;
}

export interface UseListEntrenamientosReturn extends UseListReturn<Entrenamiento> {
  filtros: FiltrosEntrenamientos;
}

export function useList(config?: Partial<UseListConfig<Entrenamiento>>): UseListEntrenamientosReturn {
  const baseConfig: UseListConfig<Entrenamiento> = {
    fetchItems: EntrenamientosService.getAll,
    calculateStats: (entrenamientos) => {
      const now = new Date();
      return {
        total: entrenamientos.length,
        proximos: entrenamientos.filter(e => new Date(e.fecha_hora) > now).length,
        pasados: entrenamientos.filter(e => new Date(e.fecha_hora) < now).length,
        enCurso: entrenamientos.filter(e => {
          const fechaHora = new Date(e.fecha_hora);
          const finEntrenamiento = new Date(fechaHora.getTime() + (e.duracion_minutos * 60000));
          return fechaHora <= now && finEntrenamiento >= now;
        }).length,
      };
    },
    searchFields: ['lugar', 'descripcion', 'entrenador.nombre', 'entrenador.apellido'],
    ...config,
  };

  const baseList = useBaseList<Entrenamiento>(baseConfig);

  // Override filtros to use our custom type
  const filtros: FiltrosEntrenamientos = {
    ...baseList.filtros,
    busqueda: baseList.filtros.busqueda || '',
    estado: 'todos',
    entrenador: 'todos',
  };

  return {
    ...baseList,
    filtros,
  };
}
