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
  FlatList,
} from "react-native";
import { useAuth } from "../../core/auth/AuthContext";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../core/supabase/supabaseClient";
import SafeLayout from "../../shared/components/SafeLayout";
import UserHeader from "../../shared/components/UserHeader";
import { colors } from "../../shared/constants/theme";

const { width } = Dimensions.get("window");

interface Asistencia {
  id_asistencia: string;
  id_jugador: string;
  id_entrenamiento: string;
  fecha_asistencia: string;
  estado_asistencia: string;
  observaciones: string | null;
  jugador?: {
    nombre: string;
    apellido: string;
    correo: string;
  };
  entrenamiento?: {
    fecha_hora: string;
    lugar: string;
    descripcion: string;
  };
}

interface Entrenamiento {
  id_entrenamiento: string;
  fecha_hora: string;
  lugar: string;
  descripcion: string;
}

export default function EntrenadorAsistenciaScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [entrenamientos, setEntrenamientos] = useState<Entrenamiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntrenamiento, setSelectedEntrenamiento] = useState<string>("todos");

  const cargarDatos = async () => {
    try {
      setLoading(true);

      // Cargar entrenamientos del entrenador
      const { data: entrenamientosData, error: errorEntrenamientos } = await supabase
        .from("Entrenamiento")
        .select("*")
        .order("fecha_hora", { ascending: false });

      if (errorEntrenamientos) throw errorEntrenamientos;
      setEntrenamientos(entrenamientosData || []);

      // Cargar asistencias con datos relacionados
      const { data: asistenciasData, error: errorAsistencias } = await supabase
        .from("Asistencia")
        .select(`
          *,
          jugador:Usuarios!Asistencia_id_jugador_fkey (
            nombre,
            apellido,
            correo
          ),
          entrenamiento:Entrenamiento!Asistencia_id_entrenamiento_fkey (
            fecha_hora,
            lugar,
            descripcion
          )
        `)
        .order("fecha_asistencia", { ascending: false });

      if (errorAsistencias) throw errorAsistencias;
      setAsistencias(asistenciasData || []);
    } catch (error) {
      console.error("Error cargando datos:", error);
      Alert.alert("Error", "No se pudieron cargar las asistencias");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const asistenciasFiltradas = asistencias.filter((asistencia) => {
    const matchesEntrenamiento =
      selectedEntrenamiento === "todos" ||
      asistencia.id_entrenamiento === selectedEntrenamiento;

    return matchesEntrenamiento;
  });

  const toggleAsistencia = async (asistencia: Asistencia) => {
    try {
      const nuevoEstado = asistencia.estado_asistencia === "Presente" ? "Ausente" : "Presente";

      const { error } = await supabase
        .from("Asistencia")
        .update({
          estado_asistencia: nuevoEstado,
          observaciones: asistencia.observaciones
        })
        .eq("id_asistencia", asistencia.id_asistencia);

      if (error) throw error;

      Alert.alert("Éxito", `Asistencia marcada como ${nuevoEstado.toLowerCase()}`);
      cargarDatos();
    } catch (error) {
      console.error("Error cambiando asistencia:", error);
      Alert.alert("Error", "No se pudo cambiar la asistencia");
    }
  };

  const agregarObservacion = async (asistencia: Asistencia) => {
    Alert.prompt(
      "Agregar Observación",
      "Ingresa una observación para esta asistencia:",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Guardar",
          onPress: async (observacion?: string) => {
            try {
              const { error } = await supabase
                .from("Asistencia")
                .update({ observaciones: observacion || null })
                .eq("id_asistencia", asistencia.id_asistencia);

              if (error) throw error;
              Alert.alert("Éxito", "Observación guardada");
              cargarDatos();
            } catch (error) {
              console.error("Error guardando observación:", error);
              Alert.alert("Error", "No se pudo guardar la observación");
            }
          },
        },
      ],
      "plain-text",
      asistencia.observaciones || ""
    );
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "Presente": return "#059669";
      case "Ausente": return "#DC2626";
      case "Justificado": return "#D97706";
      default: return "#6B7280";
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case "Presente": return "checkmark-circle";
      case "Ausente": return "close-circle";
      case "Justificado": return "alert-circle";
      default: return "help-circle";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calcularEstadisticas = () => {
    const total = asistenciasFiltradas.length;
    const presentes = asistenciasFiltradas.filter(a => a.estado_asistencia === "Presente").length;
    const ausentes = asistenciasFiltradas.filter(a => a.estado_asistencia === "Ausente").length;
    const justificados = asistenciasFiltradas.filter(a => a.estado_asistencia === "Justificado").length;

    return { total, presentes, ausentes, justificados };
  };

  const estadisticas = calcularEstadisticas();

  const renderAsistencia = ({ item }: { item: Asistencia }) => (
    <View style={styles.asistenciaCard}>
      <View style={styles.asistenciaHeader}>
        <View style={styles.jugadorInfo}>
          <Text style={styles.jugadorName}>
            {item.jugador?.nombre} {item.jugador?.apellido}
          </Text>
          <Text style={styles.jugadorEmail}>{item.jugador?.correo}</Text>
        </View>
        <View style={styles.asistenciaActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => toggleAsistencia(item)}
          >
            <Ionicons
              name={item.estado_asistencia === "Presente" ? "close-circle" : "checkmark-circle"}
              size={16}
              color={item.estado_asistencia === "Presente" ? "#DC2626" : "#059669"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => agregarObservacion(item)}
          >
            <Ionicons name="chatbubble" size={16} color={colors.entrenador} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.asistenciaContent}>
        <View style={styles.entrenamientoInfo}>
          <Ionicons name="basketball" size={16} color="#6B7280" />
          <Text style={styles.entrenamientoText}>
            {item.entrenamiento?.descripcion || "Entrenamiento"}
          </Text>
        </View>
        <View style={styles.fechaInfo}>
          <Ionicons name="calendar" size={14} color="#6B7280" />
          <Text style={styles.fechaText}>
            {formatDate(item.fecha_asistencia)}
          </Text>
        </View>
        {item.entrenamiento?.lugar && (
          <View style={styles.lugarInfo}>
            <Ionicons name="location" size={14} color="#6B7280" />
            <Text style={styles.lugarText}>{item.entrenamiento.lugar}</Text>
          </View>
        )}
      </View>

      <View style={styles.asistenciaFooter}>
        <View style={[styles.estadoBadge, { backgroundColor: getEstadoColor(item.estado_asistencia) }]}>
          <Ionicons name={getEstadoIcon(item.estado_asistencia) as any} size={12} color="#FFFFFF" />
          <Text style={styles.estadoText}>{item.estado_asistencia}</Text>
        </View>
        {item.observaciones && (
          <View style={styles.observacionBadge}>
            <Ionicons name="chatbubble" size={12} color="#6B7280" />
            <Text style={styles.observacionText} numberOfLines={1}>
              {item.observaciones}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeLayout>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.entrenador} />
          <Text style={styles.loadingText}>Cargando asistencias...</Text>
        </View>
      </SafeLayout>
    );
  }

  return (
    <SafeLayout>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <UserHeader
          user={user}
          greeting="Control de Asistencias"
          avatarColor={colors.entrenador}
          roleText="Entrenador"
        />

        <View style={styles.filters}>
          <View style={styles.filterContainer}>
            <Text style={styles.filterLabel}>Filtrar por entrenamiento:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.entrenamientosScroll}>
              <TouchableOpacity
                style={[styles.entrenamientoChip, selectedEntrenamiento === "todos" && styles.entrenamientoChipActive]}
                onPress={() => setSelectedEntrenamiento("todos")}
              >
                <Text style={[styles.entrenamientoChipText, selectedEntrenamiento === "todos" && styles.entrenamientoChipTextActive]}>
                  Todos
                </Text>
              </TouchableOpacity>
              {entrenamientos.slice(0, 5).map((entrenamiento) => (
                <TouchableOpacity
                  key={entrenamiento.id_entrenamiento}
                  style={[styles.entrenamientoChip, selectedEntrenamiento === entrenamiento.id_entrenamiento && styles.entrenamientoChipActive]}
                  onPress={() => setSelectedEntrenamiento(entrenamiento.id_entrenamiento)}
                >
                  <Text style={[styles.entrenamientoChipText, selectedEntrenamiento === entrenamiento.id_entrenamiento && styles.entrenamientoChipTextActive]}>
                    {entrenamiento.descripcion.substring(0, 15)}...
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={styles.stats}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{estadisticas.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={[styles.statCard, styles.statPositive]}>
            <Text style={styles.statNumber}>{estadisticas.presentes}</Text>
            <Text style={styles.statLabel}>Presentes</Text>
          </View>
          <View style={[styles.statCard, styles.statWarning]}>
            <Text style={styles.statNumber}>{estadisticas.ausentes}</Text>
            <Text style={styles.statLabel}>Ausentes</Text>
          </View>
          <View style={[styles.statCard, styles.statInfo]}>
            <Text style={styles.statNumber}>{estadisticas.justificados}</Text>
            <Text style={styles.statLabel}>Justificados</Text>
          </View>
        </View>

        <View style={styles.asistenciasList}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Asistencias</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={cargarDatos}>
              <Ionicons name="refresh" size={16} color={colors.entrenador} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={asistenciasFiltradas}
            renderItem={renderAsistencia}
            keyExtractor={(item) => item.id_asistencia}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No hay asistencias</Text>
                <Text style={styles.emptyDescription}>
                  No se encontraron asistencias para el filtro seleccionado
                </Text>
              </View>
            }
          />
        </View>
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
  filters: {
    padding: 20,
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },
  entrenamientosScroll: {
    flexDirection: "row",
  },
  entrenamientoChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    marginRight: 8,
  },
  entrenamientoChipActive: {
    backgroundColor: colors.entrenador,
  },
  entrenamientoChipText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  entrenamientoChipTextActive: {
    color: "#FFFFFF",
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
  statPositive: {
    borderLeftWidth: 4,
    borderLeftColor: "#059669",
  },
  statWarning: {
    borderLeftWidth: 4,
    borderLeftColor: "#D97706",
  },
  statInfo: {
    borderLeftWidth: 4,
    borderLeftColor: "#7C3AED",
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
  asistenciasList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  refreshButton: {
    padding: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
  },
  asistenciaCard: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  asistenciaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
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
  asistenciaActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#F3F4F6",
  },
  asistenciaContent: {
    marginBottom: 12,
  },
  entrenamientoInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  entrenamientoText: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "600",
  },
  fechaInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  fechaText: {
    fontSize: 12,
    color: "#6B7280",
  },
  lugarInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  lugarText: {
    fontSize: 12,
    color: "#6B7280",
  },
  asistenciaFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  estadoBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  estadoText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  observacionBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    gap: 4,
    maxWidth: 200,
  },
  observacionText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
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
});
