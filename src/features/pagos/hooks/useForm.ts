import { useState, useCallback } from 'react';
import { Alert } from 'react-native';

export interface UseFormReturn<T> {
  formData: T;
  setFormData: (data: T) => void;
  errors: Record<string, string>;
  loading: boolean;
  isEditing: boolean;
  onSave: () => Promise<void>;
  onCancel: () => void;
  resetForm: () => void;
  validateForm: () => boolean;
  setErrors: (errors: Record<string, string>) => void;
}

export interface UseFormConfig<T> {
  initialData: T;
  validate: (data: T) => Record<string, string>;
  onSubmit: (data: T, isEditing: boolean) => Promise<void>;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export function useForm<T>({
  initialData,
  validate,
  onSubmit,
  onSuccess,
  onError
}: UseFormConfig<T>): UseFormReturn<T> {
  const [formData, setFormData] = useState<T>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const validateForm = useCallback((): boolean => {
    const validationErrors = validate(formData);
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  }, [formData, validate]);

  const onSave = useCallback(async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Por favor corrige los errores en el formulario');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData, isEditing);
      Alert.alert('Éxito', isEditing ? 'Elemento actualizado correctamente' : 'Elemento creado correctamente');
      onSuccess?.();
    } catch (error: any) {
      console.error('Error guardando elemento:', error);

      if (onError) {
        onError(error);
      } else {
        Alert.alert('Error', 'No se pudo guardar el elemento. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  }, [formData, isEditing, validateForm, onSubmit, onSuccess, onError]);

  const onCancel = useCallback(() => {
    resetForm();
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialData);
    setErrors({});
    setIsEditing(false);
  }, [initialData]);

  return {
    formData,
    setFormData,
    errors,
    loading,
    isEditing,
    onSave,
    onCancel,
    resetForm,
    validateForm,
    setErrors,
  };
}
