// Schema exports
export * from './schema/reportesSchema';

// Service exports
export * from './services/reportesService';

// Base hooks exports
export * from './hooks/useList';
export * from './hooks/useForm';

// Role-specific hooks exports
export * from './hooks/role/useAdminReportes';

// Templates exports
export { default as ListBase } from './templates/ListBase';
export { default as FormBase } from './templates/FormBase';
export { default as DetailBase } from './templates/DetailBase';
