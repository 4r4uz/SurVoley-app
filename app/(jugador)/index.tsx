import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
} from "react-native";
import { useAuth } from "../../types/use.auth";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../supabase/supabaseClient";

const { width, height } = Dimensions.get("window");

interface NextEvent {
  id: string;
  fecha_hora: string;
  tipo_evento: string;
  lugar: string;
  titulo: string;
  esEvento: boolean;
}

export default function JugadorHome() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [nextEvents, setNextEvents] = useState<NextEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideUpAnim = useState(new Animated.Value(25))[0];

  const features = [
    {
      title: "Asistencias",
      icon: "calendar",
      description: "Control de participación",
      route: "/(jugador)/asistencia",
      color: "#8B5CF6",
      lightColor: "#8B5CF6",
    },
    {
      title: "Pagos",
      icon: "card",
      description: "Estado de cuenta",
      route: "/(jugador)/pagos",
      color: "#EC4899",
      lightColor: "#EC4899",
    },
    {
      title: "Certificados",
      icon: "document-text",
      description: "Documentos oficiales",
      route: "/(jugador)/certificados",
      color: "#3B82F6",
      lightColor: "#3B82F6",
    },
    {
      title: "Ajustes",
      icon: "settings",
      description: "Configuración personal",
      route: "/(jugador)/settings",
      color: "#10B981",
      lightColor: "#10B981",
    },
  ];

  useEffect(() => {
    fetchNextEvents();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
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
            titulo: entrenamiento.descripcion || "Entrenamiento programado",
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.getDate().toString(),
      month: date.toLocaleDateString("es-ES", { month: "short" }),
      time: date.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const getEventIcon = (tipo: string, esEvento: boolean) => {
    if (esEvento) {
      if (tipo === "Partido") return "trophy";
      if (tipo === "Torneo") return "medal";
      return "flag";
    }
    return "basketball";
  };

  const getEventColor = (tipo: string, esEvento: boolean) => {
    if (esEvento) {
      if (tipo === "Partido") return "#EF4444";
      if (tipo === "Torneo") return "#F59E0B";
      return "#8B5CF6";
    }
    return "#10B981";
  };

  return (
    <View style={styles.container}>
      <View style={styles.background}>
        <View style={[styles.bubble, styles.bubble1]} />
        <View style={[styles.bubble, styles.bubble2]} />
        <View style={[styles.bubble, styles.bubble3]} />
        <View style={[styles.bubble, styles.bubble4]} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            },
          ]}
        >
          <View style={styles.headerContent}>
            <View style={styles.userInfo}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {user?.nombre?.charAt(0)}
                    {user?.apellido?.charAt(0)}
                  </Text>
                </View>
                <View />
              </View>
              <View style={styles.userText}>
                <Text style={styles.greeting}>¡Hola de nuevo!</Text>
                <Text style={styles.userName}>
                  {user?.nombre} {user?.apellido}
                </Text>
                <View style={styles.roleBadge}>
                  <Ionicons name="person" size={12} color="#FFFFFF" />
                  <Text style={styles.roleText}>Jugador</Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.eventsSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="time" size={20} color="#7C3AED" />
              <Text style={styles.sectionTitle}>Próximos Eventos</Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <View style={styles.loadingAnimation}>
                <Ionicons name="refresh" size={32} color="#7C3AED" />
              </View>
              <Text style={styles.loadingText}>Cargando eventos...</Text>
            </View>
          ) : nextEvents.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons name="calendar-outline" size={44} color="#9CA3AF" />
              </View>
              <Text style={styles.emptyTitle}>Sin eventos próximos</Text>
              <Text style={styles.emptyDescription}>
                Los próximos eventos aparecerán aquí
              </Text>
            </View>
          ) : (
            <View style={styles.eventsContainer}>
              {nextEvents.map((event, index) => {
                const formattedDate = formatDate(event.fecha_hora);
                const eventColor = getEventColor(
                  event.tipo_evento,
                  event.esEvento
                );

                return (
                  <TouchableOpacity
                    key={event.id}
                    style={styles.eventCard}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.eventIndicator,
                        { backgroundColor: eventColor },
                      ]}
                    />

                    <View style={styles.eventDate}>
                      <Text style={styles.eventDay}>{formattedDate.day}</Text>
                      <Text style={styles.eventMonth}>
                        {formattedDate.month}
                      </Text>
                    </View>

                    <View style={styles.eventContent}>
                      <View style={styles.eventHeader}>
                        <View style={styles.eventType}>
                          <View
                            style={[
                              styles.eventIcon,
                              { backgroundColor: eventColor + "20" },
                            ]}
                          >
                            <Ionicons
                              name={getEventIcon(
                                event.tipo_evento,
                                event.esEvento
                              )}
                              size={16}
                              color={eventColor}
                            />
                          </View>
                          <Text
                            style={[
                              styles.eventTypeText,
                              { color: eventColor },
                            ]}
                          >
                            {event.esEvento
                              ? event.tipo_evento
                              : "Entrenamiento"}
                          </Text>
                        </View>
                        <Text style={styles.eventTime}>
                          {formattedDate.time}
                        </Text>
                      </View>

                      <Text style={styles.eventTitle} numberOfLines={2}>
                        {event.titulo}
                      </Text>

                      <View style={styles.eventLocation}>
                        <Ionicons name="location" size={14} color="#6B7280" />
                        <Text style={styles.eventLocationText}>
                          {event.lugar}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.eventArrow}>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color="#D1D5DB"
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </Animated.View>

        <Animated.View
          style={[
            styles.actionsSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="flash" size={20} color="#7C3AED" />
              <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
            </View>
          </View>

          <View style={styles.actionsGrid}>
            {features.map((feature, index) => (
              <TouchableOpacity
                key={index}
                style={styles.actionCard}
                onPress={() => router.push(feature.route)}
                activeOpacity={0.9}
              >
                <View
                  style={[
                    styles.actionIconContainer,
                    { backgroundColor: feature.color + "15" },
                  ]}
                >
                  <Ionicons
                    name={feature.icon as any}
                    size={26}
                    color={feature.color}
                  />
                </View>
                <Text style={styles.actionTitle}>{feature.title}</Text>
                <Text style={styles.actionDescription}>
                  {feature.description}
                </Text>
                <View
                  style={[
                    styles.actionArrow,
                    { backgroundColor: feature.color + "20" },
                  ]}
                >
                  <Ionicons
                    name="arrow-forward"
                    size={14}
                    color={feature.color}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  bubble: {
    position: "absolute",
    borderRadius: 500,
  },
  bubble1: {
    width: 220,
    height: 220,
    top: -80,
    right: -60,
    backgroundColor: "#F0F9FF",
  },
  bubble2: {
    width: 180,
    height: 180,
    bottom: 120,
    left: -70,
    backgroundColor: "#FDF2F8",
  },
  bubble3: {
    width: 120,
    height: 120,
    top: "35%",
    right: 40,
    backgroundColor: "#F0FDF4",
  },
  bubble4: {
    width: 90,
    height: 90,
    bottom: 200,
    right: 100,
    backgroundColor: "#FAF5FF",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 28,
    paddingTop: 40,
    paddingBottom: 25,
  },
  headerContent: {
    alignItems: "flex-start",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 16,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#7C3AED",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  userText: {
    flex: 1,
  },
  greeting: {
    fontSize: 15,
    color: "#6B7280",
    fontWeight: "500",
    marginBottom: 4,
  },
  userName: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1F2937",
    lineHeight: 30,
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#7C3AED",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    gap: 4,
  },
  roleText: {
    fontSize: 11,
    color: "#FFFFFF",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  eventsSection: {
    marginBottom: 28,
  },
  actionsSection: {
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 28,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1F2937",
    letterSpacing: -0.3,
  },
  eventsContainer: {
    gap: 14,
    paddingHorizontal: 28,
  },
  eventCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1.5,
    borderColor: "#F3F4F6",
    position: "relative",
    overflow: "hidden",
  },
  eventIndicator: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  eventDate: {
    width: 48,
    alignItems: "center",
    marginRight: 16,
    marginLeft: 8,
  },
  eventDay: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 2,
  },
  eventMonth: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  eventContent: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  eventType: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  eventIcon: {
    width: 26,
    height: 26,
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
  },
  eventTypeText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  eventTime: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
    lineHeight: 20,
  },
  eventLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  eventLocationText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  eventArrow: {
    marginLeft: 8,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 28,
    gap: 14,
  },
  actionCard: {
    width: (width - 84) / 2,
    backgroundColor: "#FFFFFF",
    padding: 22,
    borderRadius: 18,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1.5,
    borderColor: "#F3F4F6",
    position: "relative",
  },
  actionIconContainer: {
    width: 54,
    height: 54,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 6,
  },
  actionDescription: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 16,
    marginBottom: 8,
  },
  actionArrow: {
    position: "absolute",
    bottom: 16,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    backgroundColor: "#FFFFFF",
    padding: 50,
    borderRadius: 18,
    alignItems: "center",
    marginHorizontal: 28,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1.5,
    borderColor: "#F3F4F6",
  },
  loadingAnimation: {
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  emptyContainer: {
    backgroundColor: "#FFFFFF",
    padding: 50,
    borderRadius: 18,
    alignItems: "center",
    marginHorizontal: 28,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1.5,
    borderColor: "#F3F4F6",
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "600",
    marginBottom: 6,
  },
  emptyDescription: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 18,
  },
  bottomSpacer: {
    height: 30,
  },
});
