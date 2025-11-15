import { supabase } from '../../../core/supabase/supabaseClient';
import type { CreatePagoData, UpdatePagoData } from '../schema/mensualidadesSchema';

export interface Mensualidad {
  id_mensualidad: string;
  monto: number;
  fecha_pago?: string;
  metodo_pago?: string;
  estado_pago: 'Pendiente' | 'Pagado' | 'Cancelado';
  id_jugador: string;
  fecha_vencimiento: string;
  mes_referencia: string;
  anio_referencia: number;
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
}

export class MensualidadesService {
  static async getAll(): Promise<Mensualidad[]> {
    const { data: mensualidadesData, error: mensualidadesError } = await supabase
      .from('Mensualidad')
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
      .order('fecha_vencimiento', { ascending: false });

    if (mensualidadesError) throw mensualidadesError;

    // Transform the data to match our interface
    const mensualidades = (mensualidadesData || []).map(mensualidad => ({
      ...mensualidad,
      jugador: mensualidad.Jugador ? {
        ...mensualidad.Jugador,
        nombre: mensualidad.Usuarios?.nombre || '',
        apellido: mensualidad.Usuarios?.apellido || '',
      } : undefined,
    }));

    return mensualidades;
  }

  static async getById(id: string): Promise<Mensualidad | null> {
    const { data: mensualidadData, error: mensualidadError } = await supabase
      .from('Mensualidad')
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
      .eq('id_mensualidad', id)
      .single();

    if (mensualidadError) {
      if (mensualidadError.code === 'PGRST116') return null; // Not found
      throw mensualidadError;
    }

    return {
      ...mensualidadData,
      jugador: mensualidadData.Jugador ? {
        ...mensualidadData.Jugador,
        nombre: mensualidadData.Usuarios?.nombre || '',
        apellido: mensualidadData.Usuarios?.apellido || '',
      } : undefined,
    };
  }

  static async create(mensualidadData: CreatePagoData): Promise<Mensualidad> {
    const { data, error } = await supabase
      .from('Mensualidad')
      .insert({
        monto: mensualidadData.monto,
        fecha_pago: mensualidadData.fecha_pago?.toISOString(),
        metodo_pago: mensualidadData.metodo_pago,
        estado_pago: mensualidadData.estado_pago,
        id_jugador: mensualidadData.id_jugador,
        fecha_vencimiento: mensualidadData.fecha_vencimiento.toISOString().split('T')[0],
        mes_referencia: mensualidadData.mes_referencia,
        anio_referencia: mensualidadData.anio_referencia,
      })
      .select()
      .single();

    if (error) throw error;
    return this.getById(data.id_mensualidad) as Promise<Mensualidad>;
  }

  static async update(id: string, mensualidadData: UpdatePagoData): Promise<Mensualidad> {
    const updateData: any = {};
    if (mensualidadData.monto !== undefined) updateData.monto = mensualidadData.monto;
    if (mensualidadData.fecha_pago !== undefined) updateData.fecha_pago = mensualidadData.fecha_pago?.toISOString();
    if (mensualidadData.metodo_pago !== undefined) updateData.metodo_pago = mensualidadData.metodo_pago;
    if (mensualidadData.estado_pago !== undefined) updateData.estado_pago = mensualidadData.estado_pago;
    if (mensualidadData.id_jugador !== undefined) updateData.id_jugador = mensualidadData.id_jugador;
    if (mensualidadData.fecha_vencimiento !== undefined) updateData.fecha_vencimiento = mensualidadData.fecha_vencimiento.toISOString().split('T')[0];
    if (mensualidadData.mes_referencia !== undefined) updateData.mes_referencia = mensualidadData.mes_referencia;
    if (mensualidadData.anio_referencia !== undefined) updateData.anio_referencia = mensualidadData.anio_referencia;

    const { error } = await supabase
      .from('Mensualidad')
      .update(updateData)
      .eq('id_mensualidad', id);

    if (error) throw error;
    return this.getById(id) as Promise<Mensualidad>;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('Mensualidad')
      .delete()
      .eq('id_mensualidad', id);

    if (error) throw error;
  }

  static async getByJugador(idJugador: string): Promise<Mensualidad[]> {
    const { data: mensualidadesData, error: mensualidadesError } = await supabase
      .from('Mensualidad')
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
      .eq('id_jugador', idJugador)
      .order('fecha_vencimiento', { ascending: false });

    if (mensualidadesError) throw mensualidadesError;

    const mensualidades = (mensualidadesData || []).map(mensualidad => ({
      ...mensualidad,
      jugador: mensualidad.Jugador ? {
        ...mensualidad.Jugador,
        nombre: mensualidad.Usuarios?.nombre || '',
        apellido: mensualidad.Usuarios?.apellido || '',
      } : undefined,
    }));

    return mensualidades;
  }

  static async getPendientes(): Promise<Mensualidad[]> {
    const { data: mensualidadesData, error: mensualidadesError } = await supabase
      .from('Mensualidad')
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
      .eq('estado_pago', 'Pendiente')
      .order('fecha_vencimiento', { ascending: true });

    if (mensualidadesError) throw mensualidadesError;

    const mensualidades = (mensualidadesData || []).map(mensualidad => ({
      ...mensualidad,
      jugador: mensualidad.Jugador ? {
        ...mensualidad.Jugador,
        nombre: mensualidad.Usuarios?.nombre || '',
        apellido: mensualidad.Usuarios?.apellido || '',
      } : undefined,
    }));

    return mensualidades;
  }

  static async getVencidas(): Promise<Mensualidad[]> {
    const today = new Date().toISOString().split('T')[0];
    const { data: mensualidadesData, error: mensualidadesError } = await supabase
      .from('Mensualidad')
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
      .eq('estado_pago', 'Pendiente')
      .lt('fecha_vencimiento', today)
      .order('fecha_vencimiento', { ascending: true });

    if (mensualidadesError) throw mensualidadesError;

    const mensualidades = (mensualidadesData || []).map(mensualidad => ({
      ...mensualidad,
      jugador: mensualidad.Jugador ? {
        ...mensualidad.Jugador,
        nombre: mensualidad.Usuarios?.nombre || '',
        apellido: mensualidad.Usuarios?.apellido || '',
      } : undefined,
    }));

    return mensualidades;
  }
}
