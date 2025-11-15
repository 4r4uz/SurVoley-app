import React, { useState, useEffect, useCallback } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import SafeLayout from "../../shared/components/SafeLayout";
import { colors, commonStyles, spacing } from "../../shared/constants/theme";
import { StatsCard } from "../../shared/components/StatsCard";
import { SkeletonLoader } from "../../shared/components/SkeletonLoader";
import {
  generarMensualidadesManual,
  obtenerEstadisticasMensualidades
} from "../../core/services";

const { width } = Dimensions.get("window");

interface EstadisticasMensualidades {
  total: number;
  pagadas: number;
  pendientes: number;
  porcentajePagado: number;
}

export default function GestionMensualidadesScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [estadisticas, setEstadisticas] = useState<EstadisticasMensualidades | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const cargarEstadisticas = useCallback(async () => {
    try {
      const stats = await obtenerEstadisticasMensualidades();
      setEstadisticas(stats);
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarEstadisticas();
  }, [cargarEstadisticas]);

  const handleGenerarMensualidades = async () => {
    Alert.alert(
      "Confirmar Generación",
      `¿Estás seguro de generar mensualidades para ${getMonthName(selectedMonth)} ${selectedYear}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Generar",
          style: "default",
          onPress: async () => {
            setGenerating(true);
            try {
              const result = await generarMensualidadesManual(selectedMonth, selectedYear);

              if (result.success) {
                Alert.alert("Éxito", result.message);
                cargarEstadisticas(); // Recargar estadísticas
              } else {
                Alert.alert("Error", result.message);
              }
            } catch (error) {
              console.error("Error generando mensualidades:", error);
              Alert.alert("Error", "No se pudieron generar las mensualidades");
            } finally {
              setGenerating(false);
            }
          },
        },
      ]
    );
  };

  const getMonthName = (month: number) => {
    const months = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    return months[month - 1] || "";
  };

  const getNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const getPrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  if (loading) {
    return (
      <SafeLayout>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* Header Skeleton */}
          <View style={styles.headerSection}>
            <View style={styles.header}>
              <View style={styles.titleContainer}>
                <Ionicons name="cash" size={28} color="#8B5CF6" />
                <View>
                  <SkeletonLoader width={200} height={24} />
                  <SkeletonLoader width={250} height={16} style={{ marginTop: 4 }} />
                </View>
              </View>
            </View>

            {/* Stats Skeleton */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <SkeletonLoader width={40} height={20} style={{ marginBottom: 8 }} />
                <SkeletonLoader width={60} height={14} />
              </View>
              <View style={styles.statCard}>
                <SkeletonLoader width={40} height={20} style={{ marginBottom: 8 }} />
                <SkeletonLoader width={70} height={14} />
              </View>
              <View style={styles.statCard}>
                <SkeletonLoader width={50} height={20} style={{ marginBottom: 8 }} />
                <SkeletonLoader width={80} height={14} />
              </View>
            </View>
          </View>

          {/* Content Skeleton */}
          <View style={styles.content}>
            <SkeletonLoader width="100%" height={200} borderRadius={12} />
          </View>
        </ScrollView>
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
              <Ionicons name="cash" size={28} color="#8B5CF6" />
              <View>
                <Text style={styles.title}>Gestión de Mensualidades</Text>
                <Text style={styles.subtitle}>
                  Administra la generación automática de mensualidades
                </Text>
              </View>
            </View>
          </View>

          {/* Statistics */}
          <View style={styles.statsGrid}>
            <StatsCard
              icon="document-text"
              value={estadisticas?.total.toString() || "0"}
              label="Total Mes Actual"
              color={colors.primary}
            />
            <StatsCard
              icon="checkmark-circle"
              value={estadisticas?.pagadas.toString() || "0"}
              label="Pagadas"
              color={colors.success}
            />
            <StatsCard
              icon="time"
              value={`${estadisticas?.porcentajePagado || 0}%`}
              label="Pagado"
              color={estadisticas?.porcentajePagado === 100 ? colors.success : colors.warning}
            />
          </View>
        </View>

        {/* Generation Section */}
        <View style={styles.generationSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="add-circle" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Generar Mensualidades</Text>
          </View>

          <View style={styles.generationCard}>
            <Text style={styles.generationTitle}>Generación Manual</Text>
            <Text style={styles.generationDescription}>
              Crea mensualidades para todos los usuarios activos de un mes específico
            </Text>

            {/* Month/Year Selector */}
            <View style={styles.monthSelector}>
              <TouchableOpacity
                style={styles.monthButton}
                onPress={getPrevMonth}
              >
                <Ionicons name="chevron-back" size={20} color={colors.primary} />
              </TouchableOpacity>

              <View style={styles.monthDisplay}>
                <Text style={styles.monthText}>
                  {getMonthName(selectedMonth)} {selectedYear}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.monthButton}
                onPress={getNextMonth}
              >
                <Ionicons name="chevron-forward" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Generate Button */}
            <TouchableOpacity
              style={[styles.generateButton, generating && styles.generateButtonDisabled]}
              onPress={handleGenerarMensualidades}
              disabled={generating}
            >
              {generating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="add-circle" size={18} color="#FFFFFF" />
              )}
              <Text style={styles.generateButtonText}>
                {generating ? "Generando..." : "Generar Mensualidades"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Generación Automática</Text>
              <Text style={styles.infoText}>
                Las mensualidades se generan automáticamente cada mes cuando un usuario inicia sesión en la aplicación.
                Esta función manual te permite generar mensualidades para meses específicos si es necesario.
              </Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="shield-checkmark" size={24} color={colors.success} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Prevención de Duplicados</Text>
              <Text style={styles.infoText}>
                El sistema verifica automáticamente si ya existen mensualidades para el mes seleccionado,
                evitando la creación de registros duplicados.
              </Text>
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
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    ...commonStyles.whiteCard,
    alignItems: "center",
  },
  generationSection: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  generationCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  generationTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  generationDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 20,
    lineHeight: 20,
  },
  monthSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  monthButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  monthDisplay: {
    flex: 1,
    alignItems: "center",
  },
  monthText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  generateButtonDisabled: {
    backgroundColor: "#9CA3AF",
    shadowOpacity: 0,
    elevation: 0,
  },
  generateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  infoSection: {
    padding: 20,
    paddingTop: 0,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  content: {
    padding: 20,
  },
});
