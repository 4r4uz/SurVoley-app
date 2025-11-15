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
  TextInput,
  Modal,
} from "react-native";
import { useAuth } from "../../core/auth/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../core/supabase/supabaseClient";
import SafeLayout from "../../shared/components/SafeLayout";
import AdminFormModal, { FormSection } from "../../shared/components/AdminFormModal";
import { colors } from "../../shared/constants/theme";

const { width } = Dimensions.get("window");

interface Entrenamiento {
  id_entrenamiento: string;
  fecha_hora: string;
  lugar: string;
  descripcion: string;
  duracion_minutos: number;
  entrenador?: {
    usuarios?: {
      nombre: string;
      apellido: string;
    };
  };
}

interface Evento {
  id_evento: string;
  titulo: string;
  tipo_evento: string;
  fecha_hora: string;
  ubicacion: string;
  organizador?: {
    usuarios?: {
      nombre: string;
      apellido: string;
    };
  };
}

interface Asistencia {
  id_asistencia: string;
  id_jugador: string;
  id_entrenamiento?: string;
  id_evento?: string;
  fecha_asistencia: string;
  estado_asistencia: string;
  observaciones: string | null;
  created_at: string;
  jugador?: {
    usuarios?: {
      nombre: string;
      apellido: string;
      correo: string;
    };
  };
}

interface Actividad {
  id: string;
  tipo: 'entrenamiento' | 'evento';
  titulo: string;
  fecha_hora: string;
  ubicacion: string;
  descripcion?: string;
  duracion_minutos?: number;
  organizador?: string;
  asistencias: Asistencia[];
  estado: 'pasado' | 'en_curso' | 'futuro';
}

