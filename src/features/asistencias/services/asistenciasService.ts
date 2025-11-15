import { supabase } from '../../../core/supabase/supabaseClient';
import type { CreateAsistenciaData, UpdateAsistenciaData } from '../schema/asistenciasSchema';

export interface Asistencia {
  id_asistencia: string;
  estado_asistencia: 'Presente' | 'Ausente' | 'Justificado' | 'Sin registro';
  id_jugador: string;
  id_entrenamiento?: string;
  id_evento?: string;
  fecha_asistencia: string;
  created_at: string;
  updated_at: string;
  // Joined data
  jugador?: {
    id_jugador: string;
    rut: string;
    nombre: string;
    apellido: string;
    categoria?: string;
  };
  entrenamiento?: {
    id_entrenamiento: string;
    fecha_hora: string;
    lugar: string;
    descripcion?: string;
  };
  evento?: {
    id_evento: string;
    titulo: string;
    tipo_evento: string;
    fecha_hora: string;
    ubicacion: string;
  };
}

export class AsistenciasService {
  static async getAll(): Promise<Asistencia[]> {
    const { data: asistenciasData, error: asistenciasError } = await supabase
      .from('Asistencia')
      .select(`
        *,
        Jugador!inner(
          id_jugador,
          rut,
          categoria
        ),
        Usuarios!Jugador_id_jugador_fkey(
          nombre,
          apellido
        ),
        Entrenamiento(
          id_entrenamiento,
          fecha_hora,
          lugar,
          descripcion
        ),
        Evento(
          id_evento,
          titulo,
          tipo_evento,
          fecha_hora,
          ubicacion
        )
      `)
      .order('fecha_asistencia', { ascending: false });

    if (asistenciasError) throw asistenciasError;

    // Transform the data to match our interface
    const asistencias = (asistenciasData || []).map(asistencia => ({
      ...asistencia,
      jugador: asistencia.Jugador ? {
        ...asistencia.Jugador,
        nombre: asistencia.Usuarios?.nombre || '',
        apellido: asistencia.Usuarios?.apellido || '',
      } : undefined,
    }));

    return asistencias;
  }

  static async getById(id: string): Promise<Asistencia | null> {
    const { data: asistenciaData, error: asistenciaError } = await supabase
      .from('Asistencia')
      .select(`
        *,
        Jugador!inner(
          id_jugador,
          rut,
          categoria
        ),
        Usuarios!Jugador_id_jugador_fkey(
          nombre,
          apellido
        ),
        Entrenamiento(
          id_entrenamiento,
          fecha_hora,
          lugar,
          descripcion
        ),
        Evento(
          id_evento,
          titulo,
          tipo_evento,
          fecha_hora,
          ubicacion
        )
      `)
      .eq('id_asistencia', id)
      .single();

    if (asistenciaError) {
      if (asistenciaError.code === 'PGRST116') return null; // Not found
      throw asistenciaError;
    }

    return {
      ...asistenciaData,
      jugador: asistenciaData.Jugador ? {
        ...asistenciaData.Jugador,
        nombre: asistenciaData.Usuarios?.nombre || '',
        apellido: asistenciaData.Usuarios?.apellido || '',
      } : undefined,
    };
  }

  static async create(asistenciaData: CreateAsistenciaData): Promise<Asistencia> {
    const { data, error } = await supabase
      .from('Asistencia')
      .insert({
        estado_asistencia: asistenciaData.estado_asistencia,
        id_jugador: asistenciaData.id_jugador,
        id_entrenamiento: asistenciaData.id_entrenamiento,
        id_evento: asistenciaData.id_evento,
        fecha_asistencia: asistenciaData.fecha_asistencia.toISOString().split('T')[0],
      })
      .select()
      .single();

    if (error) throw error;
    return this.getById(data.id_asistencia) as Promise<Asistencia>;
  }

