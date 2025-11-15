import { z } from 'zod';

// Base certificado schema
export const certificadoBaseSchema = z.object({
  tipo_certificado: z.string().min(1, 'El tipo de certificado es obligatorio'),
  fecha_emision: z.date(),
  fecha_vencimiento: z.date(),
  url: z.string().url('La URL debe ser válida').optional(),
  id_jugador: z.string().min(1, 'Debe seleccionar un jugador'),
});

// Create certificado schema
export const createCertificadoSchema = certificadoBaseSchema;

// Update certificado schema
export const updateCertificadoSchema = certificadoBaseSchema.partial();

// Simple validation schemas
export const certificadoValidation = certificadoBaseSchema;

// Type exports
export type CertificadoBase = z.infer<typeof certificadoBaseSchema>;
export type CreateCertificadoData = z.infer<typeof createCertificadoSchema>;
export type UpdateCertificadoData = z.infer<typeof updateCertificadoSchema>;
