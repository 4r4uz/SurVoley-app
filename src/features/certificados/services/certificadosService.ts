import { supabase } from '../../../core/supabase/supabaseClient';
import type { CreateCertificadoData, UpdateCertificadoData } from '../schema/certificadosSchema';

export interface Certificado {
  id_certificado: string;
  tipo_certificado: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  url?: string;
  id_jugador: string;
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

export class CertificadosService {
  static async getAll(): Promise<Certificado[]> {
    const { data: certificadosData, error: certificadosError } = await supabase
      .from('Certificado')
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
      .order('fecha_emision', { ascending: false });

    if (certificadosError) throw certificadosError;

    // Transform the data to match our interface
    const certificados = (certificadosData || []).map(certificado => ({
      ...certificado,
      jugador: certificado.Jugador ? {
        ...certificado.Jugador,
        nombre: certificado.Usuarios?.nombre || '',
        apellido: certificado.Usuarios?.apellido || '',
      } : undefined,
    }));

    return certificados;
  }

  static async getById(id: string): Promise<Certificado | null> {
    const { data: certificadoData, error: certificadoError } = await supabase
      .from('Certificado')
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
      .eq('id_certificado', id)
      .single();

    if (certificadoError) {
      if (certificadoError.code === 'PGRST116') return null; // Not found
      throw certificadoError;
    }

    return {
      ...certificadoData,
      jugador: certificadoData.Jugador ? {
        ...certificadoData.Jugador,
        nombre: certificadoData.Usuarios?.nombre || '',
        apellido: certificadoData.Usuarios?.apellido || '',
      } : undefined,
    };
  }

  static async create(certificadoData: CreateCertificadoData): Promise<Certificado> {
    const { data, error } = await supabase
      .from('Certificado')
      .insert({
        tipo_certificado: certificadoData.tipo_certificado,
        fecha_emision: certificadoData.fecha_emision.toISOString().split('T')[0],
        fecha_vencimiento: certificadoData.fecha_vencimiento.toISOString().split('T')[0],
        url: certificadoData.url,
        id_jugador: certificadoData.id_jugador,
      })
      .select()
      .single();

    if (error) throw error;
    return this.getById(data.id_certificado) as Promise<Certificado>;
  }

  static async update(id: string, certificadoData: UpdateCertificadoData): Promise<Certificado> {
    const updateData: any = {};
    if (certificadoData.tipo_certificado !== undefined) updateData.tipo_certificado = certificadoData.tipo_certificado;
    if (certificadoData.fecha_emision !== undefined) updateData.fecha_emision = certificadoData.fecha_emision.toISOString().split('T')[0];
    if (certificadoData.fecha_vencimiento !== undefined) updateData.fecha_vencimiento = certificadoData.fecha_vencimiento.toISOString().split('T')[0];
    if (certificadoData.url !== undefined) updateData.url = certificadoData.url;
    if (certificadoData.id_jugador !== undefined) updateData.id_jugador = certificadoData.id_jugador;

    const { error } = await supabase
      .from('Certificado')
      .update(updateData)
      .eq('id_certificado', id);

    if (error) throw error;
    return this.getById(id) as Promise<Certificado>;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('Certificado')
      .delete()
      .eq('id_certificado', id);

    if (error) throw error;
  }

  static async getByJugador(idJugador: string): Promise<Certificado[]> {
    const { data: certificadosData, error: certificadosError } = await supabase
      .from('Certificado')
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
      .order('fecha_emision', { ascending: false });

    if (certificadosError) throw certificadosError;

    const certificados = (certificadosData || []).map(certificado => ({
      ...certificado,
      jugador: certificado.Jugador ? {
        ...certificado.Jugador,
        nombre: certificado.Usuarios?.nombre || '',
        apellido: certificado.Usuarios?.apellido || '',
      } : undefined,
    }));

    return certificados;
  }

  static async getVencidos(): Promise<Certificado[]> {
    const today = new Date().toISOString().split('T')[0];
    const { data: certificadosData, error: certificadosError } = await supabase
      .from('Certificado')
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
      .lt('fecha_vencimiento', today)
      .order('fecha_vencimiento', { ascending: true });

    if (certificadosError) throw certificadosError;

    const certificados = (certificadosData || []).map(certificado => ({
      ...certificado,
      jugador: certificado.Jugador ? {
        ...certificado.Jugador,
        nombre: certificado.Usuarios?.nombre || '',
        apellido: certificado.Usuarios?.apellido || '',
      } : undefined,
    }));

    return certificados;
  }

  static async getPorVencer(dias: number = 30): Promise<Certificado[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + dias);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    const { data: certificadosData, error: certificadosError } = await supabase
      .from('Certificado')
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
      .gte('fecha_vencimiento', new Date().toISOString().split('T')[0])
      .lte('fecha_vencimiento', futureDateStr)
      .order('fecha_vencimiento', { ascending: true });

    if (certificadosError) throw certificadosError;

    const certificados = (certificadosData || []).map(certificado => ({
      ...certificado,
      jugador: certificado.Jugador ? {
        ...certificado.Jugador,
        nombre: certificado.Usuarios?.nombre || '',
        apellido: certificado.Usuarios?.apellido || '',
      } : undefined,
    }));

    return certificados;
  }

  static async generarCertificado(tipo: string, idJugador: string): Promise<Certificado> {
    // Lógica para generar diferentes tipos de certificados
    const fechaEmision = new Date();
    let fechaVencimiento: Date;

    // Diferentes vencimientos según el tipo de certificado
    switch (tipo) {
      case 'Asistencia':
        fechaVencimiento = new Date(fechaEmision);
        fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + 1); // 1 año
        break;
      case 'Integración':
        fechaVencimiento = new Date(fechaEmision);
        fechaVencimiento.setMonth(fechaVencimiento.getMonth() + 6); // 6 meses
        break;
      case 'Participación':
        fechaVencimiento = new Date(fechaEmision);
        fechaVencimiento.setMonth(fechaVencimiento.getMonth() + 12); // 1 año
        break;
      default:
        fechaVencimiento = new Date(fechaEmision);
        fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + 1); // 1 año por defecto
    }

    return this.create({
      tipo_certificado: tipo,
      fecha_emision: fechaEmision,
      fecha_vencimiento: fechaVencimiento,
      id_jugador: idJugador,
    });
  }
}
