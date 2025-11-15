import { supabase } from '../../../core/supabase/supabaseClient';
import { Reportes, ReportesFormData } from '../schema/reportesSchema';

export class ReportesService {
  static async getAll(): Promise<Reportes[]> {
    const { data, error } = await supabase
      .from('Reportes')
      .select('*')
      .order('fecha_creacion', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getById(id: string): Promise<Reportes | null> {
    const { data, error } = await supabase
      .from('Reportes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async create(reporte: ReportesFormData): Promise<Reportes> {
    const { data, error } = await supabase
      .from('Reportes')
      .insert([reporte])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(id: string, reporte: Partial<ReportesFormData>): Promise<Reportes> {
    const { data, error } = await supabase
      .from('Reportes')
      .update(reporte)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('Reportes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Método específico para generar reportes
  static async generateReport(type: string, startDate: string, endDate: string): Promise<any> {
    // Lógica para generar diferentes tipos de reportes
    switch (type) {
      case 'financiero':
        return this.generateFinancialReport(startDate, endDate);
      case 'asistencias':
        return this.generateAttendanceReport(startDate, endDate);
      case 'usuarios':
        return this.generateUsersReport(startDate, endDate);
      default:
        return this.generateGeneralReport(startDate, endDate);
    }
  }

  private static async generateFinancialReport(startDate: string, endDate: string): Promise<any> {
    const { data, error } = await supabase
      .from('Mensualidad')
      .select('monto, estado_pago, fecha_pago')
      .gte('fecha_pago', startDate)
      .lte('fecha_pago', endDate);

    if (error) throw error;

    const totalIngresos = data?.filter(m => m.estado_pago === 'Pagado')
      .reduce((sum, m) => sum + (m.monto || 0), 0) || 0;

    const pagosPendientes = data?.filter(m => m.estado_pago === 'Pendiente').length || 0;

    return {
      totalIngresos,
      pagosPendientes,
      totalTransacciones: data?.length || 0,
      periodo: { startDate, endDate }
    };
  }

  private static async generateAttendanceReport(startDate: string, endDate: string): Promise<any> {
    const { data, error } = await supabase
      .from('Asistencias')
      .select('*')
      .gte('fecha', startDate)
      .lte('fecha', endDate);

    if (error) throw error;

    const totalAsistencias = data?.length || 0;
    const asistenciasPresentes = data?.filter(a => a.estado === 'Presente').length || 0;
    const asistenciasAusentes = data?.filter(a => a.estado === 'Ausente').length || 0;

    return {
      totalAsistencias,
      asistenciasPresentes,
      asistenciasAusentes,
      porcentajeAsistencia: totalAsistencias > 0 ? (asistenciasPresentes / totalAsistencias) * 100 : 0,
      periodo: { startDate, endDate }
    };
  }

  private static async generateUsersReport(startDate: string, endDate: string): Promise<any> {
    const { data, error } = await supabase
      .from('Usuarios')
      .select('rol, estado_cuenta, fecha_registro');

    if (error) throw error;

    const totalUsuarios = data?.length || 0;
    const usuariosActivos = data?.filter(u => u.estado_cuenta).length || 0;
    const usuariosPorRol = {
      admin: data?.filter(u => u.rol === 'admin').length || 0,
      entrenador: data?.filter(u => u.rol === 'entrenador').length || 0,
      jugador: data?.filter(u => u.rol === 'jugador').length || 0,
      apoderado: data?.filter(u => u.rol === 'apoderado').length || 0,
    };

    return {
      totalUsuarios,
      usuariosActivos,
      usuariosPorRol,
      periodo: { startDate, endDate }
    };
  }

  private static async generateGeneralReport(startDate: string, endDate: string): Promise<any> {
    const [financial, attendance, users] = await Promise.all([
      this.generateFinancialReport(startDate, endDate),
      this.generateAttendanceReport(startDate, endDate),
      this.generateUsersReport(startDate, endDate)
    ]);

    return {
      resumenGeneral: {
        ingresosTotales: financial.totalIngresos,
        usuariosActivos: users.usuariosActivos,
        tasaAsistencia: attendance.porcentajeAsistencia,
      },
      detalles: {
        financiero: financial,
        asistencias: attendance,
        usuarios: users,
      },
      periodo: { startDate, endDate }
    };
  }
}
