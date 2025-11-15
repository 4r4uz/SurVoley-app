import { supabase } from '../../../core/supabase/supabaseClient';
import type { CreateEntrenamientoData, UpdateEntrenamientoData } from '../schema/entrenamientosSchema';

export interface Entrenamiento {
  id_entrenamiento: string;
  fecha_hora: string;
  lugar: string;
  id_entrenador: string;
  duracion_minutos: number;
  descripcion?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  entrenador?: {
    id_entrenador: string;
    nombre: string;
    apellido: string;
  };
}

export class EntrenamientosService {
  static async getAll(): Promise<Entrenamiento[]> {
    const { data: entrenamientosData, error: entrenamientosError } = await supabase
      .from('Entrenamiento')
      .select(`
        *,
        Usuarios!Entrenamiento_id_entrenador_fkey(
          id_usuario,
          nombre,
          apellido
        )
      `)
      .order('fecha_hora', { ascending: false });

    if (entrenamientosError) throw entrenamientosError;

    // Transform the data to match our interface
    const entrenamientos = (entrenamientosData || []).map(entrenamiento => ({
      ...entrenamiento,
      entrenador: entrenamiento.Usuarios ? {
        id_entrenador: entrenamiento.Usuarios.id_usuario,
        nombre: entrenamiento.Usuarios.nombre || '',
        apellido: entrenamiento.Usuarios.apellido || '',
      } : undefined,
    }));

    return entrenamientos;
  }

  static async getById(id: string): Promise<Entrenamiento | null> {
    const { data: entrenamientoData, error: entrenamientoError } = await supabase
      .from('Entrenamiento')
      .select(`
        *,
        Usuarios!Entrenamiento_id_entrenador_fkey(
          id_usuario,
          nombre,
          apellido
        )
      `)
      .eq('id_entrenamiento', id)
      .single();

    if (entrenamientoError) {
      if (entrenamientoError.code === 'PGRST116') return null; // Not found
      throw entrenamientoError;
    }

    return {
      ...entrenamientoData,
      entrenador: entrenamientoData.Usuarios ? {
        id_entrenador: entrenamientoData.Usuarios.id_usuario,
        nombre: entrenamientoData.Usuarios.nombre || '',
        apellido: entrenamientoData.Usuarios.apellido || '',
      } : undefined,
    };
  }

  static async create(entrenamientoData: CreateEntrenamientoData): Promise<Entrenamiento> {
    const { data, error } = await supabase
      .from('Entrenamiento')
      .insert({
        fecha_hora: entrenamientoData.fecha_hora.toISOString(),
        lugar: entrenamientoData.lugar,
        id_entrenador: entrenamientoData.id_entrenador,
        duracion_minutos: entrenamientoData.duracion_minutos,
        descripcion: entrenamientoData.descripcion,
      })
      .select()
      .single();

    if (error) throw error;
    return this.getById(data.id_entrenamiento) as Promise<Entrenamiento>;
  }

  static async update(id: string, entrenamientoData: UpdateEntrenamientoData): Promise<Entrenamiento> {
    const updateData: any = {};
    if (entrenamientoData.fecha_hora !== undefined) updateData.fecha_hora = entrenamientoData.fecha_hora.toISOString();
    if (entrenamientoData.lugar !== undefined) updateData.lugar = entrenamientoData.lugar;
    if (entrenamientoData.id_entrenador !== undefined) updateData.id_entrenador = entrenamientoData.id_entrenador;
    if (entrenamientoData.duracion_minutos !== undefined) updateData.duracion_minutos = entrenamientoData.duracion_minutos;
    if (entrenamientoData.descripcion !== undefined) updateData.descripcion = entrenamientoData.descripcion;

    const { error } = await supabase
      .from('Entrenamiento')
      .update(updateData)
      .eq('id_entrenamiento', id);

    if (error) throw error;
    return this.getById(id) as Promise<Entrenamiento>;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('Entrenamiento')
      .delete()
      .eq('id_entrenamiento', id);

    if (error) throw error;
  }

