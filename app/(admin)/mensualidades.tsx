import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MensualidadesScreen() {
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1E293B" barStyle="light-content" />
      
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.welcome}>Mensualidades</Text>
            <Text style={styles.subtitle}>
              Configuración de cuotas mensuales
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollContent}>
        <View style={styles.section}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: "#7C3AED15" }]}>
                <Ionicons name="cash" size={20} color="#7C3AED" />
              </View>
              <Text style={styles.statNumber}>$45,000</Text>
              <Text style={styles.statLabel}>Cuota Básica</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: "#05966915" }]}>
                <Ionicons name="calendar" size={20} color="#059669" />
              </View>
              <Text style={styles.statNumber}>5</Text>
              <Text style={styles.statLabel}>Días Vencimiento</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Configuración de Cuotas</Text>
            <TouchableOpacity style={styles.botonAccion}>
              <Ionicons name="settings" size={20} color="#FFFFFF" />
              <Text style={styles.botonAccionTexto}>Configurar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.listaContainer}>
            <Text style={styles.textoPlaceholder}>
              Configuración de montos y vencimientos
            </Text>
            <Text style={styles.textoDescripcion}>
              • Montos por categoría{'\n'}
              • Fechas de vencimiento{'\n'}
              • Recargos por mora{'\n'}
              • Descuentos especiales
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Cuotas por Categoría</Text>
            <Text style={styles.contador}>4 categorías</Text>
          </View>

          <View style={styles.listaContainer}>
            <Text style={styles.textoPlaceholder}>
              Tarifas diferenciadas por categoría
            </Text>
            <Text style={styles.textoDescripcion}>
              • Sub-13: $40,000{'\n'}
              • Sub-15: $45,000{'\n'}
              • Sub-17: $50,000{'\n'}
              • Sub-19: $55,000
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Generación Masiva</Text>
            <TouchableOpacity style={styles.botonAccion}>
              <Ionicons name="refresh" size={20} color="#FFFFFF" />
              <Text style={styles.botonAccionTexto}>Generar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.listaContainer}>
            <Text style={styles.textoPlaceholder}>
              Generación de cuotas mensuales
            </Text>
            <Text style={styles.textoDescripcion}>
              • Generación automática mensual{'\n'}
              • Notificaciones a apoderados{'\n'}
              • Control de cuotas generadas{'\n'}
              • Historial de generación
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
  contador: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
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