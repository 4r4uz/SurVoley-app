import { useList, UseListEventosReturn } from '../useList';
import { useForm, UseFormEventosReturn } from '../useForm';
import { EventosService, Evento } from '../../services/eventosService';

export interface UseAdminEventosReturn {
  list: UseListEventosReturn;
  form: UseFormEventosReturn;
  // Admin has full permissions
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewAll: boolean;
  visibleColumns: string[];
}

export function useAdminEventos(): UseAdminEventosReturn {
  const list = useList({
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
  });

  const form = useForm({
    onSuccess: () => {
      list.onRefresh();
    },
  });

  return {
    list,
    form,
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canViewAll: true,
    visibleColumns: ['all'], // Show all columns
  };
}
