import { useState, useEffect, useCallback, useMemo } from 'react';

export interface FiltrosBase {
  busqueda: string;
  [key: string]: any;
}

export interface UseListReturn<T> {
  items: T[];
  itemsFiltrados: T[];
  loading: boolean;
  refreshing: boolean;
  filtros: FiltrosBase;
  setFiltros: (filtros: FiltrosBase) => void;
  onRefresh: () => void;
  stats: Record<string, any>;
}

export interface UseListConfig<T> {
  fetchItems: () => Promise<T[]>;
  calculateStats?: (items: T[]) => Record<string, any>;
  filterItems?: (items: T[], filtros: FiltrosBase) => T[];
  searchFields?: string[];
}

export function useList<T>({
  fetchItems,
  calculateStats,
  filterItems,
  searchFields = []
}: UseListConfig<T>): UseListReturn<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosBase>({
    busqueda: '',
  });

  const cargarItems = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchItems();
      setItems(data);
    } catch (error) {
      console.error('Error cargando items:', error);
      // TODO: Handle error (show alert)
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchItems]);

  const aplicarFiltros = useCallback(() => {
    let filtrados = items;

    // Apply custom filters if provided
    if (filterItems) {
      filtrados = filterItems(items, filtros);
    } else {
      // Default search filter
      if (filtros.busqueda && searchFields.length > 0) {
        const busquedaLower = filtros.busqueda.toLowerCase();
        filtrados = filtrados.filter(item =>
          searchFields.some(field => {
            const value = (item as any)[field];
            return value && value.toString().toLowerCase().includes(busquedaLower);
          })
        );
      }
    }

    return filtrados;
  }, [items, filtros, filterItems, searchFields]);

  const itemsFiltrados = useMemo(() => aplicarFiltros(), [aplicarFiltros]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    cargarItems();
  }, [cargarItems]);

  useEffect(() => {
    cargarItems();
  }, [cargarItems]);

  const stats = useMemo(() => {
    if (calculateStats) {
      return calculateStats(items);
    }
    return { total: items.length };
  }, [items, calculateStats]);

  return {
    items,
    itemsFiltrados,
    loading,
    refreshing,
    filtros,
    setFiltros,
    onRefresh,
    stats,
  };
}
