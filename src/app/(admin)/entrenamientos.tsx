import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  Modal,
  TextInput,
} from "react-native";
import { useAuth } from "../../core/auth/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../core/supabase/supabaseClient";
import SafeLayout from "../../shared/components/SafeLayout";
import { colors } from "../../shared/constants/theme";

const { width } = Dimensions.get("window");

interface Entrenamiento {
  id_entrenamiento: string;
  fecha_hora: string;
  lugar: string;
  id_entrenador: string;
  duracion_minutos: number;
  descripcion: string;
  created_at: string;
  updated_at: string;
  entrenador?: {
    nombre: string;
    apellido: string;
  };
}

interface Evento {
  id_evento: string;
  titulo: string;
  tipo_evento: string;
  fecha_hora: string;
  ubicacion: string;
  id_organizador: string;
  created_at: string;
  updated_at: string;
  organizador?: {
    nombre: string;
    apellido: string;
  };
}

export default function EntrenamientosEventosScreen() {
  const { user } = useAuth();
  const [entrenamientos, setEntrenamientos] = useState<Entrenamiento[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'entrenamientos' | 'eventos'>('entrenamientos');

  // Pagination states
  const [entrenamientosPage, setEntrenamientosPage] = useState(1);
  const [eventosPage, setEventosPage] = useState(1);
  const [hasMoreEntrenamientos, setHasMoreEntrenamientos] = useState(true);
  const [hasMoreEventos, setHasMoreEventos] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const ITEMS_PER_PAGE = 10;

  // Filter states
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroLugar, setFiltroLugar] = useState('');

  // Modal states
  const [entrenamientoModalVisible, setEntrenamientoModalVisible] = useState(false);
  const [eventoModalVisible, setEventoModalVisible] = useState(false);
  const [editingEntrenamiento, setEditingEntrenamiento] = useState<Entrenamiento | null>(null);
  const [editingEvento, setEditingEvento] = useState<Evento | null>(null);

  // Form states
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaHora, setFechaHora] = useState('');
  const [lugar, setLugar] = useState('');
  const [duracionMinutos, setDuracionMinutos] = useState('');
  const [tipoEvento, setTipoEvento] = useState('');

  const tiposEntrenamiento = [
    'Entrenamiento Físico',
    'Técnica',
    'Táctica',
  ];

  const tiposEvento = [
    'Torneo',
    'Partido Amistoso',
    'Charla Técnica',
    'Evento Social',
    'Competencia'
  ];

  const cargarEntrenamientos = async (page: number = 1, append: boolean = false) => {
    try {
      if (!append) setLoading(true);
      else setLoadingMore(true);

      let query = supabase
        .from("Entrenamiento")
        .select(`
          *,
          entrenador:Usuarios!id_entrenador(nombre, apellido)
        `, { count: 'exact' })
        .order("fecha_hora", { ascending: false })
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);

      // Aplicar filtros
      if (filtroFecha) {
        query = query.gte("fecha_hora", `${filtroFecha}T00:00:00`).lt("fecha_hora", `${filtroFecha}T23:59:59`);
      }
      if (filtroLugar) {
        query = query.ilike("lugar", `%${filtroLugar}%`);
      }

      const { data: entrenamientosData, error: errorEntrenamientos, count } = await query;

      if (errorEntrenamientos) throw errorEntrenamientos;

      if (append) {
        setEntrenamientos(prev => [...prev, ...(entrenamientosData || [])]);
      } else {
        setEntrenamientos(entrenamientosData || []);
      }

      setHasMoreEntrenamientos(count ? (page * ITEMS_PER_PAGE) < count : false);

    } catch (error) {
      console.error("Error cargando entrenamientos:", error);
      Alert.alert("Error", "No se pudieron cargar los entrenamientos");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const cargarEventos = async (page: number = 1, append: boolean = false) => {
    try {
      if (!append) setLoading(true);
      else setLoadingMore(true);

      let query = supabase
        .from("Evento")
        .select(`
          *,
          organizador:Usuarios!id_organizador(nombre, apellido)
        `, { count: 'exact' })
        .order("fecha_hora", { ascending: false })
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);

      // Aplicar filtros
      if (filtroFecha) {
        query = query.gte("fecha_hora", `${filtroFecha}T00:00:00`).lt("fecha_hora", `${filtroFecha}T23:59:59`);
      }
      if (filtroTipo) {
        query = query.eq("tipo_evento", filtroTipo);
      }
      if (filtroLugar) {
        query = query.ilike("ubicacion", `%${filtroLugar}%`);
      }

      const { data: eventosData, error: errorEventos, count } = await query;

      if (errorEventos) throw errorEventos;

      if (append) {
        setEventos(prev => [...prev, ...(eventosData || [])]);
      } else {
        setEventos(eventosData || []);
      }

      setHasMoreEventos(count ? (page * ITEMS_PER_PAGE) < count : false);

    } catch (error) {
      console.error("Error cargando eventos:", error);
      Alert.alert("Error", "No se pudieron cargar los eventos");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const cargarDatos = async () => {
    setEntrenamientosPage(1);
    setEventosPage(1);
    await Promise.all([
      cargarEntrenamientos(1, false),
      cargarEventos(1, false)
    ]);
  };

  const cargarMasEntrenamientos = async () => {
    const nextPage = entrenamientosPage + 1;
    setEntrenamientosPage(nextPage);
    await cargarEntrenamientos(nextPage, true);
  };

  const cargarMasEventos = async () => {
    const nextPage = eventosPage + 1;
    setEventosPage(nextPage);
    await cargarEventos(nextPage, true);
  };

  const aplicarFiltros = () => {
    setEntrenamientosPage(1);
    setEventosPage(1);
    cargarEntrenamientos(1, false);
    cargarEventos(1, false);
  };

  const limpiarFiltros = () => {
    setFiltroFecha('');
    setFiltroTipo('');
    setFiltroLugar('');
    setEntrenamientosPage(1);
    setEventosPage(1);
    cargarDatos();
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const resetForm = () => {
    setTitulo('');
    setDescripcion('');
    setFechaHora('');
    setLugar('');
    setDuracionMinutos('');
    setTipoEvento('');
    setEditingEntrenamiento(null);
    setEditingEvento(null);
  };

  const abrirModalEntrenamiento = (entrenamiento?: Entrenamiento) => {
    if (entrenamiento) {
      setEditingEntrenamiento(entrenamiento);
      setDescripcion(entrenamiento.descripcion);
      setFechaHora(entrenamiento.fecha_hora);
      setLugar(entrenamiento.lugar);
      setDuracionMinutos(entrenamiento.duracion_minutos.toString());
    } else {
      resetForm();
    }
    setEntrenamientoModalVisible(true);
  };

  const abrirModalEvento = (evento?: Evento) => {
    if (evento) {
      setEditingEvento(evento);
      setTitulo(evento.titulo);
      setTipoEvento(evento.tipo_evento);
      setFechaHora(evento.fecha_hora);
      setLugar(evento.ubicacion);
    } else {
      resetForm();
    }
    setEventoModalVisible(true);
  };

  const guardarEntrenamiento = async () => {
    if (!descripcion || !fechaHora || !lugar || !duracionMinutos) {
      Alert.alert("Error", "Por favor complete todos los campos");
      return;
    }

    const duracionNum = parseInt(duracionMinutos);
    if (isNaN(duracionNum) || duracionNum <= 0) {
      Alert.alert("Error", "La duración debe ser un número válido");
      return;
    }

    try {
      const entrenamientoData = {
        descripcion,
        fecha_hora: fechaHora,
        lugar,
        duracion_minutos: duracionNum,
        id_entrenador: user?.id // Usar el ID del usuario actual como entrenador
      };

      if (editingEntrenamiento) {
        const { error } = await supabase
          .from("Entrenamiento")
          .update(entrenamientoData)
          .eq('id_entrenamiento', editingEntrenamiento.id_entrenamiento);

        if (error) throw error;
        Alert.alert("Éxito", "Entrenamiento actualizado correctamente");
      } else {
        const { error } = await supabase
          .from("Entrenamiento")
          .insert(entrenamientoData);

        if (error) throw error;
        Alert.alert("Éxito", "Entrenamiento creado correctamente");
      }

      setEntrenamientoModalVisible(false);
      resetForm();
      cargarDatos();
    } catch (error) {
      console.error("Error guardando entrenamiento:", error);
      Alert.alert("Error", "No se pudo guardar el entrenamiento");
    }
  };

  const guardarEvento = async () => {
    if (!titulo || !tipoEvento || !fechaHora || !lugar) {
      Alert.alert("Error", "Por favor complete todos los campos");
      return;
    }

    try {
      const eventoData = {
        titulo,
        tipo_evento: tipoEvento,
        fecha_hora: fechaHora,
        ubicacion: lugar,
        id_organizador: user?.id // Usar el ID del usuario actual como organizador
      };

      if (editingEvento) {
        const { error } = await supabase
          .from("Evento")
          .update(eventoData)
          .eq('id_evento', editingEvento.id_evento);

        if (error) throw error;
        Alert.alert("Éxito", "Evento actualizado correctamente");
      } else {
        const { error } = await supabase
          .from("Evento")
          .insert(eventoData);

        if (error) throw error;
        Alert.alert("Éxito", "Evento creado correctamente");
      }

      setEventoModalVisible(false);
      resetForm();
      cargarDatos();
    } catch (error) {
      console.error("Error guardando evento:", error);
      Alert.alert("Error", "No se pudo guardar el evento");
    }
  };

  const eliminarEntrenamiento = async (id: string) => {
    Alert.alert(
      "Confirmar eliminación",
      "¿Está seguro de que desea eliminar este entrenamiento?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("Entrenamiento")
                .delete()
                .eq('id_entrenamiento', id);

              if (error) throw error;
              Alert.alert("Éxito", "Entrenamiento eliminado correctamente");
              cargarDatos();
            } catch (error) {
              console.error("Error eliminando entrenamiento:", error);
              Alert.alert("Error", "No se pudo eliminar el entrenamiento");
            }
          }
        }
      ]
    );
  };

  const eliminarEvento = async (id: string) => {
    Alert.alert(
      "Confirmar eliminación",
      "¿Está seguro de que desea eliminar este evento?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("Evento")
                .delete()
                .eq('id_evento', id);

              if (error) throw error;
              Alert.alert("Éxito", "Evento eliminado correctamente");
              cargarDatos();
            } catch (error) {
              console.error("Error eliminando evento:", error);
              Alert.alert("Error", "No se pudo eliminar el evento");
            }
          }
        }
      ]
    );
  };

  const formatearFecha = (fechaString: string) => {
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatearMonto = (monto: number) => {
    return `$${monto.toLocaleString("es-CL")}`;
  };

  if (loading) {
    return (
      <SafeLayout>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando datos...</Text>
        </View>
      </SafeLayout>
    );
  }

  return (
    <SafeLayout>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Ionicons name="football" size={28} color={colors.primary} />
            <View>
              <Text style={styles.title}>Entrenamientos y Eventos</Text>
              <Text style={styles.subtitle}>
                Gestiona todos los entrenamientos y eventos del club
              </Text>
            </View>
          </View>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'entrenamientos' && styles.tabActive]}
            onPress={() => setActiveTab('entrenamientos')}
          >
            <Ionicons name="football" size={20} color={activeTab === 'entrenamientos' ? "#FFFFFF" : colors.primary} />
            <Text style={[styles.tabText, activeTab === 'entrenamientos' && styles.tabTextActive]}>
              Entrenamientos ({entrenamientos.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'eventos' && styles.tabActive]}
            onPress={() => setActiveTab('eventos')}
          >
            <Ionicons name="trophy" size={20} color={activeTab === 'eventos' ? "#FFFFFF" : colors.primary} />
            <Text style={[styles.tabText, activeTab === 'eventos' && styles.tabTextActive]}>
              Eventos ({eventos.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === 'entrenamientos' ? (
          <View style={styles.content}>
            {/* Filters */}
            <View style={styles.filtersContainer}>
              <View style={styles.filterRow}>
                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>Fecha</Text>
                  <TextInput
                    style={styles.filterInput}
                    value={filtroFecha}
                    onChangeText={setFiltroFecha}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>Lugar</Text>
                  <TextInput
                    style={styles.filterInput}
                    value={filtroLugar}
                    onChangeText={setFiltroLugar}
                    placeholder="Buscar por lugar..."
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
              <View style={styles.filterActions}>
                <TouchableOpacity
                  style={styles.filterButton}
                  onPress={aplicarFiltros}
                >
                  <Ionicons name="search" size={16} color="#FFFFFF" />
                  <Text style={styles.filterButtonText}>Filtrar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={limpiarFiltros}
                >
                  <Ionicons name="close" size={16} color="#6B7280" />
                  <Text style={styles.clearButtonText}>Limpiar</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="football" size={20} color="#8B5CF6" />
                <Text style={styles.sectionTitle}>Entrenamientos</Text>
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => abrirModalEntrenamiento()}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {entrenamientos.map((entrenamiento) => (
              <View key={entrenamiento.id_entrenamiento} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>Entrenamiento</Text>
                    <Text style={styles.itemSubtitle}>
                      {entrenamiento.entrenador ? `${entrenamiento.entrenador.nombre} ${entrenamiento.entrenador.apellido}` : 'Sin entrenador'}
                    </Text>
                  </View>
                  <View style={styles.itemActions}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => abrirModalEntrenamiento(entrenamiento)}
                    >
                      <Ionicons name="pencil" size={16} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => eliminarEntrenamiento(entrenamiento.id_entrenamiento)}
                    >
                      <Ionicons name="trash" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.itemDescription}>{entrenamiento.descripcion}</Text>

                <View style={styles.itemDetails}>
                  <View style={styles.detailItem}>
                    <Ionicons name="calendar" size={14} color="#6B7280" />
                    <Text style={styles.detailText}>{formatearFecha(entrenamiento.fecha_hora)}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="time" size={14} color="#6B7280" />
                    <Text style={styles.detailText}>
                      {entrenamiento.duracion_minutos} minutos
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="location" size={14} color="#6B7280" />
                    <Text style={styles.detailText}>{entrenamiento.lugar}</Text>
                  </View>
                </View>
              </View>
            ))}

            {hasMoreEntrenamientos && entrenamientos.length >= ITEMS_PER_PAGE && (
              <View style={styles.loadMoreContainer}>
                {loadingMore ? (
                  <View style={styles.loadingMoreContainer}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.loadingMoreText}>Cargando más...</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.loadMoreButton}
                    onPress={cargarMasEntrenamientos}
                  >
                    <Ionicons name="chevron-down" size={16} color="#FFFFFF" />
                    <Text style={styles.loadMoreButtonText}>Ver más</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {entrenamientos.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="football-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No hay entrenamientos</Text>
                <Text style={styles.emptyDescription}>
                  Crea tu primer entrenamiento para comenzar
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.content}>
            {/* Filters */}
            <View style={styles.filtersContainer}>
              <View style={styles.filterRow}>
                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>Fecha</Text>
                  <TextInput
                    style={styles.filterInput}
                    value={filtroFecha}
                    onChangeText={setFiltroFecha}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>Tipo</Text>
                  <TextInput
                    style={styles.filterInput}
                    value={filtroTipo}
                    onChangeText={setFiltroTipo}
                    placeholder="Buscar por tipo..."
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
              <View style={styles.filterRow}>
                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>Lugar</Text>
                  <TextInput
                    style={styles.filterInput}
                    value={filtroLugar}
                    onChangeText={setFiltroLugar}
                    placeholder="Buscar por lugar..."
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
              <View style={styles.filterActions}>
                <TouchableOpacity
                  style={styles.filterButton}
                  onPress={aplicarFiltros}
                >
                  <Ionicons name="search" size={16} color="#FFFFFF" />
                  <Text style={styles.filterButtonText}>Filtrar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={limpiarFiltros}
                >
                  <Ionicons name="close" size={16} color="#6B7280" />
                  <Text style={styles.clearButtonText}>Limpiar</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="trophy" size={20} color="#F59E0B" />
                <Text style={styles.sectionTitle}>Eventos</Text>
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => abrirModalEvento()}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {eventos.map((evento) => (
              <View key={evento.id_evento} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>{evento.titulo}</Text>
                    <Text style={styles.itemSubtitle}>{evento.tipo_evento}</Text>
                  </View>
                  <View style={styles.itemActions}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => abrirModalEvento(evento)}
                    >
                      <Ionicons name="pencil" size={16} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => eliminarEvento(evento.id_evento)}
                    >
                      <Ionicons name="trash" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.itemDetails}>
                  <View style={styles.detailItem}>
                    <Ionicons name="calendar" size={14} color="#6B7280" />
                    <Text style={styles.detailText}>{formatearFecha(evento.fecha_hora)}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="location" size={14} color="#6B7280" />
                    <Text style={styles.detailText}>{evento.ubicacion}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="person" size={14} color="#6B7280" />
                    <Text style={styles.detailText}>
                      {evento.organizador ? `${evento.organizador.nombre} ${evento.organizador.apellido}` : 'Sin organizador'}
                    </Text>
                  </View>
                </View>
              </View>
            ))}

            {hasMoreEventos && eventos.length >= ITEMS_PER_PAGE && (
              <View style={styles.loadMoreContainer}>
                {loadingMore ? (
                  <View style={styles.loadingMoreContainer}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.loadingMoreText}>Cargando más...</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.loadMoreButton}
                    onPress={cargarMasEventos}
                  >
                    <Ionicons name="chevron-down" size={16} color="#FFFFFF" />
                    <Text style={styles.loadMoreButtonText}>Ver más</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {eventos.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="trophy-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No hay eventos</Text>
                <Text style={styles.emptyDescription}>
                  Crea tu primer evento para comenzar
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Modal Entrenamiento */}
      <Modal
        visible={entrenamientoModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEntrenamientoModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingEntrenamiento ? 'Editar Entrenamiento' : 'Nuevo Entrenamiento'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setEntrenamientoModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.form}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Descripción</Text>
                  <TextInput
                    style={styles.textArea}
                    value={descripcion}
                    onChangeText={setDescripcion}
                    placeholder="Describe el entrenamiento..."
                    multiline
                    numberOfLines={3}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.formLabel}>Fecha y Hora</Text>
                    <TextInput
                      style={styles.input}
                      value={fechaHora}
                      onChangeText={setFechaHora}
                      placeholder="YYYY-MM-DD HH:MM:SS"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.formLabel}>Duración (minutos)</Text>
                    <TextInput
                      style={styles.input}
                      value={duracionMinutos}
                      onChangeText={setDuracionMinutos}
                      placeholder="90"
                      keyboardType="numeric"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Lugar</Text>
                  <TextInput
                    style={styles.input}
                    value={lugar}
                    onChangeText={setLugar}
                    placeholder="Ej: Cancha principal"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={guardarEntrenamiento}
                >
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>
                    {editingEntrenamiento ? 'Actualizar' : 'Crear'} Entrenamiento
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Evento */}
      <Modal
        visible={eventoModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEventoModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingEvento ? 'Editar Evento' : 'Nuevo Evento'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setEventoModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.form}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Título</Text>
                  <TextInput
                    style={styles.input}
                    value={titulo}
                    onChangeText={setTitulo}
                    placeholder="Ej: Torneo Intercolegial"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Tipo de Evento</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tiposContainer}>
                    {tiposEvento.map((tipoOption) => (
                      <TouchableOpacity
                        key={tipoOption}
                        style={[styles.tipoOption, tipoEvento === tipoOption && styles.tipoOptionSelected]}
                        onPress={() => setTipoEvento(tipoOption)}
                      >
                        <Text style={[styles.tipoOptionText, tipoEvento === tipoOption && styles.tipoOptionTextSelected]}>
                          {tipoOption}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.formLabel}>Fecha y Hora</Text>
                    <TextInput
                      style={styles.input}
                      value={fechaHora}
                      onChangeText={setFechaHora}
                      placeholder="YYYY-MM-DD HH:MM:SS"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.formLabel}>Ubicación</Text>
                    <TextInput
                      style={styles.input}
                      value={lugar}
                      onChangeText={setLugar}
                      placeholder="Ej: Estadio Municipal"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={guardarEvento}
                >
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>
                    {editingEvento ? 'Actualizar' : 'Crear'} Evento
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
  },
  header: {
    padding: 20,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
  },
  stats: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  jugadoresSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 16,
  },
  jugadorCard: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  jugadorInfo: {
    flex: 1,
  },
  jugadorName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  jugadorEmail: {
    fontSize: 14,
    color: "#6B7280",
  },
  montoBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  montoText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    color: "#374151",
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  actions: {
    padding: 20,
    paddingBottom: 40,
  },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  // New styles for EntrenamientosEventosScreen
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    marginHorizontal: 4,
    gap: 8,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  itemCard: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  itemActions: {
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    padding: 8,
    backgroundColor: "#EEF2FF",
    borderRadius: 8,
  },
  deleteButton: {
    padding: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
  },
  itemDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 12,
  },
  itemDetails: {
    gap: 8,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 12,
    color: "#6B7280",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    minHeight: "80%",
  },
  modalHeader: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
  },
  modalBody: {
    flex: 1,
    padding: 24,
  },
  form: {
    flex: 1,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: "#1F2937",
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: "#1F2937",
    textAlignVertical: "top",
    minHeight: 80,
  },
  tiposContainer: {
    flexDirection: "row",
  },
  tipoOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    marginRight: 8,
  },
  tipoOptionSelected: {
    backgroundColor: colors.primary,
  },
  tipoOptionText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  tipoOptionTextSelected: {
    color: "#FFFFFF",
  },
  formRow: {
    flexDirection: "row",
    gap: 8,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 20,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  closeButton: {
    position: "absolute",
    top: 24,
    right: 24,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  // Filter styles
  filtersContainer: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  filterGroup: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#1F2937",
    backgroundColor: "#FFFFFF",
  },
  filterActions: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "flex-end",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  filterButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  clearButtonText: {
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "600",
  },
  // Load more styles
  loadMoreContainer: {
    alignItems: "center",
    padding: 20,
  },
  loadMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  loadMoreButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  loadingMoreContainer: {
    alignItems: "center",
    padding: 16,
  },
  loadingMoreText: {
    color: "#6B7280",
    fontSize: 14,
    marginTop: 8,
  },
});
