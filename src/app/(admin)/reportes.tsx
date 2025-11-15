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
} from "react-native";
import { useAuth } from "../../core/auth/AuthContext";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../core/supabase/supabaseClient";
import SafeLayout from "../../shared/components/SafeLayout";
import { colors } from "../../shared/constants/theme";

const { width } = Dimensions.get("window");

interface ReporteData {
  usuarios: {
    total: number;
    porRol: { [key: string]: number };
  };
  asistencias: {
    total: number;
    presentes: number;
    ausentes: number;
    justificados: number;
  };
  pagos: {
    total: number;
    pagados: number;
    pendientes: number;
    recaudado: number;
  };
  entrenamientos: {
    total: number;
    proximos: number;
  };
}

export default function ReportesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [reporte, setReporte] = useState<ReporteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState("mes");

  const cargarReporte = async () => {
    try {
      setLoading(true);

      // Calcular fechas según el período seleccionado
      const ahora = new Date();
      let fechaInicio: Date;

      switch (periodo) {
        case "mes":
          fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
          break;
        case "trimestre":
          const trimestreActual = Math.floor(ahora.getMonth() / 3);
          fechaInicio = new Date(ahora.getFullYear(), trimestreActual * 3, 1);
          break;
        case "año":
          fechaInicio = new Date(ahora.getFullYear(), 0, 1);
          break;
        default:
          fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      }

      // Cargar datos de usuarios
      const { data: usuarios } = await supabase
        .from("Usuarios")
        .select("rol, estado_cuenta, fecha_registro");

      // Cargar datos de asistencias filtrados por período
      const { data: asistencias } = await supabase
        .from("Asistencia")
        .select("estado_asistencia, fecha_asistencia")
        .gte("fecha_asistencia", fechaInicio.toISOString().split('T')[0]);

      // Cargar datos de pagos filtrados por período
      const { data: pagos } = await supabase
        .from("Mensualidad")
        .select("estado_pago, monto, fecha_vencimiento")
        .gte("fecha_vencimiento", fechaInicio.toISOString().split('T')[0]);

      // Cargar datos de entrenamientos filtrados por período
      const { data: entrenamientos } = await supabase
        .from("Entrenamiento")
        .select("fecha_hora")
        .gte("fecha_hora", fechaInicio.toISOString());

      // Procesar datos de usuarios por rol (excluyendo admin)
      const usuariosPorRol = usuarios?.reduce((acc, u) => {
        if (u.rol !== "admin") {
          acc[u.rol] = (acc[u.rol] || 0) + 1;
        }
        return acc;
      }, {} as { [key: string]: number }) || {};

      const usuariosData = {
        total: usuarios?.length || 0,
        porRol: usuariosPorRol
      };

      const asistenciasData = {
        total: asistencias?.length || 0,
        presentes: asistencias?.filter(a => a.estado_asistencia === "Presente").length || 0,
        ausentes: asistencias?.filter(a => a.estado_asistencia === "Ausente").length || 0,
        justificados: asistencias?.filter(a => a.estado_asistencia === "Justificado").length || 0,
      };

      const pagosData = {
        total: pagos?.length || 0,
        pagados: pagos?.filter(p => p.estado_pago === "Pagado").length || 0,
        pendientes: pagos?.filter(p => p.estado_pago === "Pendiente").length || 0,
        recaudado: pagos?.filter(p => p.estado_pago === "Pagado").reduce((sum, p) => sum + (p.monto || 0), 0) || 0,
      };

      const entrenamientosData = {
        total: entrenamientos?.length || 0,
        proximos: entrenamientos?.filter(e => new Date(e.fecha_hora) > new Date()).length || 0,
      };

      setReporte({
        usuarios: usuariosData,
        asistencias: asistenciasData,
        pagos: pagosData,
        entrenamientos: entrenamientosData,
      });
    } catch (error) {
      console.error("Error cargando reporte:", error);
      Alert.alert("Error", "No se pudo cargar el reporte");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarReporte();
  }, [periodo]);

  const formatearMonto = (monto: number) => {
    return `$${monto.toLocaleString("es-CL")}`;
  };

  const calcularPorcentajes = (valor: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((valor / total) * 100);
  };

  if (loading) {
    return (
      <SafeLayout>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Generando reporte...</Text>
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
              <Ionicons name="bar-chart" size={28} color="#F59E0B" />
              <View>
                <Text style={styles.title}>Reportes del Sistema</Text>
                <Text style={styles.subtitle}>
                  Análisis completo del rendimiento y estadísticas
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.exportAction}
              onPress={() => router.push("/(admin)/exportar")}
            >
              <Ionicons name="download-outline" size={20} color={colors.primary} />
              <Text style={styles.exportActionText}>Exportar Estadísticas</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Period Filter */}
        <View style={styles.filterSection}>
          <View style={styles.filterHeader}>
            <Ionicons name="time-outline" size={20} color={colors.primary} />
            <Text style={styles.filterTitle}>Período de Análisis</Text>
          </View>

          <View style={styles.periodoSelector}>
            <TouchableOpacity
              style={[styles.periodoButton, periodo === "mes" && styles.periodoButtonActive]}
              onPress={() => setPeriodo("mes")}
            >
              <Text style={[styles.periodoButtonText, periodo === "mes" && styles.periodoButtonTextActive]}>
                Este Mes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.periodoButton, periodo === "trimestre" && styles.periodoButtonActive]}
              onPress={() => setPeriodo("trimestre")}
            >
              <Text style={[styles.periodoButtonText, periodo === "trimestre" && styles.periodoButtonTextActive]}>
                Trimestre
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.periodoButton, periodo === "año" && styles.periodoButtonActive]}
              onPress={() => setPeriodo("año")}
            >
              <Text style={[styles.periodoButtonText, periodo === "año" && styles.periodoButtonTextActive]}>
                Este Año
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Usuarios */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="people" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Gestión de Usuarios</Text>
              <Text style={styles.sectionDescription}>
                Control y distribución de usuarios en el sistema
              </Text>
            </View>
          </View>

          <View style={styles.metricsGrid}>
            <View style={[styles.metricCard, styles.metricPrimary]}>
              <Ionicons name="person-add" size={24} color={colors.primary} />
              <Text style={styles.metricValue}>{reporte?.usuarios.total || 0}</Text>
              <Text style={styles.metricLabel}>Total de Cuentas</Text>
              <Text style={styles.metricSubtext}>Usuarios registrados</Text>
            </View>
            {Object.entries(reporte?.usuarios.porRol || {}).map(([rol, count]) => (
              <View key={rol} style={[styles.metricCard, styles.metricInfo]}>
                <Ionicons name="people-circle" size={24} color="#7C3AED" />
                <Text style={styles.metricValue}>{count}</Text>
                <Text style={styles.metricLabel}>
                  {rol.charAt(0).toUpperCase() + rol.slice(1)}s
                </Text>
                <Text style={styles.metricSubtext}>Usuarios activos</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Asistencias */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar" size={20} color="#059669" />
            <Text style={styles.sectionTitle}>Asistencias</Text>
          </View>

          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{reporte?.asistencias.total || 0}</Text>
              <Text style={styles.metricLabel}>Total</Text>
            </View>
            <View style={[styles.metricCard, styles.metricPositive]}>
              <Text style={styles.metricValue}>{reporte?.asistencias.presentes || 0}</Text>
              <Text style={styles.metricLabel}>Presentes</Text>
            </View>
            <View style={[styles.metricCard, styles.metricWarning]}>
              <Text style={styles.metricValue}>{reporte?.asistencias.ausentes || 0}</Text>
              <Text style={styles.metricLabel}>Ausentes</Text>
            </View>
            <View style={[styles.metricCard, styles.metricInfo]}>
              <Text style={styles.metricValue}>{reporte?.asistencias.justificados || 0}</Text>
              <Text style={styles.metricLabel}>Justificados</Text>
            </View>
          </View>

          <View style={styles.attendanceChart}>
            <Text style={styles.chartTitle}>Tasa de Asistencia</Text>
            {reporte?.asistencias.total === 0 ? (
              <View style={styles.noDataContainer}>
                <Ionicons name="document-outline" size={48} color="#9CA3AF" />
                <Text style={styles.noDataText}>Sin registros</Text>
                <Text style={styles.noDataSubtext}>No hay asistencias registradas en este período</Text>
              </View>
            ) : (
              <View style={styles.chartBars}>
                <View style={styles.chartBar}>
                  <View style={[styles.chartBarFill, styles.chartBarPresent, {
                    width: `${calcularPorcentajes(reporte?.asistencias.presentes || 0, reporte?.asistencias.total || 0)}%`
                  }]}>
                    <Text style={styles.chartBarText}>
                      {calcularPorcentajes(reporte?.asistencias.presentes || 0, reporte?.asistencias.total || 0)}%
                    </Text>
                  </View>
                  <Text style={styles.chartBarLabel}>Presentes</Text>
                </View>
                <View style={styles.chartBar}>
                  <View style={[styles.chartBarFill, styles.chartBarAbsent, {
                    width: `${calcularPorcentajes(reporte?.asistencias.ausentes || 0, reporte?.asistencias.total || 0)}%`
                  }]}>
                    <Text style={styles.chartBarText}>
                      {calcularPorcentajes(reporte?.asistencias.ausentes || 0, reporte?.asistencias.total || 0)}%
                    </Text>
                  </View>
                  <Text style={styles.chartBarLabel}>Ausentes</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Pagos */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="card" size={20} color="#DC2626" />
            <Text style={styles.sectionTitle}>Pagos y Finanzas</Text>
          </View>

          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>
                {formatearMonto(reporte?.pagos.recaudado || 0)}
              </Text>
              <Text style={styles.metricLabel}>Recaudado</Text>
            </View>
            <View style={[styles.metricCard, styles.metricPositive]}>
              <Text style={styles.metricValue}>{reporte?.pagos.pagados || 0}</Text>
              <Text style={styles.metricLabel}>Pagados</Text>
            </View>
            <View style={[styles.metricCard, styles.metricWarning]}>
              <Text style={styles.metricValue}>{reporte?.pagos.pendientes || 0}</Text>
              <Text style={styles.metricLabel}>Pendientes</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>
                {calcularPorcentajes(reporte?.pagos.pagados || 0, reporte?.pagos.total || 0)}%
              </Text>
              <Text style={styles.metricLabel}>Cobertura</Text>
            </View>
          </View>
        </View>

        {/* Entrenamientos */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="basketball" size={20} color="#7C3AED" />
            <Text style={styles.sectionTitle}>Entrenamientos</Text>
          </View>

          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{reporte?.entrenamientos.total || 0}</Text>
              <Text style={styles.metricLabel}>Total</Text>
            </View>
            <View style={[styles.metricCard, styles.metricInfo]}>
              <Text style={styles.metricValue}>{reporte?.entrenamientos.proximos || 0}</Text>
              <Text style={styles.metricLabel}>Próximos</Text>
            </View>
          </View>
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
  quickActions: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  exportAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
    padding: 12,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  exportActionText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  // Filter Section
  filterSection: {
    padding: 20,
    backgroundColor: "#F8FAFC",
  },
  filterHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  filters: {
    padding: 20,
  },
  periodoSelector: {
    flexDirection: "row",
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 4,
  },
  periodoButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  periodoButtonActive: {
    backgroundColor: colors.primary,
  },
  periodoButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  periodoButtonTextActive: {
    color: "#FFFFFF",
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
  },
  sectionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 2,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    minWidth: (width - 40 - 24) / 2,
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  metricPrimary: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  metricSuccess: {
    borderLeftWidth: 4,
    borderLeftColor: "#059669",
  },
  metricPositive: {
    borderLeftWidth: 4,
    borderLeftColor: "#059669",
  },
  metricWarning: {
    borderLeftWidth: 4,
    borderLeftColor: "#D97706",
  },
  metricInfo: {
    borderLeftWidth: 4,
    borderLeftColor: "#7C3AED",
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  metricSubtext: {
    fontSize: 10,
    color: "#9CA3AF",
    fontWeight: "400",
    textAlign: "center",
  },
  rolesBreakdown: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  breakdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  roleItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  roleInfo: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  roleName: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  rolePercentage: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
  },
  roleBar: {
    flex: 1,
    height: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
    marginHorizontal: 12,
  },
  roleBarFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  roleCount: {
    width: 30,
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    textAlign: "right",
  },
  attendanceChart: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 16,
    textAlign: "center",
  },
  chartBars: {
    gap: 12,
  },
  chartBar: {
    marginBottom: 8,
  },
  chartBarFill: {
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  chartBarPresent: {
    backgroundColor: "#059669",
    width: "85%", // Este valor debería ser dinámico
  },
  chartBarAbsent: {
    backgroundColor: "#DC2626",
    width: "15%", // Este valor debería ser dinámico
  },
  chartBarText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  chartBarLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  actions: {
    padding: 20,
    paddingBottom: 40,
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  exportButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  noDataContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noDataText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 16,
    marginBottom: 8,
  },
  noDataSubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
  },
});
