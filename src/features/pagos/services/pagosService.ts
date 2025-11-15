import { supabase } from '../../../core/supabase/supabaseClient';
import type { CreatePagoData, UpdatePagoData } from '../schema/pagosSchema';

export interface Pago {
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

export class PagosService {
  static async getAll(): Promise<Pago[]> {
    const { data: pagosData, error: pagosError } = await supabase
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

    if (pagosError) throw pagosError;

    // Transform the data to match our interface
    const pagos = (pagosData || []).map(pago => ({
      ...pago,
      jugador: pago.Jugador ? {
        ...pago.Jugador,
        nombre: pago.Usuarios?.nombre || '',
        apellido: pago.Usuarios?.apellido || '',
      } : undefined,
    }));

    return pagos;
  }

  static async getById(id: string): Promise<Pago | null> {
    const { data: pagoData, error: pagoError } = await supabase
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

    if (pagoError) {
      if (pagoError.code === 'PGRST116') return null; // Not found
      throw pagoError;
    }

    return {
      ...pagoData,
      jugador: pagoData.Jugador ? {
        ...pagoData.Jugador,
        nombre: pagoData.Usuarios?.nombre || '',
        apellido: pagoData.Usuarios?.apellido || '',
      } : undefined,
    };
  }

  static async create(pagoData: CreatePagoData): Promise<Pago> {
    const { data, error } = await supabase
      .from('Mensualidad')
      .insert({
        monto: pagoData.monto,
        fecha_pago: pagoData.fecha_pago?.toISOString(),
        metodo_pago: pagoData.metodo_pago,
        estado_pago: pagoData.estado_pago,
        id_jugador: pagoData.id_jugador,
        fecha_vencimiento: pagoData.fecha_vencimiento.toISOString().split('T')[0],
        mes_referencia: pagoData.mes_referencia,
        anio_referencia: pagoData.anio_referencia,
      })
      .select()
      .single();

    if (error) throw error;
    return this.getById(data.id_mensualidad) as Promise<Pago>;
  }

  static async update(id: string, pagoData: UpdatePagoData): Promise<Pago> {
    const updateData: any = {};
    if (pagoData.monto !== undefined) updateData.monto = pagoData.monto;
    if (pagoData.fecha_pago !== undefined) updateData.fecha_pago = pagoData.fecha_pago?.toISOString();
    if (pagoData.metodo_pago !== undefined) updateData.metodo_pago = pagoData.metodo_pago;
    if (pagoData.estado_pago !== undefined) updateData.estado_pago = pagoData.estado_pago;
    if (pagoData.id_jugador !== undefined) updateData.id_jugador = pagoData.id_jugador;
    if (pagoData.fecha_vencimiento !== undefined) updateData.fecha_vencimiento = pagoData.fecha_vencimiento.toISOString().split('T')[0];
    if (pagoData.mes_referencia !== undefined) updateData.mes_referencia = pagoData.mes_referencia;
    if (pagoData.anio_referencia !== undefined) updateData.anio_referencia = pagoData.anio_referencia;

    const { error } = await supabase
      .from('Mensualidad')
      .update(updateData)
      .eq('id_mensualidad', id);

    if (error) throw error;
    return this.getById(id) as Promise<Pago>;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('Mensualidad')
      .delete()
      .eq('id_mensualidad', id);

    if (error) throw error;
  }

  static async getByJugador(idJugador: string): Promise<Pago[]> {
    const { data: pagosData, error: pagosError } = await supabase
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

    if (pagosError) throw pagosError;

    const pagos = (pagosData || []).map(pago => ({
      ...pago,
      jugador: pago.Jugador ? {
        ...pago.Jugador,
        nombre: pago.Usuarios?.nombre || '',
        apellido: pago.Usuarios?.apellido || '',
      } : undefined,
    }));

    return pagos;
  }

  static async getPendientes(): Promise<Pago[]> {
    const { data: pagosData, error: pagosError } = await supabase
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

    if (pagosError) throw pagosError;

    const pagos = (pagosData || []).map(pago => ({
      ...pago,
      jugador: pago.Jugador ? {
        ...pago.Jugador,
        nombre: pago.Usuarios?.nombre || '',
        apellido: pago.Usuarios?.apellido || '',
      } : undefined,
    }));

    return pagos;
  }
}
