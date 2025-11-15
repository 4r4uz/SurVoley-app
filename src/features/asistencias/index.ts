// Schema exports
export * from './schema/asistenciasSchema';

// Service exports
export * from './services/asistenciasService';

// Base hooks exports
export * from './hooks/useList';
export * from './hooks/useForm';

// Role-specific hooks exports
export * from './hooks/role/useAdminAsistencias';
export * from './hooks/role/useEntrenadorAsistencias';
export * from './hooks/role/useJugadorAsistencias';
export * from './hooks/role/useApoderadoAsistencias';

// Templates exports
export { default as ListBase } from './templates/ListBase';
export { default as FormBase } from './templates/FormBase';
export { default as DetailBase } from './templates/DetailBase';