export default function GestionAsistenciasScreen() {
  const { user } = useAuth();
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [jugadores, setJugadores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [selectedTipo, setSelectedTipo] = useState<string>("todos");

  // Estado para el modal de asistencia
  const [modalVisible, setModalVisible] = useState(false);
  const [actividadSeleccionada, setActividadSeleccionada] = useState<Actividad | null>(null);
  const [asistenciasModal, setAsistenciasModal] = useState<any[]>([]);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      // Cargar entrenamientos y eventos
      const [entrenamientosRes, eventosRes, jugadoresRes] = await Promise.all([
        supabase.from("Entrenamiento").select(`
          *,
          entrenador:Usuarios (
            nombre,
            apellido
          )
        `).order("fecha_hora", { ascending: false }),
        supabase.from("Evento").select(`
          *,
          organizador:Usuarios (
            nombre,
            apellido
          )
        `).order("fecha_hora", { ascending: false }),
        supabase.from("Jugador").select(`
          id_jugador,
          usuarios:Usuarios (
            nombre,
            apellido,
            correo
          )
        `).order("created_at", { ascending: false })
      ]);

      if (entrenamientosRes.error) throw entrenamientosRes.error;
      if (eventosRes.error) throw eventosRes.error;
      if (jugadoresRes.error) throw jugadoresRes.error;

      const entrenamientos = entrenamientosRes.data || [];
      const eventos = eventosRes.data || [];
      setJugadores(jugadoresRes.data || []);

      // Combinar entrenamientos y eventos en actividades
      const actividadesData: Actividad[] = [
        ...entrenamientos.map(ent => ({
          id: ent.id_entrenamiento,
          tipo: 'entrenamiento' as const,
          titulo: ent.descripcion,
          fecha_hora: ent.fecha_hora,
          ubicacion: ent.lugar,
          descripcion: ent.descripcion,
          duracion_minutos: ent.duracion_minutos,
          organizador: ent.entrenador?.nombre ? `${ent.entrenador.nombre} ${ent.entrenador.apellido}` : undefined,
          asistencias: [],
          estado: determinarEstadoActividad(ent.fecha_hora, ent.duracion_minutos),
        })),
        ...eventos.map(evt => ({
          id: evt.id_evento,
          tipo: 'evento' as const,
          titulo: evt.titulo,
          fecha_hora: evt.fecha_hora,
          ubicacion: evt.ubicacion,
          descripcion: `${evt.tipo_evento} - ${evt.titulo}`,
          organizador: evt.organizador?.nombre ? `${evt.organizador.nombre} ${evt.organizador.apellido}` : undefined,
          asistencias: [],
          estado: determinarEstadoActividad(evt.fecha_hora),
        }))
      ];

      // Cargar asistencias para cada actividad
      for (const actividad of actividadesData) {
        const asistenciasRes = await supabase
          .from("Asistencia")
          .select(`
            *,
            jugador:Jugador (
              usuarios:Usuarios (
                nombre,
                apellido,
                correo
              )
            )
          `)
          .eq(actividad.tipo === 'entrenamiento' ? 'id_entrenamiento' : 'id_evento', actividad.id);

        if (!asistenciasRes.error) {
          actividad.asistencias = asistenciasRes.data || [];
        }
      }

      setActividades(actividadesData);
    } catch (error) {
      console.error("Error cargando datos:", error);
      Alert.alert("Error", "No se pudieron cargar las actividades");
    } finally {
      setLoading(false);
    }
  };

  const determinarEstadoActividad = (fechaHora: string, duracionMinutos?: number): 'pasado' | 'en_curso' | 'futuro' => {
    const ahora = new Date();
    const fechaActividad = new Date(fechaHora);

    if (fechaActividad < ahora) {
      // Si tiene duración, verificar si está en curso
      if (duracionMinutos) {
        const fechaFin = new Date(fechaActividad.getTime() + duracionMinutos * 60000);
        if (ahora <= fechaFin) {
          return 'en_curso';
        }
      }
      return 'pasado';
    }
    return 'futuro';
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const actividadesFiltradas = actividades.filter((actividad) => {
    const matchesSearch = actividad.titulo.toLowerCase().includes(searchText.toLowerCase()) ||
                         actividad.descripcion?.toLowerCase().includes(searchText.toLowerCase()) ||
                         actividad.organizador?.toLowerCase().includes(searchText.toLowerCase());

    const matchesTipo = selectedTipo === "todos" || actividad.tipo === selectedTipo;

    return matchesSearch && matchesTipo;
  });

  const abrirModalAsistencia = (actividad: Actividad) => {
    setActividadSeleccionada(actividad);

    // Preparar datos para el modal
    const asistenciasData = jugadores.map(jugador => {
      const asistenciaExistente = actividad.asistencias.find(a => a.id_jugador === jugador.id_jugador);
      return {
        id_jugador: jugador.id_jugador,
        nombre: `${jugador.usuarios.nombre} ${jugador.usuarios.apellido}`,
        estado_actual: asistenciaExistente?.estado_asistencia || "Sin registro",
        estado_nuevo: asistenciaExistente?.estado_asistencia || "Sin registro",
      };
    });

    setAsistenciasModal(asistenciasData);
    setModalVisible(true);
  };

  const cerrarModalAsistencia = () => {
    setModalVisible(false);
    setActividadSeleccionada(null);
    setAsistenciasModal([]);
  };

  const cambiarEstadoEnModal = (jugadorId: string, nuevoEstado: string) => {
    setAsistenciasModal(prev =>
      prev.map(asistencia =>
        asistencia.id_jugador === jugadorId
          ? {
              ...asistencia,
              estado_nuevo: asistencia.estado_nuevo === nuevoEstado ? "Sin registro" : nuevoEstado
            }
          : asistencia
      )
    );
  };

  const guardarAsistenciasModal = async () => {
    if (!actividadSeleccionada) return;

    try {
      const cambios = asistenciasModal.filter(a => a.estado_actual !== a.estado_nuevo);

      for (const cambio of cambios) {
        await cambiarEstadoAsistencia(actividadSeleccionada, cambio.id_jugador, cambio.estado_nuevo);
      }

      Alert.alert("Éxito", "Asistencias guardadas correctamente");
      cerrarModalAsistencia();
    } catch (error) {
      Alert.alert("Error", "No se pudieron guardar las asistencias");
    }
  };

  // Render personalizado para el modal de asistencia
  const renderModalAsistencia = () => {
    if (!actividadSeleccionada) return null;

    return (
      <View style={styles.attendanceModalContent}>
        <ScrollView style={styles.playersScrollView} showsVerticalScrollIndicator={false}>
          {asistenciasModal.map((asistencia) => (
            <View key={asistencia.id_jugador} style={styles.playerAttendanceRow}>
              <View style={styles.playerInfoSection}>
                <View style={styles.playerAvatar}>
                  <Text style={styles.avatarText}>
                    {asistencia.nombre.split(' ').map((n: string) => n.charAt(0)).join('').toUpperCase()}
                  </Text>
                </View>
                <View style={styles.playerDetails}>
                  <Text style={styles.playerNameText}>{asistencia.nombre}</Text>
                  <View style={[styles.currentStatusBadge, {
                    backgroundColor: getEstadoColor(asistencia.estado_actual)
                  }]}>
                    <Ionicons
                      name={getEstadoIcon(asistencia.estado_actual) as any}
                      size={12}
                      color="#FFFFFF"
                    />
                    <Text style={styles.currentStatusText}>
                      {asistencia.estado_actual === "Sin registro" ? "Sin registro" : asistencia.estado_actual}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.playerActionsSection}>
                <TouchableOpacity
                  style={[
                    styles.quickActionButton,
                    asistencia.estado_nuevo === "Presente" ? styles.presentAction : styles.inactiveAction
                  ]}
                  onPress={() => cambiarEstadoEnModal(asistencia.id_jugador, "Presente")}
                >
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.quickActionButton,
                    asistencia.estado_nuevo === "Ausente" ? styles.absentAction : styles.inactiveAction
                  ]}
                  onPress={() => cambiarEstadoEnModal(asistencia.id_jugador, "Ausente")}
                >
                  <Ionicons name="close" size={16} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.quickActionButton,
                    asistencia.estado_nuevo === "Justificado" ? styles.justifiedAction : styles.inactiveAction
                  ]}
                  onPress={() => cambiarEstadoEnModal(asistencia.id_jugador, "Justificado")}
                >
                  <Ionicons name="alert-circle" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const cambiarEstadoAsistencia = async (actividad: Actividad, jugadorId: string, nuevoEstado: string) => {
    try {
      // Buscar asistencia existente
      const asistenciaExistente = actividad.asistencias.find(a => a.id_jugador === jugadorId);

      if (asistenciaExistente) {
        // Actualizar asistencia existente
        const { error } = await supabase
          .from("Asistencia")
          .update({
            estado_asistencia: nuevoEstado,
            fecha_asistencia: new Date().toISOString().split('T')[0]
          })
          .eq("id_asistencia", asistenciaExistente.id_asistencia);

        if (error) throw error;
      } else {
        // Crear nueva asistencia
        const { error } = await supabase
          .from("Asistencia")
          .insert([{
            id_jugador: jugadorId,
            [actividad.tipo === 'entrenamiento' ? 'id_entrenamiento' : 'id_evento']: actividad.id,
            fecha_asistencia: new Date().toISOString().split('T')[0],
            estado_asistencia: nuevoEstado,
          }]);

        if (error) throw error;
      }

      // Recargar datos silenciosamente
      await cargarDatos();
    } catch (error) {
      console.error("Error cambiando asistencia:", error);
      Alert.alert("Error", "No se pudo actualizar la asistencia");
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "Presente": return "#10B981";
      case "Ausente": return "#EF4444";
      case "Justificado": return "#F59E0B";
      case "Sin registro": return "#6B7280";
      default: return "#6B7280";
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case "Presente": return "checkmark-circle";
      case "Ausente": return "close-circle";
      case "Justificado": return "alert-circle";
      case "Sin registro": return "help-circle";
      default: return "help-circle";
    }
  };

  const getEstadoActividadColor = (estado: 'pasado' | 'en_curso' | 'futuro') => {
    switch (estado) {
      case "pasado": return "#6B7280";
      case "en_curso": return "#F59E0B";
      case "futuro": return "#10B981";
      default: return "#6B7280";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calcularEstadisticas = () => {
    const actividadesEnCurso = actividades.filter(a => a.estado === 'en_curso').length;
    const actividadesFuturas = actividades.filter(a => a.estado === 'futuro').length;
    const actividadesPasadas = actividades.filter(a => a.estado === 'pasado').length;

    return { actividadesEnCurso, actividadesFuturas, actividadesPasadas };
  };

  const estadisticas = calcularEstadisticas();

  // Separar actividades por estado
  const actividadesEnCursoYFuturas = actividades
    .filter(a => a.estado === 'en_curso' || a.estado === 'futuro')
    .sort((a, b) => {
      // En curso primero, luego futuras ordenadas por fecha
      if (a.estado === 'en_curso' && b.estado !== 'en_curso') return -1;
      if (a.estado !== 'en_curso' && b.estado === 'en_curso') return 1;
      return new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime();
    });

  const actividadesPasadas = actividades
    .filter(a => a.estado === 'pasado')
    .sort((a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime()); // Más recientes primero

  if (loading) {
    return (
      <SafeLayout>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando actividades...</Text>
        </View>
      </SafeLayout>
    );
  }

  return (
    <SafeLayout>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Ionicons name="calendar" size={28} color="#10B981" />
              <View>
                <Text style={styles.title}>Control de Asistencias</Text>
                <Text style={styles.subtitle}>
                  Gestiona la asistencia por actividades y eventos
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Stats - Más simples y claros */}
          <View style={styles.simpleStats}>
            <View style={styles.statRow}>
              <View style={[styles.simpleStatCard, styles.statActive]}>
                <Ionicons name="play-circle" size={24} color="#FFFFFF" />
                <Text style={styles.simpleStatNumber}>{estadisticas.actividadesEnCurso}</Text>
                <Text style={styles.simpleStatLabel}>ACTIVAS</Text>
              </View>
              <View style={[styles.simpleStatCard, styles.statUpcoming]}>
                <Ionicons name="calendar" size={24} color="#FFFFFF" />
                <Text style={styles.simpleStatNumber}>{estadisticas.actividadesFuturas}</Text>
                <Text style={styles.simpleStatLabel}>PRÓXIMAS</Text>
              </View>
            </View>
            <View style={[styles.simpleStatCard, styles.statCompleted]}>
              <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
              <Text style={styles.simpleStatNumber}>{estadisticas.actividadesPasadas}</Text>
              <Text style={styles.simpleStatLabel}>COMPLETADAS</Text>
            </View>
          </View>
        </View>

        {/* Filters Section */}
        <View style={styles.filtersSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por actividad o entrenador..."
              value={searchText}
              onChangeText={setSearchText}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText("")}>
                <Ionicons name="close-circle" size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.typeFiltersContainer}>
            <Text style={styles.filterTitle}>Filtrar por tipo:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeFilters}>
              <TouchableOpacity
                style={[styles.typeFilter, selectedTipo === "todos" && styles.typeFilterActive]}
                onPress={() => setSelectedTipo("todos")}
              >
                <Ionicons name="apps" size={16} color={selectedTipo === "todos" ? "#FFFFFF" : "#6B7280"} />
                <Text style={[styles.typeFilterText, selectedTipo === "todos" && styles.typeFilterTextActive]}>
                  Todas
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeFilter, selectedTipo === "entrenamiento" && styles.typeFilterActive]}
                onPress={() => setSelectedTipo("entrenamiento")}
              >
                <Ionicons name="basketball" size={16} color={selectedTipo === "entrenamiento" ? "#FFFFFF" : "#6B7280"} />
                <Text style={[styles.typeFilterText, selectedTipo === "entrenamiento" && styles.typeFilterTextActive]}>
                  Entrenamientos
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeFilter, selectedTipo === "evento" && styles.typeFilterActive]}
                onPress={() => setSelectedTipo("evento")}
              >
                <Ionicons name="trophy" size={16} color={selectedTipo === "evento" ? "#FFFFFF" : "#6B7280"} />
                <Text style={[styles.typeFilterText, selectedTipo === "evento" && styles.typeFilterTextActive]}>
                  Eventos
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>

        {/* Activities List */}
        <View style={styles.activitiesSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="list" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>
                Actividades
              </Text>
            </View>
            <TouchableOpacity style={styles.refreshButton} onPress={cargarDatos}>
              <Ionicons name="refresh" size={18} color="#FFFFFF" />
              <Text style={styles.refreshButtonText}>Actualizar</Text>
            </TouchableOpacity>
          </View>

          {/* Sección Futuras/En Curso */}
          {actividadesEnCursoYFuturas.length > 0 && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="time" size={18} color={colors.primary} />
                <Text style={styles.sectionTitleText}>
                  Próximas y En Curso ({actividadesEnCursoYFuturas.length})
                </Text>
              </View>
              {actividadesEnCursoYFuturas.map((actividad) => (
                <View key={actividad.id}>
                  <TouchableOpacity
                    style={styles.activityCard}
                    onPress={() => abrirModalAsistencia(actividad)}
                  >
                    <View style={styles.activityHeader}>
                      <View style={styles.activityInfo}>
                        <Text style={styles.activityTitle}>{actividad.titulo}</Text>
                        <Text style={styles.activitySubtitle}>
                          {actividad.organizador ? `Por ${actividad.organizador}` : ''}
                        </Text>
                      </View>
                      <View style={styles.activityMeta}>
                        <View style={[styles.statusBadge, {
                          backgroundColor: getEstadoActividadColor(actividad.estado)
                        }]}>
                          <Text style={styles.statusText}>
                            {actividad.estado === 'en_curso' ? 'En Curso' : 'Próxima'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.activityDetails}>
                      <View style={styles.detailRow}>
                        <Ionicons name="calendar" size={16} color="#6B7280" />
                        <Text style={styles.detailText}>{formatDate(actividad.fecha_hora)}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Ionicons name="location" size={16} color="#6B7280" />
                        <Text style={styles.detailText}>{actividad.ubicacion}</Text>
                      </View>
                      {actividad.duracion_minutos && (
                        <View style={styles.detailRow}>
                          <Ionicons name="time" size={16} color="#6B7280" />
                          <Text style={styles.detailText}>{actividad.duracion_minutos} minutos</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Sección Pasadas */}
          {actividadesPasadas.length > 0 && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="checkmark-done" size={18} color="#6B7280" />
                <Text style={styles.sectionTitleText}>
                  Pasadas ({actividadesPasadas.length})
                </Text>
              </View>
              {actividadesPasadas.map((actividad) => (
                <View key={actividad.id}>
                  <TouchableOpacity
                    style={styles.activityCard}
                    onPress={() => abrirModalAsistencia(actividad)}
                  >
                    <View style={styles.activityHeader}>
                      <View style={styles.activityInfo}>
                        <Text style={styles.activityTitle}>{actividad.titulo}</Text>
                        <Text style={styles.activitySubtitle}>
                          {actividad.organizador ? `Por ${actividad.organizador}` : ''}
                        </Text>
                      </View>
                      <View style={styles.activityMeta}>
                        <View style={[styles.statusBadge, {
                          backgroundColor: getEstadoActividadColor(actividad.estado)
                        }]}>
                          <Text style={styles.statusText}>Pasada</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.activityDetails}>
                      <View style={styles.detailRow}>
                        <Ionicons name="calendar" size={16} color="#6B7280" />
                        <Text style={styles.detailText}>{formatDate(actividad.fecha_hora)}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Ionicons name="location" size={16} color="#6B7280" />
                        <Text style={styles.detailText}>{actividad.ubicacion}</Text>
                      </View>
                      {actividad.duracion_minutos && (
                        <View style={styles.detailRow}>
                          <Ionicons name="time" size={16} color="#6B7280" />
                          <Text style={styles.detailText}>{actividad.duracion_minutos} minutos</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {actividadesEnCursoYFuturas.length === 0 && actividadesPasadas.length === 0 && (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
              </View>
              <Text style={styles.emptyTitle}>No hay actividades</Text>
              <Text style={styles.emptyDescription}>
                No se encontraron actividades con los filtros aplicados
              </Text>
            </View>
          )}
        </View>

        {/* Modal de Asistencia */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={cerrarModalAsistencia}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                {/* Header */}
                <View style={styles.modalHeader}>
                  <View style={styles.modalTitleContainer}>
                    <View>
                      <Text style={styles.modalTitle}>
                        Control de Asistencia
                      </Text>
                      <Text style={styles.modalSubtitle}>
                        {actividadSeleccionada?.titulo || ''}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={cerrarModalAsistencia}
                  >
                    <Ionicons name="close" size={24} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                {/* Content */}
                {renderModalAsistencia()}

                {/* Footer */}
                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={cerrarModalAsistencia}
                  >
                    <Ionicons name="close" size={18} color="#6B7280" />
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveButton]}
                    onPress={guardarAsistenciasModal}
                  >
                    <Ionicons name="save" size={18} color="#FFFFFF" />
                    <Text style={styles.saveButtonText}>Guardar Asistencias</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
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
  // Header Section
  headerSection: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  header: {
    padding: 20,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1F2937",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
  },
  quickStats: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  statPresent: {
    borderLeftWidth: 4,
    borderLeftColor: "#10B981",
  },
  statAbsent: {
    borderLeftWidth: 4,
    borderLeftColor: "#EF4444",
  },
  statJustified: {
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
  },
  statPast: {
    borderLeftWidth: 4,
    borderLeftColor: "#6B7280",
  },
  statCurrent: {
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
  },
  statFuture: {
    borderLeftWidth: 4,
    borderLeftColor: "#10B981",
  },
  quickStatNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  // Filters Section
  filtersSection: {
    padding: 20,
    backgroundColor: "#F8FAFC",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#1F2937",
  },
  statusFiltersContainer: {
    marginBottom: 8,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  statusFilters: {
    flexDirection: "row",
  },
  statusFilter: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 6,
  },
  statusFilterActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusFilterText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  statusFilterTextActive: {
    color: "#FFFFFF",
  },
  // Attendance Section
  attendanceSection: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  headerActions: {
    flexDirection: "row",
    gap: 12,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  refreshButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  // Attendance Cards
  attendanceCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  attendanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  playerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 2,
  },
  playerEmail: {
    fontSize: 14,
    color: "#6B7280",
  },
  attendanceActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  presentButton: {
    backgroundColor: "#10B981",
  },
  absentButton: {
    backgroundColor: "#EF4444",
  },
  noteButton: {
    backgroundColor: "#6B7280",
  },
  attendanceContent: {
    marginBottom: 12,
  },
  sessionInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  sessionText: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "600",
  },
  dateInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: "#6B7280",
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  locationText: {
    fontSize: 12,
    color: "#6B7280",
  },
  attendanceFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  noteBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    gap: 6,
    maxWidth: 200,
  },
  noteText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  // Empty State
  emptyContainer: {
    alignItems: "center",
    padding: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    color: "#374151",
    fontWeight: "600",
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  // New Activity Styles
  typeFiltersContainer: {
    marginBottom: 8,
  },
  typeFilters: {
    flexDirection: "row",
  },
  typeFilter: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 6,
  },
  typeFilterActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeFilterText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  typeFilterTextActive: {
    color: "#FFFFFF",
  },
  activitiesSection: {
    flex: 1,
    padding: 20,
  },
  activityCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  activityHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  activityIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 14,
    color: "#6B7280",
  },
  activityMeta: {
    alignItems: "flex-end",
    gap: 8,
  },
  activityDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: "#6B7280",
  },
  playersList: {
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  playersTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  playerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#6B7280",
  },
  statusButtonActive: {
    backgroundColor: "#10B981",
  },
  absentBtn: {
    backgroundColor: "#EF4444",
  },
  justifiedBtn: {
    backgroundColor: "#F59E0B",
  },
  currentStatus: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  currentStatusText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  // Simple Stats Styles - Más compactos y menos invasivos
  simpleStats: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  statRow: {
    flexDirection: "row",
    gap: 8,
  },
  simpleStatCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  statActive: {
    backgroundColor: "#FEF3C7",
    borderColor: "#F59E0B",
  },
  statUpcoming: {
    backgroundColor: "#DBF4FF",
    borderColor: "#0EA5E9",
  },
  statCompleted: {
    backgroundColor: "#D1FAE5",
    borderColor: "#10B981",
    width: "100%",
  },
  simpleStatNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1F2937",
    marginTop: 4,
    marginBottom: 2,
  },
  simpleStatLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  // Section Styles
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  // Big Action Button Styles - Para usuarios nuevos
  bigActionButton: {
    backgroundColor: "#F59E0B",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonActive: {
    backgroundColor: "#10B981",
    shadowColor: "#10B981",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 80,
    alignItems: "center",
  },
  statusIndicatorText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "95%",
    minHeight: "90%",
  },
  modalHeader: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
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
  modalFooter: {
    flexDirection: "row",
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: 12,
    backgroundColor: "#FFFFFF",
  },
  cancelButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.primary,
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  // Attendance Modal Content Styles
  attendanceModalContent: {
    flex: 1,
    padding: 24,
  },
  playersScrollView: {
    flex: 1,
  },
  playerAttendanceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  playerInfoSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  playerDetails: {
    flex: 1,
  },
  playerNameText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  currentStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    gap: 4,
  },
  playerActionsSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  quickActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  presentAction: {
    backgroundColor: "#10B981",
  },
  absentAction: {
    backgroundColor: "#EF4444",
  },
  justifiedAction: {
    backgroundColor: "#F59E0B",
  },
  inactiveAction: {
    backgroundColor: "#F3F4F6",
  },
});
