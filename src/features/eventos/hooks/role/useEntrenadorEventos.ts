import { useList, UseListEventosReturn } from '../useList';
import { useForm, UseFormEventosReturn } from '../useForm';
import { EventosService, Evento } from '../../services/eventosService';

export interface UseEntrenadorEventosReturn {
  list: UseListEventosReturn;
  form: UseFormEventosReturn;
  // Entrenador can create events and view all events
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewAll: boolean;
  visibleColumns: string[];
  // Special functions for trainer
  crearEvento: (data: any) => Promise<void>;
  getMisEventos: () => Promise<Evento[]>;
}

export function useEntrenadorEventos(userId?: string): UseEntrenadorEventosReturn {
  const list = useList({
    fetchItems: EventosService.getAll, // Entrenador ve todos los eventos
    calculateStats: (eventos) => {
      const now = new Date();
      const misEventos = eventos.filter(e => e.id_organizador === userId);
      return {
        total: eventos.length,
        proximos: eventos.filter(e => new Date(e.fecha_hora) > now).length,
        pasados: eventos.filter(e => new Date(e.fecha_hora) < now).length,
        misEventos: misEventos.length,
        partidos: eventos.filter(e => e.tipo_evento === 'Partido').length,
        torneos: eventos.filter(e => e.tipo_evento === 'Torneo').length,
      };
    },
    searchFields: ['titulo', 'ubicacion'],
  });

  const form = useForm({
    initialData: {
      titulo: '',
      tipo_evento: 'Partido',
      fecha_hora: new Date(),
      ubicacion: '',
      id_organizador: userId || '', // Pre-llenar con el entrenador actual
    },
    onSuccess: () => {
      list.onRefresh();
    },
  });

  const crearEvento = async (data: any) => {
    if (!userId) throw new Error('User ID is required');
    await EventosService.create({
      ...data,
      id_organizador: userId, // Forzar que sea el entrenador actual
    });
    list.onRefresh();
  };

  const getMisEventos = async () => {
    if (!userId) return [];
    return await EventosService.getByOrganizador(userId);
  };

  return {
    list,
    form,
    canCreate: true, // Entrenador puede crear eventos
    canEdit: true,   // Puede editar sus propios eventos
    canDelete: false, // No puede eliminar eventos
    canViewAll: true, // Puede ver todos los eventos del club
    visibleColumns: ['titulo', 'tipo_evento', 'fecha_hora', 'ubicacion', 'organizador.nombre'],
    crearEvento,
    getMisEventos,
  };
}
