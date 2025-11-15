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
  Animated,
  RefreshControl,
} from "react-native";
import { useAuth } from "../../core/auth/AuthContext";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../core/supabase/supabaseClient";
import BackgroundDecorativo from "../../shared/components/BackgroundDecorativo";
import UserHeader from "../../shared/components/UserHeader";
import { colors } from "../../shared/constants/theme";

const { width, height } = Dimensions.get("window");

interface Estadisticas {
  totalUsuarios: number;
  totalJugadores: number;
  totalApoderados: number;
  totalEntrenadores: number;
  mensualidadesPagadas: number;
  mensualidadesPendientes: number;
  totalRecaudado: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [cargando, setCargando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideUpAnim = useState(new Animated.Value(25))[0];

  const cargarEstadisticas = async () => {
    try {
      setCargando(true);

      const { data: usuarios, error: errorUsuarios } = await supabase
        .from("Usuarios")
        .select("rol, estado_cuenta");

      const { data: mensualidades, error: errorMensualidades } = await supabase
        .from("Mensualidad")
        .select("monto, estado_pago");

      if (errorUsuarios || errorMensualidades) {
        throw new Error("Error al cargar estadísticas");
      }

      const totalUsuarios = usuarios?.length || 0;
      const totalJugadores =
        usuarios?.filter((u) => u.rol === "jugador").length || 0;
      const totalApoderados =
        usuarios?.filter((u) => u.rol === "apoderado").length || 0;
      const totalEntrenadores =
        usuarios?.filter((u) => u.rol === "entrenador").length || 0;

      const mensualidadesPagadas =
        mensualidades?.filter((m) => m.estado_pago === "Pagado").length || 0;
      const mensualidadesPendientes =
        mensualidades?.filter((m) => m.estado_pago === "Pendiente").length || 0;
      const totalRecaudado =
        mensualidades
          ?.filter((m) => m.estado_pago === "Pagado")
          .reduce((sum, m) => sum + (m.monto || 0), 0) || 0;

      setEstadisticas({
        totalUsuarios,
        totalJugadores,
        totalApoderados,
        totalEntrenadores,
        mensualidadesPagadas,
        mensualidadesPendientes,
        totalRecaudado,
      });
    } catch (error: any) {
      Alert.alert("Error", "No se pudieron cargar las estadísticas");
    } finally {
      setCargando(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    cargarEstadisticas();

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

  const onRefresh = () => {
    setRefreshing(true);
    cargarEstadisticas();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const adminFeatures = [
    {
      title: "Gestión de Usuarios",
      icon: "people",
      description: "Administrar usuarios del sistema",
      route: "usuarios",
      color: "#2563EB",
      lightColor: "#2563EB",
    },
    {
      title: "Control de Asistencias",
      icon: "calendar",
      description: "Registro y control de asistencias",
      route: "asistencias",
      color: "#059669",
      lightColor: "#059669",
    },
    {
      title: "Gestión de Pagos",
      icon: "card",
      description: "Administrar pagos y mensualidades",
      route: "pagos",
      color: "#DC2626",
      lightColor: "#DC2626",
    },
    {
      title: "Reportes",
      icon: "stats-chart",
      description: "Reportes y análisis del sistema",
      route: "reportes",
      color: "#7C3AED",
      lightColor: "#7C3AED",
    },
    {
      title: "Entrenamientos y Eventos",
      icon: "football",
      description: "Gestionar entrenamientos y eventos",
      route: "entrenamientos",
      color: "#8B5CF6",
      lightColor: "#8B5CF6",
    },
    {
      title: "Configuración",
      icon: "settings",
      description: "Ajustes del sistema",
      route: "/settings",
      color: "#D97706",
      lightColor: "#D97706",
    },
  ];

  const formatearMonto = (monto: number) => {
    return `$${monto.toLocaleString("es-CL")}`;
  };

  if (cargando) {
    return (
      <View style={[styles.container, styles.centered]}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingAnimation}>
            <Ionicons name="shield" size={32} color="#1E40AF" />
          </View>
          <Text style={styles.loadingText}>
            Cargando panel administrativo...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BackgroundDecorativo />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primaryDark]}
            tintColor={colors.primaryDark}
            title="Actualizando..."
            titleColor="#6B7280"
          />
        }
      >
        <UserHeader
          user={user}
          greeting="Panel de Control"
          avatarColor={colors.primaryDark}
          roleText="Administrador del Sistema"
        />

        <Animated.View
          style={[
            styles.statsSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="analytics" size={22} color={colors.primaryDark} />
              <Text style={styles.sectionTitle}>Métricas del Sistema</Text>
            </View>
            <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
              <Ionicons
                name="refresh"
                size={18}
                color={colors.primaryDark}
                style={refreshing ? styles.refreshingIcon : null}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statRow}>
              <View style={[styles.statCard, styles.statCardPrimary]}>
                <View style={styles.statHeader}>
                  <Ionicons name="people" size={20} color="#1E40AF" />
                  <Text style={styles.statLabel}>Total Usuarios</Text>
                </View>
                <Text style={styles.statNumber}>
                  {estadisticas?.totalUsuarios || 0}
                </Text>
                <View style={styles.statSubtext}>
                  <Ionicons name="trending-up" size={14} color="#059669" />
                  <Text style={styles.statTrend}>Sistema activo</Text>
                </View>
              </View>

              <View style={[styles.statCard, styles.statCardSuccess]}>
                <View style={styles.statHeader}>
                  <Ionicons name="card" size={20} color="#059669" />
                  <Text style={styles.statLabel}>Pagos del Mes</Text>
                </View>
                <Text style={styles.statNumber}>
                  {estadisticas?.mensualidadesPagadas || 0}
                </Text>
                <View style={styles.statSubtext}>
                  <Text style={styles.statSubLabel}>
                    Pendientes: {estadisticas?.mensualidadesPendientes || 0}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.statRow}>
              <View style={[styles.statCard, styles.statCardWarning]}>
                <View style={styles.statHeader}>
                  <Ionicons name="cash" size={20} color="#D97706" />
                  <Text style={styles.statLabel}>Recaudación Total</Text>
                </View>
                <Text style={styles.statNumber}>
                  {estadisticas?.totalRecaudado
                    ? formatearMonto(estadisticas.totalRecaudado)
                    : "$0"}
                </Text>
                <View style={styles.statSubtext}>
                  <Ionicons name="business" size={14} color="#D97706" />
                  <Text style={styles.statTrend}>Balance general</Text>
                </View>
              </View>

              <View style={[styles.statCard, styles.statCardInfo]}>
                <View style={styles.statHeader}>
                  <Ionicons name="person" size={20} color="#7C3AED" />
                  <Text style={styles.statLabel}>Distribución</Text>
                </View>
                <View style={styles.distribution}>
                  <View style={styles.distItem}>
                    <Text style={styles.distLabel}>Jugadores</Text>
                    <Text style={styles.distValue}>
                      {estadisticas?.totalJugadores || 0}
                    </Text>
                  </View>
                  <View style={styles.distItem}>
                    <Text style={styles.distLabel}>Entrenadores</Text>
                    <Text style={styles.distValue}>
                      {estadisticas?.totalEntrenadores || 0}
                    </Text>
                  </View>
                  <View style={styles.distItem}>
                    <Text style={styles.distLabel}>Apoderados</Text>
                    <Text style={styles.distValue}>
                      {estadisticas?.totalApoderados || 0}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.modulesSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="cog" size={22} color={colors.primaryDark} />
              <Text style={styles.sectionTitle}>
                Herramientas Administrativas
              </Text>
            </View>
          </View>

          <View style={styles.modulesGrid}>
            {adminFeatures.map((module, index) => (
              <TouchableOpacity
                key={index}
                style={styles.moduleCard}
                onPress={() => router.push(module.route)}
                activeOpacity={0.9}
              >
                <View style={styles.moduleHeader}>
                  <View
                    style={[
                      styles.moduleIcon,
                      { backgroundColor: module.color + "15" },
                    ]}
                  >
                    <Ionicons
                      name={module.icon as any}
                      size={24}
                      color={module.color}
                    />
                  </View>
                </View>
                <Text style={styles.moduleTitle}>{module.title}</Text>
                <Text style={styles.moduleDescription}>
                  {module.description}
                </Text>
                <View style={styles.moduleFooter}>
                  <View
                    style={[
                      styles.moduleArrow,
                      { backgroundColor: module.color + "20" },
                    ]}
                  >
                    <Ionicons
                      name="arrow-forward"
                      size={14}
                      color={module.color}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    alignItems: "center",
  },
  loadingAnimation: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  statsSection: {
    marginBottom: 28,
  },
  modulesSection: {
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
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    letterSpacing: -0.3,
  },
  refreshButton: {
    padding: 8,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  refreshingIcon: {
    transform: [{ rotate: "180deg" }],
  },
  statsGrid: {
    paddingHorizontal: 28,
    gap: 16,
  },
  statRow: {
    flexDirection: "row",
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
  },
  statCardPrimary: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primaryDark,
  },
  statCardSuccess: {
    borderLeftWidth: 4,
    borderLeftColor: colors.jugador,
  },
  statCardWarning: {
    borderLeftWidth: 4,
    borderLeftColor: "#D97706",
  },
  statCardInfo: {
    borderLeftWidth: 4,
    borderLeftColor: colors.apoderado,
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 8,
  },
  statSubtext: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statTrend: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
  },
  statSubLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
  },
  distribution: {
    gap: 6,
  },
  distItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  distLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  distValue: {
    fontSize: 14,
    color: "#1E293B",
    fontWeight: "700",
  },
  modulesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 28,
    gap: 16,
  },
  moduleCard: {
    width: (width - 84) / 2,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
  },
  moduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  moduleIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  moduleTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 6,
  },
  moduleDescription: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 16,
    marginBottom: 12,
  },
  moduleFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  moduleArrow: {
    width: 26,
    height: 26,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
});
