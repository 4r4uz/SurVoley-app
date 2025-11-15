// Schema exports
export * from './schema/certificadosSchema';

// Service exports
export * from './services/certificadosService';

// Base hooks exports
export * from './hooks/useList';
export * from './hooks/useForm';

// Role-specific hooks exports
export * from './hooks/role/useAdminCertificados';
export * from './hooks/role/useEntrenadorCertificados';
export * from './hooks/role/useJugadorCertificados';
export * from './hooks/role/useApoderadoCertificados';

// Templates exports
export { default as ListBase } from './templates/ListBase';
export { default as FormBase } from './templates/FormBase';
export { default as DetailBase } from './templates/DetailBase';
