// ========== AUTENTICACIÓN ==========
export interface User {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: 'admin' | 'jugador' | 'apoderado' | 'entrenador';
  estado_cuenta: boolean;
  created_at: string;
}

// ========== ASISTENCIAS ==========
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

export interface CreateAsistenciaData {
  estado_asistencia: Asistencia['estado_asistencia'];
  id_jugador: string;
  id_entrenamiento?: string;
  id_evento?: string;
  fecha_asistencia: Date;
}

export interface UpdateAsistenciaData {
  estado_asistencia?: Asistencia['estado_asistencia'];
  id_jugador?: string;
  id_entrenamiento?: string;
  id_evento?: string;
  fecha_asistencia?: Date;
}

// ========== CERTIFICADOS ==========
export interface Certificado {
  id_certificado: string;
  titulo: string;
  descripcion: string;
  fecha_emision: string;
  tipo_certificado: string;
  archivo_url: string | null;
  id_jugador: string;
  created_at: string;
  updated_at: string;
  // Joined data
  jugador?: {
    nombre: string;
    apellido: string;
  };
}

export interface CreateCertificadoData {
  titulo: string;
  descripcion: string;
  tipo_certificado: string;
  archivo_url?: string;
  id_jugador: string;
}

export interface UpdateCertificadoData {
  titulo?: string;
  descripcion?: string;
  tipo_certificado?: string;
  archivo_url?: string;
}

// ========== MENSUALIDADES ==========
export interface Mensualidad {
  id_mensualidad: string;
  id_jugador: string;
  monto: number;
  fecha_vencimiento: string;
  fecha_pago: string | null;
  metodo_pago: string | null;
  estado_pago: string;
  mes_referencia: string;
  anio_referencia: number;
  created_at: string;
}

export interface UsuarioMensualidad {
  id_jugador: string;
  nombre: string;
  apellido: string;
  correo: string;
  rol: string;
}

// ========== USUARIOS ==========
export interface Usuario {
  id_usuario: string;
  nombre: string;
  apellido: string;
  correo: string;
  rol: string;
  estado_cuenta: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  jugador?: {
    id_jugador: string;
    rut: string;
    categoria: string;
    fecha_nacimiento: string;
  };
  apoderado?: {
    id_apoderado: string;
    id_jugador_tutorado: string;
  };
  entrenador?: {
    id_entrenador: string;
    especialidad: string;
  };
}

export interface CreateUsuarioData {
  nombre: string;
  apellido: string;
  correo: string;
  rol: Usuario['rol'];
  estado_cuenta?: boolean;
  password?: string;
}

export interface UpdateUsuarioData {
  nombre?: string;
  apellido?: string;
  correo?: string;
  rol?: Usuario['rol'];
  estado_cuenta?: boolean;
}

// ========== ENTRENAMIENTOS ==========
export interface Entrenamiento {
  id_entrenamiento: string;
  fecha_hora: string;
  lugar: string;
  descripcion: string;
  id_entrenador: string;
  created_at: string;
  updated_at: string;
  // Joined data
  entrenador?: {
    nombre: string;
    apellido: string;
  };
}

export interface CreateEntrenamientoData {
  fecha_hora: string;
  lugar: string;
  descripcion: string;
  id_entrenador: string;
}

export interface UpdateEntrenamientoData {
  fecha_hora?: string;
  lugar?: string;
  descripcion?: string;
  id_entrenador?: string;
}

// ========== EVENTOS ==========
export interface Evento {
  id_evento: string;
  titulo: string;
  descripcion: string;
  tipo_evento: string;
  fecha_hora: string;
  ubicacion: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEventoData {
  titulo: string;
  descripcion: string;
  tipo_evento: string;
  fecha_hora: string;
  ubicacion: string;
}

export interface UpdateEventoData {
  titulo?: string;
  descripcion?: string;
  tipo_evento?: string;
  fecha_hora?: string;
  ubicacion?: string;
}

// ========== PAGOS ==========
export interface Pago {
  id_pago: string;
  monto: number;
  fecha_pago: string;
  metodo_pago: string;
  descripcion: string;
  id_jugador: string;
  created_at: string;
  // Joined data
  jugador?: {
    nombre: string;
    apellido: string;
  };
}

export interface CreatePagoData {
  monto: number;
  fecha_pago: Date;
  metodo_pago: string;
  descripcion: string;
  id_jugador: string;
}

export interface UpdatePagoData {
  monto?: number;
  fecha_pago?: Date;
  metodo_pago?: string;
  descripcion?: string;
}

// ========== REPORTES ==========
export interface Reporte {
  id_reporte: string;
  titulo: string;
  descripcion: string;
  tipo_reporte: string;
  fecha_generacion: string;
  archivo_url: string | null;
  created_at: string;
}

export interface CreateReporteData {
  titulo: string;
  descripcion: string;
  tipo_reporte: string;
  archivo_url?: string;
}

export interface UpdateReporteData {
  titulo?: string;
  descripcion?: string;
  tipo_reporte?: string;
  archivo_url?: string;
}

// ========== ESTADÍSTICAS ==========
export interface EstadisticasGenerales {
  totalUsuarios: number;
  totalJugadores: number;
  totalApoderados: number;
  totalEntrenadores: number;
  mensualidadesPagadas: number;
  mensualidadesPendientes: number;
  totalRecaudado: number;
}

// ========== CONFIGURACIÓN ==========
export interface ConfiguracionSistema {
  clave: string;
  valor: string;
  descripcion: string;
}

// ========== UTILITY TYPES ==========
export type UserRole = 'admin' | 'jugador' | 'apoderado' | 'entrenador';

export interface ApiResponse<T> {
  data: T;
  error: string | null;
  success: boolean;
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
