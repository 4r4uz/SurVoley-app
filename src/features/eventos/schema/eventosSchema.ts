import { z } from 'zod';

// Base evento schema
export const eventoBaseSchema = z.object({
  titulo: z.string().min(1, 'El título es obligatorio'),
  tipo_evento: z.enum(['Partido', 'Torneo', 'Amistoso', 'Entrenamiento']),
  fecha_hora: z.date(),
  ubicacion: z.string().min(1, 'La ubicación es obligatoria'),
  id_organizador: z.string().min(1, 'Debe seleccionar un organizador'),
});

// Create evento schema
export const createEventoSchema = eventoBaseSchema;

// Update evento schema
export const updateEventoSchema = eventoBaseSchema.partial();

// Simple validation schemas
export const eventoValidation = eventoBaseSchema;

// Type exports
export type EventoBase = z.infer<typeof eventoBaseSchema>;
export type CreateEventoData = z.infer<typeof createEventoSchema>;
export type UpdateEventoData = z.infer<typeof updateEventoSchema>;
