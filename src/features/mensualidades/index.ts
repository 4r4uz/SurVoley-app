// Schema exports
export * from './schema/mensualidadesSchema';

// Service exports
export * from './services/mensualidadesService';

// Base hooks exports
export * from './hooks/useList';
export * from './hooks/useForm';

// Role-specific hooks exports
export * from './hooks/role/useAdminMensualidades';
export * from './hooks/role/useEntrenadorMensualidades';
export * from './hooks/role/useJugadorMensualidades';
export * from './hooks/role/useApoderadoMensualidades';

// Templates exports
export { default as ListBase } from './templates/ListBase';
export { default as FormBase } from './templates/FormBase';
export { default as DetailBase } from './templates/DetailBase';
