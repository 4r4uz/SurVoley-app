import { z } from 'zod';

// Base mensualidad schema (igual que pagos ya que usan la misma tabla)
export const mensualidadBaseSchema = z.object({
  monto: z.number()
    .min(0, 'El monto debe ser mayor o igual a 0'),
  fecha_pago: z.date().optional(),
  metodo_pago: z.string().optional(),
  estado_pago: z.enum(['Pendiente', 'Pagado', 'Cancelado']),
  id_jugador: z.string().min(1, 'Debe seleccionar un jugador'),
  fecha_vencimiento: z.date(),
  mes_referencia: z.string().min(1, 'El mes de referencia es obligatorio'),
  anio_referencia: z.number()
    .min(2020, 'El año debe ser válido')
    .max(2050, 'El año debe ser válido'),
});

// Create mensualidad schema
export const createPagoSchema = mensualidadBaseSchema;

// Update mensualidad schema
export const updatePagoSchema = mensualidadBaseSchema.partial();

// Simple validation schemas
export const mensualidadValidation = mensualidadBaseSchema;

// Type exports
export type MensualidadBase = z.infer<typeof mensualidadBaseSchema>;
export type CreatePagoData = z.infer<typeof createPagoSchema>;
export type UpdatePagoData = z.infer<typeof updatePagoSchema>;
