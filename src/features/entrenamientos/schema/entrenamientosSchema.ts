import { z } from 'zod';

// Base entrenamiento schema
export const entrenamientoBaseSchema = z.object({
  fecha_hora: z.date(),
  lugar: z.string().min(1, 'El lugar es obligatorio'),
  id_entrenador: z.string().min(1, 'Debe seleccionar un entrenador'),
  duracion_minutos: z.number().min(1, 'La duración debe ser mayor a 0'),
  descripcion: z.string().optional(),
});

// Create entrenamiento schema
export const createEntrenamientoSchema = entrenamientoBaseSchema;

// Update entrenamiento schema
export const updateEntrenamientoSchema = entrenamientoBaseSchema.partial();

// Simple validation schemas
export const entrenamientoValidation = entrenamientoBaseSchema;

// Type exports
export type EntrenamientoBase = z.infer<typeof entrenamientoBaseSchema>;
export type CreateEntrenamientoData = z.infer<typeof createEntrenamientoSchema>;
export type UpdateEntrenamientoData = z.infer<typeof updateEntrenamientoSchema>;
