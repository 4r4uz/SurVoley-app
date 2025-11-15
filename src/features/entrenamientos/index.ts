// Schema exports
export * from './schema/entrenamientosSchema';

// Service exports
export * from './services/entrenamientosService';

// Base hooks exports
export * from './hooks/useList';
export * from './hooks/useForm';

// Role-specific hooks exports
export * from './hooks/role/useAdminEntrenamientos';
export * from './hooks/role/useEntrenadorEntrenamientos';
export * from './hooks/role/useJugadorEntrenamientos';
export * from './hooks/role/useApoderadoEntrenamientos';

// Templates exports
export { default as ListBase } from './templates/ListBase';
export { default as FormBase } from './templates/FormBase';
export { default as DetailBase } from './templates/DetailBase';
