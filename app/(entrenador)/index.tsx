import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { useAuth } from "../../types/use.auth";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../supabase/supabaseClient";
import RoleBadge from "../../components/RoleBadge";
import { formatDate } from "../../utils/dateHelpers";
import { colors, spacing, borderRadius, shadows, typography } from "../../constants/theme";

interface NextEvent {
  id: string;
  fecha_hora: string;
  tipo_evento: string;
  lugar: string;
  titulo: string;
  esEvento: boolean;
}

export default function EntrenadorHome() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [nextEvents, setNextEvents] = useState<NextEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const features = [
    {
      title: "Control de Asistencia",
      icon: "clipboard",
      description: "Gestionar asistencia de jugadores",
      route: "/(entrenador)/asistencia",
    },
    {
      title: "Programar Entrenamientos",
      icon: "calendar",
      description: "Crear y gestionar sesiones de entrenamiento",
      route: "/(entrenador)/calendario",
    },
  ];

  useEffect(() => {
    fetchNextEvents();
  }, []);

  const fetchNextEvents = async () => {
    try {
      const now = new Date().toISOString();

      const { data: entrenamientosData } = await supabase
        .from("Entrenamiento")
        .select("*")
        .gt("fecha_hora", now)
        .order("fecha_hora", { ascending: true })
        .limit(3);

      const { data: eventosData } = await supabase
        .from("Evento")
        .select("*")
        .gt("fecha_hora", now)
        .order("fecha_hora", { ascending: true })
        .limit(3);

      const upcomingEvents: NextEvent[] = [];

      if (entrenamientosData) {
        entrenamientosData.forEach((entrenamiento: any) => {
          upcomingEvents.push({
            id: entrenamiento.id_entrenamiento,
            fecha_hora: entrenamiento.fecha_hora,
            tipo_evento: "Entrenamiento",
            lugar: entrenamiento.lugar,
            titulo: entrenamiento.descripcion || "Entrenamiento",
            esEvento: false,
          });
        });
      }

      if (eventosData) {
        eventosData.forEach((evento: any) => {
          upcomingEvents.push({
            id: evento.id_evento,
            fecha_hora: evento.fecha_hora,
            tipo_evento: evento.tipo_evento,
            lugar: evento.ubicacion,
            titulo: evento.titulo,
            esEvento: true,
          });
        });
      }

      const sortedEvents = upcomingEvents
        .sort(
          (a, b) =>
            new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime()
        )
        .slice(0, 3);

      setNextEvents(sortedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert("Cerrar Sesión", "¿Estás seguro de que deseas cerrar sesión?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar Sesión",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            router.replace("/(auth)/login");
          } catch (error) {
            Alert.alert("Error", "No se pudo cerrar la sesión");
          }
        },
      },
    ]);
  };

  const formatDateForEvent = (dateString: string) => {
    const formatted = formatDate(dateString);
    return {
      day: formatted.day.toString(),
      month: formatted.month,
      weekday: formatted.weekday,
      time: formatted.time,
    };
  };

  const getEventIcon = (tipo: string, esEvento: boolean) => {
    if (esEvento) {
      if (tipo === "Partido") return "trophy";
      if (tipo === "Torneo") return "medal";
      return "calendar";
    }
    return "basketball";
  };

  const getEventColor = (tipo: string, esEvento: boolean) => {
    if (esEvento) {
      if (tipo === "Partido") return "#e74c3c";
      if (tipo === "Torneo") return "#f39c12";
      return "#3f3db8ff";
    }
    return "#2ecc71";
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.nombre?.charAt(0) || "E"}
            </Text>
          </View>
        </View>
        <Text style={styles.welcome}>
          ¡Hola, Entrenador {user?.nombre || ""}!
        </Text>
        <Text style={styles.userInfo}>Bienvenido a SURVOLEY APP</Text>
        <RoleBadge rol="entrenador" size="md" />
      </View>

      <ScrollView style={styles.scrollContent}>
        <View style={styles.eventsContainer}>
          <Text style={styles.sectionTitle}>Próximos Eventos</Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <Ionicons name="refresh" size={24} color={colors.entrenador} />
              <Text style={styles.loadingText}>Cargando eventos...</Text>
            </View>
          ) : nextEvents.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={40} color="#ccc" />
              <Text style={styles.emptyText}>No hay eventos próximos</Text>
            </View>
          ) : (
            nextEvents.map((event, index) => {
              const formattedDate = formatDateForEvent(event.fecha_hora);
              const eventColor = getEventColor(
                event.tipo_evento,
                event.esEvento
              );

              return (
                <TouchableOpacity key={event.id} style={styles.eventCard}>
                  <View
                    style={[styles.dateBadge, { backgroundColor: eventColor }]}
                  >
                    <Text style={styles.dateDay}>{formattedDate.day}</Text>
                    <Text style={styles.dateMonth}>{formattedDate.month}</Text>
                  </View>

                  <View style={styles.eventContent}>
                    <View style={styles.eventHeader}>
                      <View style={styles.eventType}>
                        <Ionicons
                          name={getEventIcon(event.tipo_evento, event.esEvento)}
                          size={16}
                          color={eventColor}
                        />
                        <Text
                          style={[styles.eventTypeText, { color: eventColor }]}
                        >
                          {event.esEvento ? event.tipo_evento : "Entrenamiento"}
                        </Text>
                      </View>
                      <Text style={styles.eventTime}>{formattedDate.time}</Text>
                    </View>

                    <Text style={styles.eventTitle} numberOfLines={1}>
                      {event.titulo}
                    </Text>

                    <View style={styles.eventLocation}>
                      <Ionicons name="location" size={12} color="#666" />
                      <Text style={styles.eventLocationText}>
                        {event.lugar}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={styles.featuresContainer}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          {features.map((feature, index) => (
            <TouchableOpacity
              key={index}
              style={styles.featureCard}
              onPress={() => router.push(feature.route)}
            >
              <View style={styles.featureIconContainer}>
                <Ionicons
                  name={feature.icon as any}
                  size={28}
                  color={colors.entrenador}
                />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>
                  {feature.description}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#d9534f" />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    backgroundColor: colors.entrenador,
    padding: spacing.xl,
    paddingTop: spacing.lg,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
    alignItems: "center",
    shadowColor: colors.entrenador,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.3)",
  },
  avatarText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },
  welcome: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 4,
  },
  userInfo: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    marginBottom: 8,
  },
  scrollContent: {
    flex: 1,
  },
  eventsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  eventCard: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  dateBadge: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  dateDay: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  dateMonth: {
    fontSize: 10,
    color: "white",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  eventContent: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  eventType: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  eventTypeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  eventTime: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  eventLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  eventLocationText: {
    fontSize: 11,
    color: "#666",
  },
  loadingContainer: {
    backgroundColor: "white",
    padding: 30,
    borderRadius: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
  },
  emptyContainer: {
    backgroundColor: "white",
    padding: 40,
    borderRadius: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
  },
  featuresContainer: {
    padding: 20,
    paddingTop: 0,
  },
  featureCard: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  featureIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: "rgba(63, 61, 184, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  logoutButton: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 15,
    margin: 20,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#d9534f",
  },
  logoutText: {
    fontSize: 16,
    color: "#d9534f",
    fontWeight: "bold",
  },
});
