import { useList as useBaseList, UseListReturn, UseListConfig } from '../../pagos/hooks/useList';
import { EventosService, Evento } from '../services/eventosService';

export interface FiltrosEventos {
  busqueda: string;
  tipo_evento: string;
  estado: string; // 'proximos' | 'pasados' | 'todos'
  organizador: string;
}

export interface UseListEventosReturn extends UseListReturn<Evento> {
  filtros: FiltrosEventos;
}

export function useList(config?: Partial<UseListConfig<Evento>>): UseListEventosReturn {
  const baseConfig: UseListConfig<Evento> = {
    fetchItems: EventosService.getAll,
    calculateStats: (eventos) => {
      const now = new Date();
      return {
        total: eventos.length,
        proximos: eventos.filter(e => new Date(e.fecha_hora) > now).length,
        pasados: eventos.filter(e => new Date(e.fecha_hora) < now).length,
        partidos: eventos.filter(e => e.tipo_evento === 'Partido').length,
        torneos: eventos.filter(e => e.tipo_evento === 'Torneo').length,
        amistosos: eventos.filter(e => e.tipo_evento === 'Amistoso').length,
      };
    },
    searchFields: ['titulo', 'ubicacion', 'organizador.nombre', 'organizador.apellido'],
    ...config,
  };

  const baseList = useBaseList<Evento>(baseConfig);

  // Override filtros to use our custom type
  const filtros: FiltrosEventos = {
    ...baseList.filtros,
    busqueda: baseList.filtros.busqueda || '',
    tipo_evento: 'todos',
    estado: 'todos',
    organizador: 'todos',
  };

  return {
    ...baseList,
    filtros,
  };
}
