import { z } from 'zod';

// Base asistencia schema
export const asistenciaBaseSchema = z.object({
  estado_asistencia: z.enum(['Presente', 'Ausente', 'Justificado', 'Sin registro']),
  id_jugador: z.string().min(1, 'Debe seleccionar un jugador'),
  id_entrenamiento: z.string().optional(),
  id_evento: z.string().optional(),
  fecha_asistencia: z.date(),
}).refine(
  (data) => data.id_entrenamiento || data.id_evento,
  {
    message: 'Debe seleccionar un entrenamiento o evento',
    path: ['id_entrenamiento'],
  }
);

// Create asistencia schema
export const createAsistenciaSchema = asistenciaBaseSchema;

// Update asistencia schema
export const updateAsistenciaSchema = z.object({
  estado_asistencia: z.enum(['Presente', 'Ausente', 'Justificado', 'Sin registro']).optional(),
  id_jugador: z.string().optional(),
  id_entrenamiento: z.string().optional(),
  id_evento: z.string().optional(),
  fecha_asistencia: z.date().optional(),
});

// Simple validation schemas
export const asistenciaValidation = asistenciaBaseSchema;

// Type exports
export type AsistenciaBase = z.infer<typeof asistenciaBaseSchema>;
export type CreateAsistenciaData = z.infer<typeof createAsistenciaSchema>;
export type UpdateAsistenciaData = z.infer<typeof updateAsistenciaSchema>;
