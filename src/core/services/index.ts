import { supabase } from '../supabase/supabaseClient';
import type {
  // Asistencias
  Asistencia, CreateAsistenciaData, UpdateAsistenciaData,
  // Mensualidades
  Mensualidad, UsuarioMensualidad,
  // Usuarios
  Usuario, CreateUsuarioData, UpdateUsuarioData,
  // Entrenamientos
  Entrenamiento, CreateEntrenamientoData, UpdateEntrenamientoData,
  // Eventos
  Evento, CreateEventoData, UpdateEventoData,
  // Pagos
  Pago, CreatePagoData, UpdatePagoData,
  // Reportes
  Reporte, CreateReporteData, UpdateReporteData
} from '../types';

// ========== ASISTENCIAS SERVICE ==========
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
      if (asistenciaError.code === 'PGRST116') return null;
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
}



// ========== MENSUALIDADES SERVICE ==========
export class MensualidadesService {
  static async getAll(): Promise<Mensualidad[]> {
    const { data, error } = await supabase
      .from('Mensualidad')
      .select('*')
      .order('fecha_vencimiento', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getByJugador(jugadorId: string): Promise<Mensualidad[]> {
    const { data, error } = await supabase
      .from('Mensualidad')
      .select('*')
      .eq('id_jugador', jugadorId)
      .order('anio_referencia', { ascending: false })
      .order('mes_referencia', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async create(mensualidad: Omit<Mensualidad, 'id_mensualidad' | 'created_at'>): Promise<Mensualidad> {
    const { data, error } = await supabase
      .from('Mensualidad')
      .insert([mensualidad])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(id: string, updates: Partial<Mensualidad>): Promise<Mensualidad> {
    const { data, error } = await supabase
      .from('Mensualidad')
      .update(updates)
      .eq('id_mensualidad', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('Mensualidad')
      .delete()
      .eq('id_mensualidad', id);

    if (error) throw error;
  }
}

// ========== USUARIOS SERVICE ==========
export class UserService {
  static async getAllUsers(): Promise<Usuario[]> {
    const { data, error } = await supabase
      .from('Usuarios')
      .select(`
        *,
        Jugador(id_jugador, rut, categoria, fecha_nacimiento),
        Apoderado(id_apoderado, id_jugador_tutorado),
        Entrenador(id_entrenador, especialidad)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getUserById(id: string): Promise<Usuario | null> {
    const { data, error } = await supabase
      .from('Usuarios')
      .select(`
        *,
        Jugador(id_jugador, rut, categoria, fecha_nacimiento),
        Apoderado(id_apoderado, id_jugador_tutorado),
        Entrenador(id_entrenador, especialidad)
      `)
      .eq('id_usuario', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  static async createUser(userData: CreateUsuarioData): Promise<Usuario> {
    const { data, error } = await supabase
      .from('Usuarios')
      .insert([userData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateUser(id: string, userData: UpdateUsuarioData): Promise<Usuario> {
    const { data, error } = await supabase
      .from('Usuarios')
      .update(userData)
      .eq('id_usuario', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteUser(id: string): Promise<void> {
    const { error } = await supabase
      .from('Usuarios')
      .delete()
      .eq('id_usuario', id);

    if (error) throw error;
  }
}

// ========== FUNCIONES DE MENSUALIDADES AUTOMÁTICAS ==========
const MONTO_FIJO = 20000;

export const generarMensualidadesAutomaticas = async (): Promise<void> => {
  try {
    const hoy = new Date();
    const mesActual = (hoy.getMonth() + 1).toString().padStart(2, '0');
    const anioActual = hoy.getFullYear();

    // Verificar si ya se generaron mensualidades para este mes
    // usando una verificación simple sin tabla de configuración
    const { data: mensualidadesExistentes, error: errorVerif } = await supabase
      .from('Mensualidad')
      .select('id_mensualidad')
      .eq('mes_referencia', mesActual)
      .eq('anio_referencia', anioActual)
      .limit(1);

    if (errorVerif) {
      console.error('Error verificando mensualidades existentes:', errorVerif);
      return;
    }

    // Si ya hay mensualidades para este mes, no generar más
    if (mensualidadesExistentes && mensualidadesExistentes.length > 0) {
      console.log('Mensualidades ya generadas para este mes');
      return;
    }

    const { data: usuarios, error: errorUsuarios } = await supabase
      .from('Usuarios')
      .select('id_usuario, nombre, apellido, correo, rol, estado_cuenta')
      .eq('estado_cuenta', true)
      .in('rol', ['jugador', 'apoderado', 'entrenador']);

    if (errorUsuarios) {
      console.error('Error obteniendo usuarios:', errorUsuarios);
      return;
    }

    if (!usuarios || usuarios.length === 0) {
      console.log('No hay usuarios activos para generar mensualidades');
      return;
    }

    const idsUsuarios = usuarios.map(u => u.id_usuario);
    const { data: jugadores, error: errorJugadores } = await supabase
      .from('Jugador')
      .select('id_jugador')
      .in('id_jugador', idsUsuarios);

    if (errorJugadores) {
      console.error('Error obteniendo jugadores:', errorJugadores);
      return;
    }

    if (!jugadores || jugadores.length === 0) {
      console.log('No hay jugadores registrados');
      return;
    }

    const idsJugadores = jugadores.map(j => j.id_jugador);

    // Verificar qué usuarios ya tienen mensualidad para este mes
    const { data: mensualidadesExistentesCheck, error: errorExistentes } = await supabase
      .from('Mensualidad')
      .select('id_jugador')
      .eq('mes_referencia', mesActual)
      .eq('anio_referencia', anioActual)
      .in('id_jugador', idsJugadores);

    if (errorExistentes) {
      console.error('Error verificando mensualidades existentes:', errorExistentes);
      return;
    }

    const idsConMensualidad = new Set(
      mensualidadesExistentesCheck?.map(m => m.id_jugador) || []
    );

    const usuariosSinMensualidad = idsJugadores.filter(
      id => !idsConMensualidad.has(id)
    );

    if (usuariosSinMensualidad.length === 0) {
      console.log('Todos los usuarios ya tienen mensualidad para este mes');
      return;
    }

    const fechaVencimiento = new Date(anioActual, hoy.getMonth(), 10);
    const fechaVencimientoStr = fechaVencimiento.toISOString().split('T')[0];

    const mensualidadesACrear = usuariosSinMensualidad.map(idJugador => ({
      id_jugador: idJugador,
      monto: MONTO_FIJO,
      fecha_vencimiento: fechaVencimientoStr,
      fecha_pago: null,
      metodo_pago: null,
      estado_pago: 'Pendiente',
      mes_referencia: mesActual,
      anio_referencia: anioActual,
    }));

    const { error: errorCreacion } = await supabase
      .from('Mensualidad')
      .insert(mensualidadesACrear);

    if (errorCreacion) {
      console.error('Error creando mensualidades:', errorCreacion);
      return;
    }

    console.log(`✅ Generadas ${mensualidadesACrear.length} mensualidades para el mes ${mesActual}/${anioActual}`);

  } catch (error) {
    console.error('Error en generarMensualidadesAutomaticas:', error);
  }
};



export const generarMensualidadesManual = async (
  mes: number,
  anio: number,
  monto?: number
): Promise<{ success: boolean; message: string; count?: number }> => {
  try {
    const mesStr = mes.toString().padStart(2, '0');
    const montoFinal = monto || MONTO_FIJO;

    const { data: existentes, error: errorExistentes } = await supabase
      .from('Mensualidad')
      .select('id_mensualidad')
      .eq('mes_referencia', mesStr)
      .eq('anio_referencia', anio);

    if (errorExistentes) {
      return { success: false, message: 'Error verificando mensualidades existentes' };
    }

    if (existentes && existentes.length > 0) {
      return {
        success: false,
        message: `Ya existen ${existentes.length} mensualidades para ${mesStr}/${anio}`
      };
    }

    const { data: usuarios, error: errorUsuarios } = await supabase
      .from('Usuarios')
      .select('id_usuario')
      .eq('estado_cuenta', true)
      .in('rol', ['jugador', 'apoderado', 'entrenador']);

    if (errorUsuarios || !usuarios) {
      return { success: false, message: 'Error obteniendo usuarios activos' };
    }

    const idsUsuarios = usuarios.map(u => u.id_usuario);
    const { data: jugadores, error: errorJugadores } = await supabase
      .from('Jugador')
      .select('id_jugador')
      .in('id_jugador', idsUsuarios);

    if (errorJugadores || !jugadores) {
      return { success: false, message: 'Error obteniendo jugadores' };
    }

    const fechaVencimiento = new Date(anio, mes - 1, 10);
    const fechaVencimientoStr = fechaVencimiento.toISOString().split('T')[0];

    const mensualidadesACrear = jugadores.map(jugador => ({
      id_jugador: jugador.id_jugador,
      monto: montoFinal,
      fecha_vencimiento: fechaVencimientoStr,
      fecha_pago: null,
      metodo_pago: null,
      estado_pago: 'Pendiente',
      mes_referencia: mesStr,
      anio_referencia: anio,
    }));

    const { error: errorCreacion } = await supabase
      .from('Mensualidad')
      .insert(mensualidadesACrear);

    if (errorCreacion) {
      return { success: false, message: 'Error creando mensualidades' };
    }

    return {
      success: true,
      message: `✅ Generadas ${mensualidadesACrear.length} mensualidades para ${mesStr}/${anio}`,
      count: mensualidadesACrear.length
    };

  } catch (error) {
    console.error('Error en generarMensualidadesManual:', error);
    return { success: false, message: 'Error interno del servidor' };
  }
};

export const obtenerEstadisticasMensualidades = async () => {
  try {
    const hoy = new Date();
    const mesActual = (hoy.getMonth() + 1).toString().padStart(2, '0');
    const anioActual = hoy.getFullYear();

    const { data: total, error: errorTotal } = await supabase
      .from('Mensualidad')
      .select('id_mensualidad', { count: 'exact' })
      .eq('mes_referencia', mesActual)
      .eq('anio_referencia', anioActual);

    const { data: pagadas, error: errorPagadas } = await supabase
      .from('Mensualidad')
      .select('id_mensualidad', { count: 'exact' })
      .eq('mes_referencia', mesActual)
      .eq('anio_referencia', anioActual)
      .eq('estado_pago', 'Pagado');

    const { data: pendientes, error: errorPendientes } = await supabase
      .from('Mensualidad')
      .select('id_mensualidad', { count: 'exact' })
      .eq('mes_referencia', mesActual)
      .eq('anio_referencia', anioActual)
      .eq('estado_pago', 'Pendiente');

    if (errorTotal || errorPagadas || errorPendientes) {
      console.error('Error obteniendo estadísticas');
      return null;
    }

    return {
      total: total?.length || 0,
      pagadas: pagadas?.length || 0,
      pendientes: pendientes?.length || 0,
      porcentajePagado: total && total.length > 0
        ? Math.round(((pagadas?.length || 0) / total.length) * 100)
        : 0
    };

  } catch (error) {
    console.error('Error en obtenerEstadisticasMensualidades:', error);
    return null;
  }
};
