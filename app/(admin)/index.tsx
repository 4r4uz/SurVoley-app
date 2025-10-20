import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator
} from "react-native";
import { useAuth } from '../../types/use.auth';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../supabase/supabaseClient';

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
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [cargando, setCargando] = useState(true);

  const cargarEstadisticas = async () => {
    try {
      setCargando(true);

      const { data: usuarios, error: errorUsuarios } = await supabase
        .from('Usuarios')
        .select('rol, estado_cuenta');

      const { data: mensualidades, error: errorMensualidades } = await supabase
        .from('Mensualidad')
        .select('monto, estado_pago');

      if (errorUsuarios || errorMensualidades) {
        throw new Error('Error al cargar estadísticas');
      }

      const totalUsuarios = usuarios?.length || 0;
      const totalJugadores = usuarios?.filter(u => u.rol === 'jugador').length || 0;
      const totalApoderados = usuarios?.filter(u => u.rol === 'apoderado').length || 0;
      const totalEntrenadores = usuarios?.filter(u => u.rol === 'entrenador').length || 0;
      
      const mensualidadesPagadas = mensualidades?.filter(m => m.estado_pago === 'Pagado').length || 0;
      const mensualidadesPendientes = mensualidades?.filter(m => m.estado_pago === 'Pendiente').length || 0;
      const totalRecaudado = mensualidades
        ?.filter(m => m.estado_pago === 'Pagado')
        .reduce((sum, m) => sum + (m.monto || 0), 0) || 0;

      setEstadisticas({
        totalUsuarios,
        totalJugadores,
        totalApoderados,
        totalEntrenadores,
        mensualidadesPagadas,
        mensualidadesPendientes,
        totalRecaudado
      });

    } catch (error: any) {
      Alert.alert('Error', 'No se pudieron cargar las estadísticas');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const handleSignOut = async () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro de que deseas cerrar sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Cerrar Sesión", 
          style: "destructive",
          onPress: async () => {
            try {
              await signOut();
              router.replace('/(auth)/login');
            } catch (error) {
              Alert.alert('Error', 'No se pudo cerrar la sesión');
            }
          }
        }
      ]
    );
  };

  const adminFeatures = [
    {
      title: 'Gestión de Usuarios',
      icon: 'people',
      description: 'Administrar jugadores, entrenadores y apoderados',
      color: '#3f3db8ff',
      action: () => Alert.alert('Gestión de Usuarios', 'Funcionalidad en desarrollo')
    },
    {
      title: 'Control de Asistencias',
      icon: 'calendar',
      description: 'Ver y administrar asistencias de todos los jugadores',
      color: '#4CAF50',
      action: () => Alert.alert('Control de Asistencias', 'Funcionalidad en desarrollo')
    },
    {
      title: 'Gestión de Pagos',
      icon: 'card',
      description: 'Administrar mensualidades y estados de pago',
      color: '#FF9800',
      action: () => Alert.alert('Gestión de Pagos', 'Funcionalidad en desarrollo')
    },
    {
      title: 'Reportes y Estadísticas',
      icon: 'stats-chart',
      description: 'Ver reportes de uso y rendimiento',
      color: '#9C27B0',
      action: () => Alert.alert('Reportes', 'Funcionalidad en desarrollo')
    },
    {
      title: 'Configuración del Sistema',
      icon: 'settings',
      description: 'Configurar parámetros de la aplicación',
      color: '#607D8B',
      action: () => Alert.alert('Configuración', 'Funcionalidad en desarrollo')
    },
    {
      title: 'Generar Mensualidades',
      icon: 'add-circle',
      description: 'Generar mensualidades del mes actual',
      color: '#2196F3',
      action: () => Alert.alert('Generar Mensualidades', 'Funcionalidad en desarrollo')
    }
  ];

  const formatearMonto = (monto: number) => {
    return `$${monto.toLocaleString('es-CL')}`;
  };

  if (cargando) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#3f3db8ff" />
        <Text style={styles.loadingText}>Cargando panel de administración...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.nombre?.charAt(0)}{user?.apellido?.charAt(0)}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.welcome}>Panel de Administración</Text>
            <Text style={styles.userName}>{user?.nombre} {user?.apellido}</Text>
            <View style={styles.roleBadge}>
              <Ionicons name="shield" size={14} color="#fff" />
              <Text style={styles.roleText}>Administrador</Text>
            </View>
          </View>
        </View>

        {/* Estadísticas */}
        {estadisticas && (
          <View style={styles.statsContainer}>
            <Text style={styles.sectionTitle}>Estadísticas Generales</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="people" size={24} color="#3f3db8ff" />
                <Text style={styles.statNumber}>{estadisticas.totalUsuarios}</Text>
                <Text style={styles.statLabel}>Total Usuarios</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="person" size={24} color="#4CAF50" />
                <Text style={styles.statNumber}>{estadisticas.totalJugadores}</Text>
                <Text style={styles.statLabel}>Jugadores</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="card" size={24} color="#FF9800" />
                <Text style={styles.statNumber}>{estadisticas.mensualidadesPagadas}</Text>
                <Text style={styles.statLabel}>Pagos</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="cash" size={24} color="#9C27B0" />
                <Text style={styles.statNumber}>{formatearMonto(estadisticas.totalRecaudado)}</Text>
                <Text style={styles.statLabel}>Recaudado</Text>
              </View>
            </View>
          </View>
        )}

        {/* Funcionalidades de Administración */}
        <View style={styles.featuresContainer}>
          <Text style={styles.sectionTitle}>Herramientas de Administración</Text>
          <View style={styles.featuresGrid}>
            {adminFeatures.map((feature, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.featureCard, { borderLeftColor: feature.color }]}
                onPress={feature.action}
              >
                <View style={styles.featureIconContainer}>
                  <Ionicons name={feature.icon as any} size={28} color={feature.color} />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Botón de Cerrar Sesión */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
        <Ionicons name="log-out" size={20} color="#fff" />
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    flex: 1,
  },
  header: {
    backgroundColor: "#3f3db8ff",
    padding: 25,
    paddingTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  userInfo: {
    flex: 1,
  },
  welcome: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
  },
  roleText: {
    fontSize: 11,
    color: "white",
    fontWeight: '600',
  },
  statsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: "white",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginVertical: 5,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  featuresContainer: {
    padding: 20,
    paddingTop: 0,
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
    backgroundColor: "white",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "rgba(63, 61, 184, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 11,
    color: "#666",
    lineHeight: 14,
  },
  logoutButton: {
    backgroundColor: "#dc3545",
    margin: 10,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    shadowColor: "#dc3545",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  logoutText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#3f3db8ff",
  },
});