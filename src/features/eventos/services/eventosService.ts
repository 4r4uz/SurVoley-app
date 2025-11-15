import { supabase } from '../../../core/supabase/supabaseClient';
import type { CreateEventoData, UpdateEventoData } from '../schema/eventosSchema';

export interface Evento {
  id_evento: string;
  titulo: string;
  tipo_evento: 'Partido' | 'Torneo' | 'Amistoso' | 'Entrenamiento';
  fecha_hora: string;
  ubicacion: string;
  id_organizador: string;
  created_at: string;
  updated_at: string;
  // Joined data
  organizador?: {
    id_organizador: string;
    nombre: string;
    apellido: string;
  };
}

export class EventosService {
  static async getAll(): Promise<Evento[]> {
    const { data: eventosData, error: eventosError } = await supabase
      .from('Evento')
      .select(`
        *,
        Usuarios!Evento_id_organizador_fkey(
          id_usuario,
          nombre,
          apellido
        )
      `)
      .order('fecha_hora', { ascending: false });

    if (eventosError) throw eventosError;

    // Transform the data to match our interface
    const eventos = (eventosData || []).map(evento => ({
      ...evento,
      organizador: evento.Usuarios ? {
        id_organizador: evento.Usuarios.id_usuario,
        nombre: evento.Usuarios.nombre || '',
        apellido: evento.Usuarios.apellido || '',
      } : undefined,
    }));

    return eventos;
  }

  static async getById(id: string): Promise<Evento | null> {
    const { data: eventoData, error: eventoError } = await supabase
      .from('Evento')
      .select(`
        *,
        Usuarios!Evento_id_organizador_fkey(
          id_usuario,
          nombre,
          apellido
        )
      `)
      .eq('id_evento', id)
      .single();

    if (eventoError) {
      if (eventoError.code === 'PGRST116') return null; // Not found
      throw eventoError;
    }

    return {
      ...eventoData,
      organizador: eventoData.Usuarios ? {
        id_organizador: eventoData.Usuarios.id_usuario,
        nombre: eventoData.Usuarios.nombre || '',
        apellido: eventoData.Usuarios.apellido || '',
      } : undefined,
    };
  }

  static async create(eventoData: CreateEventoData): Promise<Evento> {
    const { data, error } = await supabase
      .from('Evento')
      .insert({
        titulo: eventoData.titulo,
        tipo_evento: eventoData.tipo_evento,
        fecha_hora: eventoData.fecha_hora.toISOString(),
        ubicacion: eventoData.ubicacion,
        id_organizador: eventoData.id_organizador,
      })
      .select()
      .single();

    if (error) throw error;
    return this.getById(data.id_evento) as Promise<Evento>;
  }

  static async update(id: string, eventoData: UpdateEventoData): Promise<Evento> {
    const updateData: any = {};
    if (eventoData.titulo !== undefined) updateData.titulo = eventoData.titulo;
    if (eventoData.tipo_evento !== undefined) updateData.tipo_evento = eventoData.tipo_evento;
    if (eventoData.fecha_hora !== undefined) updateData.fecha_hora = eventoData.fecha_hora.toISOString();
    if (eventoData.ubicacion !== undefined) updateData.ubicacion = eventoData.ubicacion;
    if (eventoData.id_organizador !== undefined) updateData.id_organizador = eventoData.id_organizador;

    const { error } = await supabase
      .from('Evento')
      .update(updateData)
      .eq('id_evento', id);

    if (error) throw error;
    return this.getById(id) as Promise<Evento>;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('Evento')
      .delete()
      .eq('id_evento', id);

    if (error) throw error;
  }

  static async getByOrganizador(idOrganizador: string): Promise<Evento[]> {
    const { data: eventosData, error: eventosError } = await supabase
      .from('Evento')
      .select(`
        *,
        Usuarios!Evento_id_organizador_fkey(
          id_usuario,
          nombre,
          apellido
        )
      `)
      .eq('id_organizador', idOrganizador)
      .order('fecha_hora', { ascending: false });

    if (eventosError) throw eventosError;

    const eventos = (eventosData || []).map(evento => ({
      ...evento,
      organizador: evento.Usuarios ? {
        id_organizador: evento.Usuarios.id_usuario,
        nombre: evento.Usuarios.nombre || '',
        apellido: evento.Usuarios.apellido || '',
      } : undefined,
    }));

    return eventos;
  }

  static async getProximos(dias: number = 30): Promise<Evento[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + dias);

    const { data: eventosData, error: eventosError } = await supabase
      .from('Evento')
      .select(`
        *,
        Usuarios!Evento_id_organizador_fkey(
          id_usuario,
          nombre,
          apellido
        )
      `)
      .gte('fecha_hora', new Date().toISOString())
      .lte('fecha_hora', futureDate.toISOString())
      .order('fecha_hora', { ascending: true });

    if (eventosError) throw eventosError;

    const eventos = (eventosData || []).map(evento => ({
      ...evento,
      organizador: evento.Usuarios ? {
        id_organizador: evento.Usuarios.id_usuario,
        nombre: evento.Usuarios.nombre || '',
        apellido: evento.Usuarios.apellido || '',
      } : undefined,
    }));

    return eventos;
  }

  static async getPasados(): Promise<Evento[]> {
    const { data: eventosData, error: eventosError } = await supabase
      .from('Evento')
      .select(`
        *,
        Usuarios!Evento_id_organizador_fkey(
          id_usuario,
          nombre,
          apellido
        )
      `)
      .lt('fecha_hora', new Date().toISOString())
      .order('fecha_hora', { ascending: false });

    if (eventosError) throw eventosError;

    const eventos = (eventosData || []).map(evento => ({
      ...evento,
      organizador: evento.Usuarios ? {
        id_organizador: evento.Usuarios.id_usuario,
        nombre: evento.Usuarios.nombre || '',
        apellido: evento.Usuarios.apellido || '',
      } : undefined,
    }));

    return eventos;
  }

  static async getByTipo(tipo: string): Promise<Evento[]> {
    const { data: eventosData, error: eventosError } = await supabase
      .from('Evento')
      .select(`
        *,
        Usuarios!Evento_id_organizador_fkey(
          id_usuario,
          nombre,
          apellido
        )
      `)
      .eq('tipo_evento', tipo)
      .gte('fecha_hora', new Date().toISOString())
      .order('fecha_hora', { ascending: true });

    if (eventosError) throw eventosError;

    const eventos = (eventosData || []).map(evento => ({
      ...evento,
      organizador: evento.Usuarios ? {
        id_organizador: evento.Usuarios.id_usuario,
        nombre: evento.Usuarios.nombre || '',
        apellido: evento.Usuarios.apellido || '',
      } : undefined,
    }));

    return eventos;
  }
}
