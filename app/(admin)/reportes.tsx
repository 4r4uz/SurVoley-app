import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ReportesScreen() {
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1E293B" barStyle="light-content" />
      
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.welcome}>Reportes</Text>
            <Text style={styles.subtitle}>
              Análisis y estadísticas del club
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollContent}>
        <View style={styles.section}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: "#2563EB15" }]}>
                <Ionicons name="trending-up" size={20} color="#2563EB" />
              </View>
              <Text style={styles.statNumber}>92%</Text>
              <Text style={styles.statLabel}>Asistencia</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: "#05966915" }]}>
                <Ionicons name="cash" size={20} color="#059669" />
              </View>
              <Text style={styles.statNumber}>88%</Text>
              <Text style={styles.statLabel}>Pagos</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: "#7C3AED15" }]}>
                <Ionicons name="people" size={20} color="#7C3AED" />
              </View>
              <Text style={styles.statNumber}>65</Text>
              <Text style={styles.statLabel}>Jugadores</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: "#DC262615" }]}>
                <Ionicons name="alert-circle" size={20} color="#DC2626" />
              </View>
              <Text style={styles.statNumber}>8</Text>
              <Text style={styles.statLabel}>Morosos</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Reportes Disponibles</Text>
            <TouchableOpacity style={styles.botonAccion}>
              <Ionicons name="download" size={20} color="#FFFFFF" />
              <Text style={styles.botonAccionTexto}>Exportar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.gridReportes}>
            <TouchableOpacity style={styles.reporteCard}>
              <View style={[styles.reporteIcon, { backgroundColor: "#2563EB15" }]}>
                <Ionicons name="calendar" size={24} color="#2563EB" />
              </View>
              <Text style={styles.reporteTitulo}>Asistencias</Text>
              <Text style={styles.reporteDesc}>Reporte mensual de asistencias</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.reporteCard}>
              <View style={[styles.reporteIcon, { backgroundColor: "#05966915" }]}>
                <Ionicons name="cash" size={24} color="#059669" />
              </View>
              <Text style={styles.reporteTitulo}>Pagos</Text>
              <Text style={styles.reporteDesc}>Estado de cuotas y pagos</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.reporteCard}>
              <View style={[styles.reporteIcon, { backgroundColor: "#7C3AED15" }]}>
                <Ionicons name="people" size={24} color="#7C3AED" />
              </View>
              <Text style={styles.reporteTitulo}>Jugadores</Text>
              <Text style={styles.reporteDesc}>Listado completo de jugadores</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.reporteCard}>
              <View style={[styles.reporteIcon, { backgroundColor: "#DC262615" }]}>
                <Ionicons name="alert-circle" size={24} color="#DC2626" />
              </View>
              <Text style={styles.reporteTitulo}>Morosidad</Text>
              <Text style={styles.reporteDesc}>Jugadores con pagos pendientes</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Filtros y Parámetros</Text>
          </View>

          <View style={styles.listaContainer}>
            <Text style={styles.textoPlaceholder}>
              Configuración de reportes
            </Text>
            <Text style={styles.textoDescripcion}>
              • Selección de fechas{'\n'}
              • Filtro por categorías{'\n'}
              • Parámetros específicos{'\n'}
              • Formatos de exportación
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    backgroundColor: "#1E293B",
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerTextContainer: {
    flex: 1,
  },
  welcome: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  scrollContent: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  botonAccion: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  botonAccionTexto: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  gridReportes: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  reporteCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  reporteIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  reporteTitulo: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
    textAlign: "center",
  },
  reporteDesc: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 16,
  },
  listaContainer: {
    backgroundColor: "#F9FAFB",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  textoPlaceholder: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  textoDescripcion: {
    fontSize: 14,
    color: "#9CA3AF",
    lineHeight: 20,
    textAlign: "center",
  },
});