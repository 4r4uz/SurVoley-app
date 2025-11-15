import { z } from 'zod';

// Base user schema
export const userBaseSchema = z.object({
  nombre: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres'),
  apellido: z.string()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido no puede exceder 50 caracteres'),
  correo: z.string()
    .email('El formato del correo no es válido')
    .max(100, 'El correo no puede exceder 100 caracteres'),
  telefono: z.string()
    .optional()
    .refine(
      (val) => !val || /^[\+]?[0-9\s\-\(\)]{8,}$/.test(val),
      'El formato del teléfono no es válido'
    ),
  rol: z.enum(['admin', 'entrenador', 'jugador', 'apoderado']),
  estado_cuenta: z.boolean(),
});

// Player specific schema
export const playerSchema = z.object({
  rut: z.string()
    .regex(/^[0-9]{7,8}-[0-9kK]{1}$/, 'El formato del RUT no es válido (12345678-9)'),
  fecha_nacimiento: z.date(),
  categoria: z.string().optional(),
  posicion: z.string().optional(),
});

// Guardian specific schema
export const guardianSchema = z.object({
  parentesco: z.string().min(1, 'El parentesco es obligatorio'),
  id_jugador_tutorado: z.string().min(1, 'Debe seleccionar un jugador tutorado'),
});

// Password schema for new users
export const passwordSchema = z.object({
  nuevaPassword: z.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmarPassword: z.string(),
}).refine(
  (data) => data.nuevaPassword === data.confirmarPassword,
  {
    message: 'Las contraseñas no coinciden',
    path: ['confirmarPassword'],
  }
);

// Simple schemas for validation
export const baseUserValidation = userBaseSchema;
export const playerValidation = playerSchema;
export const guardianValidation = guardianSchema;
export const passwordValidation = passwordSchema;

// For now, use manual validation in hooks as in original code
// These schemas can be used for form validation if needed

// Type exports
export type UserBase = z.infer<typeof userBaseSchema>;
export type PlayerData = z.infer<typeof playerSchema>;
export type GuardianData = z.infer<typeof guardianSchema>;
