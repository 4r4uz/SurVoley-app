import { z } from 'zod';

// Schema para reportes
export const reportesSchema = z.object({
  id: z.string().optional(),
  titulo: z.string().min(1, 'El título es requerido'),
  descripcion: z.string().min(1, 'La descripción es requerida'),
  tipo: z.enum(['financiero', 'asistencias', 'usuarios', 'general']),
  fecha_inicio: z.string().min(1, 'La fecha de inicio es requerida'),
  fecha_fin: z.string().min(1, 'La fecha de fin es requerida'),
  estado: z.enum(['generado', 'procesando', 'error']).default('procesando'),
  datos: z.any().optional(),
  creado_por: z.string().optional(),
  fecha_creacion: z.string().optional(),
});

export type ReportesFormData = z.infer<typeof reportesSchema>;
export type Reportes = ReportesFormData & {
  id: string;
  fecha_creacion: string;
};
