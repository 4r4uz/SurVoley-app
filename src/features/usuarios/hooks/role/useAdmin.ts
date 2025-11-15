import { useList, UseListReturn } from '../useList';
import { useForm, UseFormReturn } from '../useForm';

export interface UseAdminReturn {
  list: UseListReturn;
  form: UseFormReturn;
  // Admin has full permissions
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewAll: boolean;
  visibleColumns: string[];
}

export function useAdmin(): UseAdminReturn {
  const list = useList();
  const form = useForm(list.onRefresh);

  return {
    list,
    form,
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canViewAll: true,
    visibleColumns: ['all'], // Show all columns
  };
}