  static async update(id: string, asistenciaData: UpdateAsistenciaData): Promise<Asistencia> {
    const updateData: any = {};
    if (asistenciaData.estado_asistencia !== undefined) updateData.estado_asistencia = asistenciaData.estado_asistencia;
    if (asistenciaData.id_jugador !== undefined) updateData.id_jugador = asistenciaData.id_jugador;
    if (asistenciaData.id_entrenamiento !== undefined) updateData.id_entrenamiento = asistenciaData.id_entrenamiento;
    if (asistenciaData.id_evento !== undefined) updateData.id_evento = asistenciaData.id_evento;
    if (asistenciaData.fecha_asistencia !== undefined) updateData.fecha_asistencia = asistenciaData.fecha_asistencia.toISOString().split('T')[0];

    const { error } = await supabase
      .from('Asistencia')
      .update(updateData)
      .eq('id_asistencia', id);

    if (error) throw error;
    return this.getById(id) as Promise<Asistencia>;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('Asistencia')
      .delete()
      .eq('id_asistencia', id);

    if (error) throw error;
  }

  static async getByJugador(idJugador: string): Promise<Asistencia[]> {
    const { data: asistenciasData, error: asistenciasError } = await supabase
      .from('Asistencia')
      .select(`
        *,
        Jugador!inner(
          id_jugador,
          rut,
          categoria
        ),
        Usuarios!Jugador_id_jugador_fkey(
          nombre,
          apellido
        ),
        Entrenamiento(
          id_entrenamiento,
          fecha_hora,
          lugar,
          descripcion
        ),
        Evento(
          id_evento,
          titulo,
          tipo_evento,
          fecha_hora,
          ubicacion
        )
      `)
      .eq('id_jugador', idJugador)
      .order('fecha_asistencia', { ascending: false });

    if (asistenciasError) throw asistenciasError;

    const asistencias = (asistenciasData || []).map(asistencia => ({
      ...asistencia,
      jugador: asistencia.Jugador ? {
        ...asistencia.Jugador,
        nombre: asistencia.Usuarios?.nombre || '',
        apellido: asistencia.Usuarios?.apellido || '',
      } : undefined,
    }));

    return asistencias;
  }

  static async getByEntrenamiento(idEntrenamiento: string): Promise<Asistencia[]> {
    const { data: asistenciasData, error: asistenciasError } = await supabase
      .from('Asistencia')
      .select(`
        *,
        Jugador!inner(
          id_jugador,
          rut,
          categoria
        ),
        Usuarios!Jugador_id_jugador_fkey(
          nombre,
          apellido
        )
      `)
      .eq('id_entrenamiento', idEntrenamiento)
      .order('fecha_asistencia', { ascending: false });

    if (asistenciasError) throw asistenciasError;

    const asistencias = (asistenciasData || []).map(asistencia => ({
      ...asistencia,
      jugador: asistencia.Jugador ? {
        ...asistencia.Jugador,
        nombre: asistencia.Usuarios?.nombre || '',
        apellido: asistencia.Usuarios?.apellido || '',
      } : undefined,
    }));

    return asistencias;
  }

  static async getByEvento(idEvento: string): Promise<Asistencia[]> {
    const { data: asistenciasData, error: asistenciasError } = await supabase
      .from('Asistencia')
      .select(`
        *,
        Jugador!inner(
          id_jugador,
          rut,
          categoria
        ),
        Usuarios!Jugador_id_jugador_fkey(
          nombre,
          apellido
        )
      `)
      .eq('id_evento', idEvento)
      .order('fecha_asistencia', { ascending: false });

    if (asistenciasError) throw asistenciasError;

    const asistencias = (asistenciasData || []).map(asistencia => ({
      ...asistencia,
      jugador: asistencia.Jugador ? {
        ...asistencia.Jugador,
        nombre: asistencia.Usuarios?.nombre || '',
        apellido: asistencia.Usuarios?.apellido || '',
      } : undefined,
    }));

    return asistencias;
  }
}
