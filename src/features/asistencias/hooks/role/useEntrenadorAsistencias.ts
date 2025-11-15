import { useList, UseListAsistenciasReturn } from '../useList';
import { useForm, UseFormAsistenciasReturn } from '../useForm';
import { AsistenciasService, Asistencia } from '../../services/asistenciasService';

export interface UseEntrenadorAsistenciasReturn {
  list: UseListAsistenciasReturn;
  form: UseFormAsistenciasReturn;
  // Entrenador puede crear asistencia durante entrenamientos/eventos en curso
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewAll: boolean;
  visibleColumns: string[];
  // Funciones específicas del entrenador
  tomarAsistencia: (idEntrenamiento: string, asistencias: Array<{id_jugador: string, estado: string}>) => Promise<void>;
}

export function useEntrenadorAsistencias(userId?: string): UseEntrenadorAsistenciasReturn {
  const list = useList({
    fetchItems: AsistenciasService.getAll, // Entrenador ve todas las asistencias
    calculateStats: (asistencias) => ({
      total: asistencias.length,
      presentes: asistencias.filter(a => a.estado_asistencia === 'Presente').length,
      ausentes: asistencias.filter(a => a.estado_asistencia === 'Ausente').length,
      justificados: asistencias.filter(a => a.estado_asistencia === 'Justificado').length,
      sinRegistro: asistencias.filter(a => a.estado_asistencia === 'Sin registro').length,
    }),
    searchFields: ['jugador.nombre', 'jugador.apellido'],
  });

  const form = useForm({
    onSuccess: () => {
      list.onRefresh();
    },
  });

  const tomarAsistencia = async (idEntrenamiento: string, asistencias: Array<{id_jugador: string, estado: string}>) => {
    // Crear múltiples registros de asistencia para un entrenamiento
    const asistenciaPromises = asistencias.map(asistencia =>
      AsistenciasService.create({
        estado_asistencia: asistencia.estado as any,
        id_jugador: asistencia.id_jugador,
        id_entrenamiento: idEntrenamiento,
        fecha_asistencia: new Date(),
      })
    );

    await Promise.all(asistenciaPromises);
    list.onRefresh();
  };

  return {
    list,
    form,
    canCreate: true, // Puede tomar asistencia durante eventos/entrenamientos
    canEdit: true,   // Puede corregir asistencias
    canDelete: false, // No puede eliminar asistencias
    canViewAll: true, // Ve todas las asistencias
    visibleColumns: ['jugador.nombre', 'jugador.apellido', 'estado_asistencia', 'fecha_asistencia', 'entrenamiento.lugar', 'evento.titulo'],
    tomarAsistencia,
  };
}
