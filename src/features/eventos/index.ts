// Schema exports
export * from './schema/eventosSchema';

// Service exports
export * from './services/eventosService';

// Base hooks exports
export * from './hooks/useList';
export * from './hooks/useForm';

// Role-specific hooks exports
export * from './hooks/role/useAdminEventos';
export * from './hooks/role/useEntrenadorEventos';
export * from './hooks/role/useJugadorEventos';
export * from './hooks/role/useApoderadoEventos';

// Templates exports
export { default as ListBase } from './templates/ListBase';
export { default as FormBase } from './templates/FormBase';
export { default as DetailBase } from './templates/DetailBase';
