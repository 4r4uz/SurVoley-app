import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  FlatList,
} from "react-native";
import { useAuth } from "../../core/auth/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../core/supabase/supabaseClient";
import SafeLayout from "../../shared/components/SafeLayout";
import UserHeader from "../../shared/components/UserHeader";
import { colors } from "../../shared/constants/theme";

const { width } = Dimensions.get("window");

interface Entrenamiento {
  id_entrenamiento: string;
  fecha_hora: string;
  lugar: string;
  descripcion: string;
}

interface Evento {
  id_evento: string;
  titulo: string;
  tipo_evento: string;
  fecha_hora: string;
  ubicacion: string;
  id_organizador: string;
}

interface Jugador {
  id_usuario: string;
  nombre: string;
  apellido: string;
  correo: string;
}

interface AsistenciaLive {
  id_usuario: string;
  nombre: string;
  apellido: string;
  estado: 'Presente' | 'Ausente' | null;
}

export default function EntrenadorAsistenciaScreen() {
  const { user } = useAuth();
  const [entrenamientos, setEntrenamientos] = useState<Entrenamiento[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [jugadores, setJugadores] = useState<AsistenciaLive[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<Entrenamiento | Evento | null>(null);
  const [sessionActive, setSessionActive] = useState(false);

  const cargarDatos = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Cargar entrenamientos del entrenador
      const { data: entrenamientosData, error: errorEntrenamientos } = await supabase
        .from("Entrenamiento")
        .select("*")
        .order("fecha_hora", { ascending: false });

      if (errorEntrenamientos) throw errorEntrenamientos;
      setEntrenamientos(entrenamientosData || []);

      // Cargar eventos del entrenador
      const { data: eventosData, error: errorEventos } = await supabase
        .from("Evento")
        .select("*")
        .order("fecha_hora", { ascending: false });

      if (errorEventos) throw errorEventos;
      setEventos(eventosData || []);

      // Cargar todos los jugadores
      const { data: jugadoresData, error: errorJugadores } = await supabase
        .from("Usuarios")
        .select("id_usuario, nombre, apellido, correo")
        .eq("rol", "jugador");

      if (errorJugadores) throw errorJugadores;

      // Initialize attendance status for each player
      const jugadoresConAsistencia: AsistenciaLive[] = (jugadoresData || []).map((jugador: Jugador) => ({
        id_usuario: jugador.id_usuario,
        nombre: jugador.nombre,
        apellido: jugador.apellido,
        estado: null
      }));

      setJugadores(jugadoresConAsistencia);

      // Check if there's an active session
      checkActiveSession(entrenamientosData || [], eventosData || []);
    } catch (error) {
      console.error("Error cargando datos:", error);
      Alert.alert("Error", "No se pudieron cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const checkActiveSession = (trainings: Entrenamiento[], events: Evento[]) => {
    const now = new Date();

    // Check for active trainings
    const activeTraining = trainings.find(training => {
      const trainingStart = new Date(training.fecha_hora);
      const trainingEnd = new Date(trainingStart.getTime() + (90 * 60 * 1000)); // Assume 90 minutes duration
      return trainingStart <= now && now <= trainingEnd;
    });

    if (activeTraining) {
      setActiveSession(activeTraining);
      setSessionActive(true);
      return;
    }

    // Check for active events
    const activeEvent = events.find(event => {
      const eventStart = new Date(event.fecha_hora);
      const eventEnd = new Date(eventStart.getTime() + (120 * 60 * 1000)); // Assume 2 hours duration
      return eventStart <= now && now <= eventEnd;
    });

    if (activeEvent) {
      setActiveSession(activeEvent);
      setSessionActive(true);
      return;
    }

    // No active session
    setActiveSession(null);
    setSessionActive(false);
  };

  useEffect(() => {
    cargarDatos();
  }, [user?.id]);

  const marcarAsistenciaJugador = (id_usuario: string, estado: 'Presente' | 'Ausente') => {
    if (!sessionActive) {
      Alert.alert("Sesión inactiva", "No hay ningún entrenamiento o evento activo en este momento.");
      return;
    }

    setJugadores(prev =>
      prev.map(jugador =>
        jugador.id_usuario === id_usuario
          ? { ...jugador, estado }
          : jugador
      )
    );
  };

  const guardarAsistencias = async () => {
    if (!activeSession || !sessionActive) {
      Alert.alert("Sesión inactiva", "No hay ningún entrenamiento o evento activo en este momento.");
      return;
    }

    try {
      const asistenciasAGuardar = jugadores
        .filter(jugador => jugador.estado !== null)
        .map(jugador => ({
          id_jugador: jugador.id_usuario,
          id_entrenamiento: 'id_entrenamiento' in activeSession ? activeSession.id_entrenamiento : null,
          fecha_asistencia: new Date().toISOString(),
          estado_asistencia: jugador.estado,
          observaciones: null
        }));

      if (asistenciasAGuardar.length === 0) {
        Alert.alert("Atención", "No has marcado asistencia para ningún jugador");
        return;
      }

      const { error } = await supabase
        .from("Asistencia")
        .insert(asistenciasAGuardar);

      if (error) throw error;

      Alert.alert("Éxito", `Asistencias guardadas correctamente para ${asistenciasAGuardar.length} jugadores`);

      // Reset attendance states
      setJugadores(prev =>
        prev.map(jugador => ({ ...jugador, estado: null }))
      );
    } catch (error) {
      console.error("Error guardando asistencias:", error);
      Alert.alert("Error", "No se pudieron guardar las asistencias");
    }
  };

  const renderJugador = ({ item }: { item: AsistenciaLive }) => (
    <View style={styles.jugadorCard}>
      <View style={styles.jugadorInfo}>
        <Text style={styles.jugadorName}>
          {item.nombre} {item.apellido}
        </Text>
      </View>
      <View style={styles.jugadorActions}>
        <TouchableOpacity
          style={[
            styles.asistenciaButton,
            item.estado === 'Presente' && styles.asistenciaButtonPresent,
            !sessionActive && styles.asistenciaButtonDisabled
          ]}
          onPress={() => marcarAsistenciaJugador(item.id_usuario, 'Presente')}
          disabled={!sessionActive}
        >
          <Ionicons
            name="checkmark-circle"
            size={24}
            color={
              !sessionActive ? "#9CA3AF" :
              item.estado === 'Presente' ? "#FFFFFF" : "#059669"
            }
          />
          <Text style={[
            styles.asistenciaButtonText,
            item.estado === 'Presente' && styles.asistenciaButtonTextActive,
            !sessionActive && styles.asistenciaButtonTextDisabled
          ]}>
            Presente
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.asistenciaButton,
            item.estado === 'Ausente' && styles.asistenciaButtonAbsent,
            !sessionActive && styles.asistenciaButtonDisabled
          ]}
          onPress={() => marcarAsistenciaJugador(item.id_usuario, 'Ausente')}
          disabled={!sessionActive}
        >
          <Ionicons
            name="close-circle"
            size={24}
            color={
              !sessionActive ? "#9CA3AF" :
              item.estado === 'Ausente' ? "#FFFFFF" : "#DC2626"
            }
          />
          <Text style={[
            styles.asistenciaButtonText,
            item.estado === 'Ausente' && styles.asistenciaButtonTextActive,
            !sessionActive && styles.asistenciaButtonTextDisabled
          ]}>
            Ausente
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <UserHeader
        user={user}
        greeting="Tomar Asistencia"
        avatarColor={colors.entrenador}
        roleText="Entrenador"
      />

      <View style={styles.sessionStatus}>
        <View style={[styles.statusIndicator, sessionActive ? styles.statusActive : styles.statusInactive]}>
          <Ionicons
            name={sessionActive ? "play-circle" : "pause-circle"}
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.statusText}>
            {sessionActive
              ? `Sesión activa: ${'id_entrenamiento' in (activeSession || {}) ? 'Entrenamiento' : 'Evento'}`
              : "Sin sesión activa"
            }
          </Text>
        </View>
      </View>

      {sessionActive && (
        <View style={styles.saveSection}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={guardarAsistencias}
          >
            <Ionicons name="save" size={20} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>
              Guardar Asistencias
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeLayout>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.entrenador} />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeLayout>
    );
  }

  return (
    <SafeLayout>
      <FlatList
        style={styles.container}
        data={jugadores}
        renderItem={renderJugador}
        keyExtractor={(item) => item.id_usuario}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No hay jugadores</Text>
            <Text style={styles.emptyDescription}>
              No se encontraron jugadores registrados
            </Text>
          </View>
        }
        contentContainerStyle={jugadores.length === 0 ? styles.emptyList : null}
      />
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
    marginBottom: 20,
  },
  sessionStatus: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  statusActive: {
    backgroundColor: "#059669",
  },
  statusInactive: {
    backgroundColor: "#6B7280",
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  saveSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.entrenador,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  jugadorCard: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  jugadorInfo: {
    marginBottom: 12,
  },
  jugadorName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  jugadorActions: {
    flexDirection: "row",
    gap: 12,
  },
  asistenciaButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 6,
  },
  asistenciaButtonPresent: {
    backgroundColor: "#059669",
    borderColor: "#059669",
  },
  asistenciaButtonAbsent: {
    backgroundColor: "#DC2626",
    borderColor: "#DC2626",
  },
  asistenciaButtonDisabled: {
    backgroundColor: "#F9FAFB",
    borderColor: "#E5E7EB",
  },
  asistenciaButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  asistenciaButtonTextActive: {
    color: "#FFFFFF",
  },
  asistenciaButtonTextDisabled: {
    color: "#9CA3AF",
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
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
