import { useList, UseListEventosReturn } from '../useList';
import { EventosService, Evento } from '../../services/eventosService';

export interface UseJugadorEventosReturn {
  list: UseListEventosReturn;
  // Jugador can view upcoming events
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewAll: boolean;
  visibleColumns: string[];
}

export function useJugadorEventos(): UseJugadorEventosReturn {
  const list = useList({
    fetchItems: EventosService.getProximos, // Jugador ve eventos próximos
    calculateStats: (eventos) => {
      const now = new Date();
      return {
        total: eventos.length,
        estaSemana: eventos.filter(e => {
          const fecha = new Date(e.fecha_hora);
          const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          return fecha >= now && fecha <= weekFromNow;
        }).length,
        esteMes: eventos.filter(e => {
          const fecha = new Date(e.fecha_hora);
          return fecha.getMonth() === now.getMonth() && fecha.getFullYear() === now.getFullYear();
        }).length,
        partidos: eventos.filter(e => e.tipo_evento === 'Partido').length,
        torneos: eventos.filter(e => e.tipo_evento === 'Torneo').length,
      };
    },
    searchFields: ['titulo', 'ubicacion', 'organizador.nombre'],
  });

  return {
    list,
    canCreate: false, // Jugador no puede crear eventos
    canEdit: false,   // Solo puede ver los eventos
    canDelete: false,
    canViewAll: false, // Solo ve eventos próximos
    visibleColumns: ['titulo', 'tipo_evento', 'fecha_hora', 'ubicacion', 'organizador.nombre'],
  };
}