  static async getByEntrenador(idEntrenador: string): Promise<Entrenamiento[]> {
    const { data: entrenamientosData, error: entrenamientosError } = await supabase
      .from('Entrenamiento')
      .select(`
        *,
        Usuarios!Entrenamiento_id_entrenador_fkey(
          id_usuario,
          nombre,
          apellido
        )
      `)
      .eq('id_entrenador', idEntrenador)
      .order('fecha_hora', { ascending: false });

    if (entrenamientosError) throw entrenamientosError;

    const entrenamientos = (entrenamientosData || []).map(entrenamiento => ({
      ...entrenamiento,
      entrenador: entrenamiento.Usuarios ? {
        id_entrenador: entrenamiento.Usuarios.id_usuario,
        nombre: entrenamiento.Usuarios.nombre || '',
        apellido: entrenamiento.Usuarios.apellido || '',
      } : undefined,
    }));

    return entrenamientos;
  }

  static async getProximos(dias: number = 7): Promise<Entrenamiento[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + dias);

    const { data: entrenamientosData, error: entrenamientosError } = await supabase
      .from('Entrenamiento')
      .select(`
        *,
        Usuarios!Entrenamiento_id_entrenador_fkey(
          id_usuario,
          nombre,
          apellido
        )
      `)
      .gte('fecha_hora', new Date().toISOString())
      .lte('fecha_hora', futureDate.toISOString())
      .order('fecha_hora', { ascending: true });

    if (entrenamientosError) throw entrenamientosError;

    const entrenamientos = (entrenamientosData || []).map(entrenamiento => ({
      ...entrenamiento,
      entrenador: entrenamiento.Usuarios ? {
        id_entrenador: entrenamiento.Usuarios.id_usuario,
        nombre: entrenamiento.Usuarios.nombre || '',
        apellido: entrenamiento.Usuarios.apellido || '',
      } : undefined,
    }));

    return entrenamientos;
  }

  static async getPasados(): Promise<Entrenamiento[]> {
    const { data: entrenamientosData, error: entrenamientosError } = await supabase
      .from('Entrenamiento')
      .select(`
        *,
        Usuarios!Entrenamiento_id_entrenador_fkey(
          id_usuario,
          nombre,
          apellido
        )
      `)
      .lt('fecha_hora', new Date().toISOString())
      .order('fecha_hora', { ascending: false });

    if (entrenamientosError) throw entrenamientosError;

    const entrenamientos = (entrenamientosData || []).map(entrenamiento => ({
      ...entrenamiento,
      entrenador: entrenamiento.Usuarios ? {
        id_entrenador: entrenamiento.Usuarios.id_usuario,
        nombre: entrenamiento.Usuarios.nombre || '',
        apellido: entrenamiento.Usuarios.apellido || '',
      } : undefined,
    }));

    return entrenamientos;
  }

  static async getEnCurso(): Promise<Entrenamiento[]> {
    const now = new Date();
    const nowStr = now.toISOString();

    // Get trainings that are currently in progress
    const { data: entrenamientosData, error: entrenamientosError } = await supabase
      .from('Entrenamiento')
      .select(`
        *,
        Usuarios!Entrenamiento_id_entrenador_fkey(
          id_usuario,
          nombre,
          apellido
        )
      `)
      .lte('fecha_hora', nowStr)
      .order('fecha_hora', { ascending: false });

    if (entrenamientosError) throw entrenamientosError;

    // Filter trainings that are currently in progress
    const entrenamientosEnCurso = (entrenamientosData || [])
      .map(entrenamiento => ({
        ...entrenamiento,
        entrenador: entrenamiento.Usuarios ? {
          id_entrenador: entrenamiento.Usuarios.id_usuario,
          nombre: entrenamiento.Usuarios.nombre || '',
          apellido: entrenamiento.Usuarios.apellido || '',
        } : undefined,
      }))
      .filter(entrenamiento => {
        const fechaHora = new Date(entrenamiento.fecha_hora);
        const finEntrenamiento = new Date(fechaHora.getTime() + (entrenamiento.duracion_minutos * 60000));
        return fechaHora <= now && finEntrenamiento >= now;
      });

    return entrenamientosEnCurso;
  }
}
