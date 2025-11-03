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
import { useAuth } from "../../types/use.auth";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../supabase/supabaseClient";

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

export default function AdminScreen() {
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
      route: "/(admin)/gestion_usuarios",
      color: "#2563EB",
      lightColor: "#2563EB",
    },
    {
      title: "Control de Asistencias",
      icon: "calendar",
      description: "Registro y control de asistencias",
      route: "/(admin)/gestion_asistencias",
      color: "#059669",
      lightColor: "#059669",
    },
    {
      title: "Gestión de Pagos",
      icon: "card",
      description: "Administrar pagos y mensualidades",
      route: "/(admin)/gestion_pagos",
      color: "#DC2626",
      lightColor: "#DC2626",
    },
    {
      title: "Reportes",
      icon: "stats-chart",
      description: "Reportes y análisis del sistema",
      route: "/(admin)/reportes",
      color: "#7C3AED",
      lightColor: "#7C3AED",
    },
    {
      title: "Mensualidades",
      icon: "add-circle",
      description: "Generar mensualidades",
      route: "/(admin)/mensualidades",
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#1E40AF"]}
            tintColor="#1E40AF"
            title="Actualizando..."
            titleColor="#6B7280"
          />
        }
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
                  <Ionicons name="shield" size={24} color="#FFFFFF" />
                </View>
              </View>
              <View style={styles.userText}>
                <Text style={styles.greeting}>Panel de Control</Text>
                <Text style={styles.userName}>
                  {user?.nombre} {user?.apellido}
                </Text>
                <View style={styles.roleBadge}>
                  <Ionicons name="shield-checkmark" size={12} color="#FFFFFF" />
                  <Text style={styles.roleText}>Administrador del Sistema</Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

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
              <Ionicons name="analytics" size={22} color="#1E40AF" />
              <Text style={styles.sectionTitle}>Métricas del Sistema</Text>
            </View>
            <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
              <Ionicons
                name="refresh"
                size={18}
                color="#1E40AF"
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
              <Ionicons name="cog" size={22} color="#1E40AF" />
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
    backgroundColor: "#EFF6FF",
  },
  bubble2: {
    width: 180,
    height: 180,
    bottom: 120,
    left: -70,
    backgroundColor: "#F0FDF9",
  },
  bubble3: {
    width: 120,
    height: 120,
    top: "35%",
    right: 40,
    backgroundColor: "#FEF7ED",
  },
  bubble4: {
    width: 90,
    height: 90,
    bottom: 200,
    right: 100,
    backgroundColor: "#F8FAFC",
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
  header: {
    paddingHorizontal: 28,
    paddingTop: 30,
    paddingBottom: 30,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 16,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#1E40AF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#1E40AF",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 2,
    borderColor: "#3B82F6",
  },
  userText: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1E293B",
    lineHeight: 28,
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E40AF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
    gap: 6,
    borderWidth: 1,
    borderColor: "#3B82F6",
  },
  roleText: {
    fontSize: 11,
    color: "#FFFFFF",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
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
    borderLeftColor: "#1E40AF",
  },
  statCardSuccess: {
    borderLeftWidth: 4,
    borderLeftColor: "#059669",
  },
  statCardWarning: {
    borderLeftWidth: 4,
    borderLeftColor: "#D97706",
  },
  statCardInfo: {
    borderLeftWidth: 4,
    borderLeftColor: "#7C3AED",
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
