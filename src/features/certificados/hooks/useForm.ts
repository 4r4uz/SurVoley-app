import { useForm as useBaseForm, UseFormReturn, UseFormConfig } from '../../pagos/hooks/useForm';
import { CertificadosService, Certificado } from '../services/certificadosService';
import { CreateCertificadoData, UpdateCertificadoData } from '../schema/certificadosSchema';

export interface CertificadoFormData {
  tipo_certificado: string;
  fecha_emision: Date;
  fecha_vencimiento: Date;
  url?: string;
  id_jugador: string;
}

export interface UseFormCertificadosReturn extends UseFormReturn<CertificadoFormData> {}

export function useForm(config?: Partial<UseFormConfig<CertificadoFormData>>): UseFormCertificadosReturn {
  const baseConfig: UseFormConfig<CertificadoFormData> = {
    initialData: {
      tipo_certificado: '',
      fecha_emision: new Date(),
      fecha_vencimiento: new Date(),
      id_jugador: '',
    },
    validate: (data) => {
      const errors: Record<string, string> = {};
      if (!data.tipo_certificado) errors.tipo_certificado = 'El tipo de certificado es obligatorio';
      if (!data.id_jugador) errors.id_jugador = 'Debe seleccionar un jugador';
      if (data.fecha_vencimiento <= data.fecha_emision) {
        errors.fecha_vencimiento = 'La fecha de vencimiento debe ser posterior a la emisión';
      }
      if (data.url && !data.url.match(/^https?:\/\/.+/)) {
        errors.url = 'La URL debe ser válida (comenzar con http:// o https://)';
      }
      return errors;
    },
    onSubmit: async (data, isEditing) => {
      if (isEditing) {
        // Para edición necesitaríamos el ID del certificado
        throw new Error('Edit functionality needs certificado ID');
      } else {
        await CertificadosService.create(data as CreateCertificadoData);
      }
    },
    onSuccess: () => {
      // Refresh logic would be handled by parent
    },
    ...config,
  };

  return useBaseForm<CertificadoFormData>(baseConfig);
}
