// Schema exports
export * from './schema/pagosSchema';

// Service exports
export * from './services/pagosService';

// Base hooks exports
export * from './hooks/useList';
export * from './hooks/useForm';

// Role-specific hooks exports
export * from './hooks/role/useAdminPagos';
export * from './hooks/role/useEntrenadorPagos';
export * from './hooks/role/useJugadorPagos';
export * from './hooks/role/useApoderadoPagos';

// Templates exports
export { default as ListBase } from './templates/ListBase';
export { default as FormBase } from './templates/FormBase';
export { default as DetailBase } from './templates/DetailBase';
