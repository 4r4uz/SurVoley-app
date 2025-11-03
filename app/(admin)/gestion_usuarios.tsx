import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  Modal,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../types/use.auth";
import { supabase } from "../../supabase/supabaseClient";
import DateTimePicker from '@react-native-community/datetimepicker';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const { height: screenHeight } = Dimensions.get("window");

interface Usuario {
  id_usuario: string;
  nombre: string;
  apellido: string;
  correo: string;
  rol: 'admin' | 'jugador' | 'entrenador' | 'apoderado';
  telefono?: string;
  estado_cuenta: boolean;
  fecha_registro: string;
  auth_id?: string;
  jugador?: {
    rut?: string;
    fecha_nacimiento?: string;
    categoria?: string;
    posicion?: string;
  };
  apoderado?: {
    parentesco?: string;
    id_jugador_tutorado?: string;
  };
}

interface Filtros {
  rol: string;
  estado: string;
  busqueda: string;
}

interface FormularioUsuario {
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  rol: string;
  estado_cuenta: boolean;
  rut?: string;
  fecha_nacimiento?: Date;
  categoria?: string;
  posicion?: string;
  parentesco?: string;
  id_jugador_tutorado?: string;
  nuevaPassword?: string;
  confirmarPassword?: string;
}

interface ErroresFormulario {
  nombre?: string;
  apellido?: string;
  correo?: string;
  telefono?: string;
  rut?: string;
  parentesco?: string;
  id_jugador_tutorado?: string;
  nuevaPassword?: string;
  confirmarPassword?: string;
  general?: string;
}

export default function GestionUsuariosScreen() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtros, setFiltros] = useState<Filtros>({
    rol: 'todos',
    estado: 'todos',
    busqueda: '',
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [modalNuevoUsuario, setModalNuevoUsuario] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mostrarDatePicker, setMostrarDatePicker] = useState(false);
  const [jugadores, setJugadores] = useState<Usuario[]>([]);
  const [errores, setErrores] = useState<ErroresFormulario>({});

  const [formulario, setFormulario] = useState<FormularioUsuario>({
    nombre: '',
    apellido: '',
    correo: '',
    telefono: '',
    rol: 'jugador',
    estado_cuenta: true,
    rut: '',
    fecha_nacimiento: new Date(),
    categoria: '',
    posicion: '',
    parentesco: '',
    nuevaPassword: '',
    confirmarPassword: '',
  });

  const stats = useMemo(() => {
    const total = usuarios.length;
    const activos = usuarios.filter(u => u.estado_cuenta).length;
    const admins = usuarios.filter(u => u.rol === 'admin').length;
    const jugadoresCount = usuarios.filter(u => u.rol === 'jugador').length;
    const entrenadores = usuarios.filter(u => u.rol === 'entrenador').length;
    const apoderados = usuarios.filter(u => u.rol === 'apoderado').length;

    return { total, activos, admins, jugadores: jugadoresCount, entrenadores, apoderados };
  }, [usuarios]);

  const getRolColor = useCallback((rol: string) => {
    switch (rol) {
      case 'admin': return '#DC2626';
      case 'entrenador': return '#2563EB';
      case 'jugador': return '#059669';
      case 'apoderado': return '#7C3AED';
      default: return '#6B7280';
    }
  }, []);

  const getRolIcon = useCallback((rol: string) => {
    switch (rol) {
      case 'admin': return 'shield';
      case 'entrenador': return 'fitness';
      case 'jugador': return 'person';
      case 'apoderado': return 'people';
      default: return 'help';
    }
  }, []);

  const cargarUsuarios = useCallback(async () => {
    try {
      setLoading(true);

      const { data: usuariosData, error: usuariosError } = await supabase
        .from('Usuarios')
        .select('*')
        .order('fecha_registro', { ascending: false });

      if (usuariosError) throw usuariosError;

      const usuariosConInfo = await Promise.all(
        (usuariosData || []).map(async (usuario) => {
          if (usuario.rol === 'jugador') {
            const { data: jugadorData } = await supabase
              .from('Jugador')
              .select('*')
              .eq('id_jugador', usuario.id_usuario)
              .single();
            return { ...usuario, jugador: jugadorData };
          } else if (usuario.rol === 'apoderado') {
            const { data: apoderadoData } = await supabase
              .from('Apoderado')
              .select('*')
              .eq('id_apoderado', usuario.id_usuario)
              .single();
            return { ...usuario, apoderado: apoderadoData };
          }
          return usuario;
        })
      );

      const jugadoresData = usuariosConInfo.filter(u => u.rol === 'jugador');
      setJugadores(jugadoresData);
      setUsuarios(usuariosConInfo);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      Alert.alert('Error', 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Aplicar filtros 
  const aplicarFiltros = useCallback(() => {
    let filtrados = usuarios;

    if (filtros.rol !== 'todos') {
      filtrados = filtrados.filter(usuario => usuario.rol === filtros.rol);
    }

    if (filtros.estado !== 'todos') {
      const estadoBool = filtros.estado === 'activo';
      filtrados = filtrados.filter(usuario => usuario.estado_cuenta === estadoBool);
    }

    if (filtros.busqueda) {
      const busquedaLower = filtros.busqueda.toLowerCase();
      filtrados = filtrados.filter(usuario =>
        usuario.nombre.toLowerCase().includes(busquedaLower) ||
        usuario.apellido.toLowerCase().includes(busquedaLower) ||
        usuario.correo.toLowerCase().includes(busquedaLower)
      );
    }

    setUsuariosFiltrados(filtrados);
  }, [usuarios, filtros]);

  const validarFormulario = (): boolean => {
    const nuevosErrores: ErroresFormulario = {};

    if (!formulario.nombre.trim()) {
      nuevosErrores.nombre = 'El nombre es obligatorio';
    } else if (formulario.nombre.trim().length < 2) {
      nuevosErrores.nombre = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!formulario.apellido.trim()) {
      nuevosErrores.apellido = 'El apellido es obligatorio';
    } else if (formulario.apellido.trim().length < 2) {
      nuevosErrores.apellido = 'El apellido debe tener al menos 2 caracteres';
    }

    if (!formulario.correo.trim()) {
      nuevosErrores.correo = 'El correo es obligatorio';
    } else if (!/^\S+@\S+\.\S+$/.test(formulario.correo)) {
      nuevosErrores.correo = 'El formato del correo no es válido';
    }

    if (formulario.telefono && !/^[\+]?[0-9\s\-\(\)]{8,}$/.test(formulario.telefono)) {
      nuevosErrores.telefono = 'El formato del teléfono no es válido';
    }

    if (formulario.rol === 'jugador') {
      if (!formulario.rut?.trim()) {
        nuevosErrores.rut = 'El RUT es obligatorio para jugadores';
      } else if (!/^[0-9]{7,8}-[0-9kK]{1}$/.test(formulario.rut)) {
        nuevosErrores.rut = 'El formato del RUT no es válido (12345678-9)';
      }
    }

    if (formulario.rol === 'apoderado') {
      if (!formulario.parentesco?.trim()) {
        nuevosErrores.parentesco = 'El parentesco es obligatorio para apoderados';
      }
      if (!formulario.id_jugador_tutorado) {
        nuevosErrores.id_jugador_tutorado = 'Debe seleccionar un jugador tutorado';
      }
    }

    if (!editando && !formulario.nuevaPassword) {
      nuevosErrores.nuevaPassword = 'La contraseña es obligatoria para nuevos usuarios';
    } else if (formulario.nuevaPassword && formulario.nuevaPassword.length < 6) {
      nuevosErrores.nuevaPassword = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (formulario.nuevaPassword !== formulario.confirmarPassword) {
      nuevosErrores.confirmarPassword = 'Las contraseñas no coinciden';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const limpiarErrores = () => {
    setErrores({});
  };

  const guardarUsuario = async () => {
    if (!validarFormulario()) {
      Alert.alert('Error', 'Por favor corrige los errores en el formulario');
      return;
    }

    setGuardando(true);
    try {
      if (editando && usuarioSeleccionado) {
        await actualizarUsuarioExistente();
      } else {
        await crearNuevoUsuario();
      }
    } catch (error: any) {
      console.error('Error guardando usuario:', error);
      
      if (error.code === '23505') {
        Alert.alert('Error', 'El correo electrónico ya está en uso');
      } else if (error.message?.includes('duplicate key')) {
        Alert.alert('Error', 'Ya existe un usuario con estos datos');
      } else {
        Alert.alert('Error', 'No se pudo guardar el usuario. Inténtalo de nuevo.');
      }
    } finally {
      setGuardando(false);
    }
  };

  const actualizarUsuarioExistente = async () => {
    if (!usuarioSeleccionado) return;

    // Actualizar usuario
    const { error: errorUsuario } = await supabase
      .from('Usuarios')
      .update({
        nombre: formulario.nombre.trim(),
        apellido: formulario.apellido.trim(),
        correo: formulario.correo.trim(),
        telefono: formulario.telefono.trim() || null,
        rol: formulario.rol,
        estado_cuenta: formulario.estado_cuenta,
      })
      .eq('id_usuario', usuarioSeleccionado.id_usuario);

    if (errorUsuario) throw errorUsuario;

    if (formulario.rol === 'jugador') {
      const { error: errorJugador } = await supabase
        .from('Jugador')
        .upsert({
          id_jugador: usuarioSeleccionado.id_usuario,
          rut: formulario.rut?.trim(),
          fecha_nacimiento: formulario.fecha_nacimiento?.toISOString().split('T')[0],
          categoria: formulario.categoria?.trim() || null,
          posicion: formulario.posicion?.trim() || null,
        });

      if (errorJugador) throw errorJugador;
    } else if (formulario.rol === 'apoderado') {
      const { error: errorApoderado } = await supabase
        .from('Apoderado')
        .upsert({
          id_apoderado: usuarioSeleccionado.id_usuario,
          parentesco: formulario.parentesco?.trim(),
          id_jugador_tutorado: formulario.id_jugador_tutorado,
        });

      if (errorApoderado) throw errorApoderado;
    }

    // Actualizar contraseña si se proporciona
    if (formulario.nuevaPassword) {
      const { error: errorPassword } = await supabase.auth.updateUser({
        password: formulario.nuevaPassword
      });

      if (errorPassword) throw errorPassword;
    }

    Alert.alert('Éxito', 'Usuario actualizado correctamente');
    setModalVisible(false);
    cargarUsuarios();
  };

  const crearNuevoUsuario = async () => {
    // Crear usuario en Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formulario.correo.trim(),
      password: formulario.nuevaPassword!,
      options: {
        data: {
          nombre: formulario.nombre.trim(),
          apellido: formulario.apellido.trim(),
        }
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('No se pudo crear el usuario');

    const { error: errorUsuario } = await supabase
      .from('Usuarios')
      .insert({
        id_usuario: authData.user.id,
        nombre: formulario.nombre.trim(),
        apellido: formulario.apellido.trim(),
        correo: formulario.correo.trim(),
        telefono: formulario.telefono.trim() || null,
        rol: formulario.rol,
        estado_cuenta: formulario.estado_cuenta,
        auth_id: authData.user.id,
      });

    if (errorUsuario) throw errorUsuario;

    // Crear información específica del rol
    if (formulario.rol === 'jugador') {
      const { error: errorJugador } = await supabase
        .from('Jugador')
        .insert({
          id_jugador: authData.user.id,
          rut: formulario.rut?.trim(),
          fecha_nacimiento: formulario.fecha_nacimiento?.toISOString().split('T')[0],
          categoria: formulario.categoria?.trim() || null,
          posicion: formulario.posicion?.trim() || null,
        });

      if (errorJugador) throw errorJugador;
    } else if (formulario.rol === 'apoderado') {
      const { error: errorApoderado } = await supabase
        .from('Apoderado')
        .insert({
          id_apoderado: authData.user.id,
          parentesco: formulario.parentesco?.trim(),
          id_jugador_tutorado: formulario.id_jugador_tutorado,
        });

      if (errorApoderado) throw errorApoderado;
    }

    Alert.alert('Éxito', 'Usuario creado correctamente');
    setModalNuevoUsuario(false);
    cargarUsuarios();
  };

  const eliminarUsuario = async (usuario: Usuario) => {
    if (usuario.estado_cuenta) {
      Alert.alert(
        'No se puede eliminar',
        'Solo se pueden eliminar usuarios con cuenta inactiva. Por favor, desactiva la cuenta primero.',
        [{ text: 'Entendido', style: 'default' }]
      );
      return;
    }

    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de que deseas eliminar permanentemente a ${usuario.nombre} ${usuario.apellido}? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              // Eliminar información específica primero
              if (usuario.rol === 'jugador') {
                await supabase
                  .from('Jugador')
                  .delete()
                  .eq('id_jugador', usuario.id_usuario);
              } else if (usuario.rol === 'apoderado') {
                await supabase
                  .from('Apoderado')
                  .delete()
                  .eq('id_apoderado', usuario.id_usuario);
              }

              // Eliminar usuario
              const { error } = await supabase
                .from('Usuarios')
                .delete()
                .eq('id_usuario', usuario.id_usuario);

              if (error) throw error;

              Alert.alert('Éxito', 'Usuario eliminado correctamente');
              cargarUsuarios();
            } catch (error) {
              console.error('Error eliminando usuario:', error);
              Alert.alert('Error', 'No se pudo eliminar el usuario');
            }
          }
        }
      ]
    );
  };

  const toggleEstadoCuenta = async (usuario: Usuario) => {
    try {
      const { error } = await supabase
        .from('Usuarios')
        .update({ estado_cuenta: !usuario.estado_cuenta })
        .eq('id_usuario', usuario.id_usuario);

      if (error) throw error;

      setUsuarios(prev => prev.map(u =>
        u.id_usuario === usuario.id_usuario
          ? { ...u, estado_cuenta: !u.estado_cuenta }
          : u
      ));

      Alert.alert(
        'Éxito',
        `Cuenta ${!usuario.estado_cuenta ? 'activada' : 'desactivada'} correctamente`
      );
    } catch (error) {
      console.error('Error actualizando estado:', error);
      Alert.alert('Error', 'No se pudo actualizar el estado de la cuenta');
    }
  };

  const abrirModalEdicion = (usuario: Usuario) => {
    setUsuarioSeleccionado(usuario);
    setEditando(true);
    
    const fechaNacimiento = usuario.jugador?.fecha_nacimiento 
      ? new Date(usuario.jugador.fecha_nacimiento)
      : new Date();

    setFormulario({
      nombre: usuario.nombre || '',
      apellido: usuario.apellido || '',
      correo: usuario.correo || '',
      telefono: usuario.telefono || '',
      rol: usuario.rol || 'jugador',
      estado_cuenta: usuario.estado_cuenta,
      rut: usuario.jugador?.rut || '',
      fecha_nacimiento: fechaNacimiento,
      categoria: usuario.jugador?.categoria || '',
      posicion: usuario.jugador?.posicion || '',
      parentesco: usuario.apoderado?.parentesco || '',
      id_jugador_tutorado: usuario.apoderado?.id_jugador_tutorado || '',
      nuevaPassword: '',
      confirmarPassword: '',
    });

    limpiarErrores();
    setModalVisible(true);
  };

  const abrirModalNuevoUsuario = () => {
    setUsuarioSeleccionado(null);
    setEditando(false);
    setFormulario({
      nombre: '',
      apellido: '',
      correo: '',
      telefono: '',
      rol: 'jugador',
      estado_cuenta: true,
      rut: '',
      fecha_nacimiento: new Date(),
      categoria: '',
      posicion: '',
      parentesco: '',
      nuevaPassword: '',
      confirmarPassword: '',
    });
    limpiarErrores();
    setModalNuevoUsuario(true);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    cargarUsuarios();
  }, [cargarUsuarios]);

  useEffect(() => {
    if (user) {
      cargarUsuarios();
    }
  }, [user, cargarUsuarios]);

  useEffect(() => {
    aplicarFiltros();
  }, [aplicarFiltros]);

const renderCampoFormulario = (
  label: string,
  value: string,
  onChange: (text: string) => void,
  campoKey: keyof ErroresFormulario, 
  placeholder?: string,
  tipo: 'text' | 'email' | 'phone' = 'text',
  obligatorio = false
) => (
  <View style={styles.campoContainer}>
    <Text style={styles.campoLabel}>
      {label} {obligatorio && <Text style={styles.obligatorio}>*</Text>}
    </Text>
    <TextInput
      style={[
        styles.campoInput,
        errores[campoKey] && styles.campoInputError
      ]}
      value={value}
      onChangeText={(text) => {
        onChange(text);
        if (errores[campoKey]) {
          setErrores(prev => ({ ...prev, [campoKey]: undefined }));
        }
      }}
      placeholder={placeholder}
      placeholderTextColor="#9CA3AF"
      keyboardType={tipo === 'email' ? 'email-address' : tipo === 'phone' ? 'phone-pad' : 'default'}
      autoCapitalize={tipo === 'email' ? 'none' : 'words'}
      secureTextEntry={campoKey.includes('Password')}
    />
    {errores[campoKey] && (
      <Text style={styles.textoError}>{errores[campoKey]}</Text>
    )}
  </View>
);

  const renderSeccionJugador = () => {
    if (formulario.rol !== 'jugador') return null;

    return (
      <View style={styles.seccionRol}>
        <Text style={styles.seccionTitulo}>Información de Jugador</Text>
        {renderCampoFormulario(
          'RUT',
          formulario.rut || '',
          (text) => setFormulario(prev => ({ ...prev, rut: text })),
          'rut',
          '12.345.678-9',
          'text',
          true,
        )}
        
        <View style={styles.campoContainer}>
          <Text style={styles.campoLabel}>Fecha de Nacimiento</Text>
          <TouchableOpacity
            style={styles.campoInput}
            onPress={() => setMostrarDatePicker(true)}
          >
            <Text style={styles.fechaTexto}>
              {formulario.fecha_nacimiento?.toLocaleDateString('es-ES')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.campoContainer}>
          <Text style={styles.campoLabel}>Categoría</Text>
          <View style={styles.opcionesGrid}>
            {['Sub-13', 'Sub-15', 'Sub-17', 'Sub-19'].map((categoria) => (
              <TouchableOpacity
                key={categoria}
                style={[
                  styles.opcionChip,
                  formulario.categoria === categoria && styles.opcionChipActive
                ]}
                onPress={() => setFormulario(prev => ({ ...prev, categoria }))}
              >
                <Text style={[
                  styles.opcionChipText,
                  formulario.categoria === categoria && styles.opcionChipTextActive
                ]}>
                  {categoria}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {renderCampoFormulario(
          'Posición',
          formulario.posicion || '',
          (text) => setFormulario(prev => ({ ...prev, posicion: text })),
          'general',
          'Delantero, Defensa, etc.',
          'text',
          false,
        )}
      </View>
    );
  };

  const renderSeccionApoderado = () => {
    if (formulario.rol !== 'apoderado') return null;

    return (
      <View style={styles.seccionRol}>
        <Text style={styles.seccionTitulo}>Información de Apoderado</Text>
        {renderCampoFormulario(
          'Parentesco',
          formulario.parentesco || '',
          (text) => setFormulario(prev => ({ ...prev, parentesco: text })),
          'parentesco',
          'Padre, Madre, Tutor...',
          'text',
          true,
        )}
        
        <View style={styles.campoContainer}>
          <Text style={styles.campoLabel}>
            Jugador Tutorado {!formulario.id_jugador_tutorado && <Text style={styles.obligatorio}>*</Text>}
          </Text>
          <View style={styles.selector}>
            {jugadores.map((jugador) => (
              <TouchableOpacity
                key={jugador.id_usuario}
                style={[
                  styles.opcionChip,
                  formulario.id_jugador_tutorado === jugador.id_usuario && styles.opcionChipActive
                ]}
                onPress={() => {
                  setFormulario(prev => ({ 
                    ...prev, 
                    id_jugador_tutorado: jugador.id_usuario 
                  }));
                  if (errores.id_jugador_tutorado) {
                    setErrores(prev => ({ ...prev, id_jugador_tutorado: undefined }));
                  }
                }}
              >
                <Text style={[
                  styles.opcionChipText,
                  formulario.id_jugador_tutorado === jugador.id_usuario && styles.opcionChipTextActive
                ]}>
                  {jugador.nombre} {jugador.apellido}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errores.id_jugador_tutorado && (
            <Text style={styles.textoError}>{errores.id_jugador_tutorado}</Text>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor="#1E293B" barStyle="light-content" />
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.welcome}>Gestión de Usuarios</Text>
              <Text style={styles.subtitle}>Cargando información...</Text>
            </View>
          </View>
        </View>
        <View style={styles.loadingContent}>
          <Ionicons name="people" size={60} color="#2563EB" />
          <Text style={styles.loadingText}>Cargando usuarios...</Text>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1E293B" barStyle="light-content" />
      
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.welcome}>Gestión de Usuarios</Text>
            <Text style={styles.subtitle}>
              Administra los usuarios del sistema
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.botonNuevo}
            onPress={abrirModalNuevoUsuario}
          >
            <Ionicons name="person-add" size={20} color="#FFFFFF" />
            <Text style={styles.botonNuevoTexto}>Nuevo</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#2563EB"]}
            tintColor="#2563EB"
          />
        }
      >
        {/* Estadísticas */}
        <View style={styles.section}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: "#2563EB15" }]}>
                <Ionicons name="people" size={20} color="#2563EB" />
              </View>
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total Usuarios</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: "#05966915" }]}>
                <Ionicons name="checkmark-circle" size={20} color="#059669" />
              </View>
              <Text style={styles.statNumber}>{stats.activos}</Text>
              <Text style={styles.statLabel}>Activos</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: "#DC262615" }]}>
                <Ionicons name="shield" size={20} color="#DC2626" />
              </View>
              <Text style={styles.statNumber}>{stats.admins}</Text>
              <Text style={styles.statLabel}>Administradores</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: "#7C3AED15" }]}>
                <Ionicons name="person" size={20} color="#7C3AED" />
              </View>
              <Text style={styles.statNumber}>{stats.jugadores}</Text>
              <Text style={styles.statLabel}>Jugadores</Text>
            </View>
          </View>
        </View>

        {/* Filtros */}
        <View style={styles.section}>
          <View style={styles.filtrosContainer}>
            <View style={styles.busquedaContainer}>
              <Ionicons name="search" size={20} color="#6B7280" />
              <TextInput
                style={styles.busquedaInput}
                placeholder="Buscar por nombre, apellido o email..."
                value={filtros.busqueda}
                onChangeText={(text) => setFiltros(prev => ({ ...prev, busqueda: text }))}
              />
            </View>

            <View style={styles.filtrosRow}>
              <View style={styles.filtroGroup}>
                <Text style={styles.filtroLabel}>Rol</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtrosScroll}>
                  <View style={styles.filtrosChips}>
                    {['todos', 'admin', 'jugador', 'entrenador', 'apoderado'].map((rol) => (
                      <TouchableOpacity
                        key={rol}
                        style={[
                          styles.filtroChip,
                          filtros.rol === rol && styles.filtroChipActive
                        ]}
                        onPress={() => setFiltros(prev => ({ ...prev, rol }))}
                      >
                        <Text style={[
                          styles.filtroChipText,
                          filtros.rol === rol && styles.filtroChipTextActive
                        ]}>
                          {rol === 'todos' ? 'Todos' : rol}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.filtroGroup}>
                <Text style={styles.filtroLabel}>Estado</Text>
                <View style={styles.filtrosChips}>
                  {['todos', 'activo', 'inactivo'].map((estado) => (
                    <TouchableOpacity
                      key={estado}
                      style={[
                        styles.filtroChip,
                        filtros.estado === estado && styles.filtroChipActive
                      ]}
                      onPress={() => setFiltros(prev => ({ ...prev, estado }))}
                    >
                      <Text style={[
                        styles.filtroChipText,
                        filtros.estado === estado && styles.filtroChipTextActive
                      ]}>
                        {estado === 'todos' ? 'Todos' : estado}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Lista de usuarios */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="list" size={20} color="#1F2937" />
              <Text style={styles.sectionTitle}>
                Usuarios ({usuariosFiltrados.length})
              </Text>
            </View>
          </View>

          {usuariosFiltrados.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No se encontraron usuarios</Text>
              <Text style={styles.emptySubtitle}>
                {filtros.busqueda || filtros.rol !== 'todos' || filtros.estado !== 'todos'
                  ? 'Intenta con otros filtros de búsqueda'
                  : 'No hay usuarios registrados en el sistema'
                }
              </Text>
            </View>
          ) : (
            <View style={styles.usuariosList}>
              {usuariosFiltrados.map((usuario) => (
                <View key={usuario.id_usuario} style={styles.usuarioCard}>
                  <View style={styles.usuarioHeader}>
                    <View style={styles.usuarioInfo}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                          {usuario.nombre.charAt(0)}{usuario.apellido.charAt(0)}
                        </Text>
                      </View>
                      <View style={styles.usuarioDetails}>
                        <Text style={styles.usuarioNombre}>
                          {usuario.nombre} {usuario.apellido}
                        </Text>
                        <Text style={styles.usuarioEmail}>{usuario.correo}</Text>
                        <View style={styles.usuarioMeta}>
                          <View style={[styles.rolBadge, { backgroundColor: getRolColor(usuario.rol) }]}>
                            <Ionicons name={getRolIcon(usuario.rol)} size={12} color="#FFFFFF" />
                            <Text style={styles.rolText}>{usuario.rol}</Text>
                          </View>
                          <View style={[styles.estadoBadge, { 
                            backgroundColor: usuario.estado_cuenta ? '#10B98120' : '#EF444420',
                            borderColor: usuario.estado_cuenta ? '#10B981' : '#EF4444'
                          }]}>
                            <Ionicons 
                              name={usuario.estado_cuenta ? 'checkmark-circle' : 'close-circle'} 
                              size={12} 
                              color={usuario.estado_cuenta ? '#10B981' : '#EF4444'} 
                            />
                            <Text style={[styles.estadoText, { 
                              color: usuario.estado_cuenta ? '#10B981' : '#EF4444'
                            }]}>
                              {usuario.estado_cuenta ? 'Activo' : 'Inactivo'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    <View style={styles.usuarioActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => abrirModalEdicion(usuario)}
                      >
                        <Ionicons name="create" size={18} color="#2563EB" />
                      </TouchableOpacity>

                      {!usuario.estado_cuenta && (
                        <TouchableOpacity
                          style={styles.actionButtonDanger}
                          onPress={() => eliminarUsuario(usuario)}
                        >
                          <Ionicons name="trash-outline" size={18} color="#6B7280" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {usuario.jugador && (
                    <View style={styles.infoAdicional}>
                      <View style={styles.infoItem}>
                        <Ionicons name="id-card" size={14} color="#6B7280" />
                        <Text style={styles.infoText}>RUT: {usuario.jugador.rut || 'No especificado'}</Text>
                      </View>
                      <View style={styles.infoItem}>
                        <Ionicons name="calendar" size={14} color="#6B7280" />
                        <Text style={styles.infoText}>Categoría: {usuario.jugador.categoria || 'No especificada'}</Text>
                      </View>
                    </View>
                  )}

                  {usuario.apoderado && (
                    <View style={styles.infoAdicional}>
                      <View style={styles.infoItem}>
                        <Ionicons name="heart" size={14} color="#6B7280" />
                        <Text style={styles.infoText}>Parentesco: {usuario.apoderado.parentesco || 'No especificado'}</Text>
                      </View>
                    </View>
                  )}

                  {!usuario.estado_cuenta && (
                    <View style={styles.seccionEliminacion}>
                      <View style={styles.separador} />
                      <TouchableOpacity
                        style={styles.botonEliminarCompleto}
                        onPress={() => eliminarUsuario(usuario)}
                      >
                        <Ionicons name="trash-outline" size={16} color="#DC2626" />
                        <Text style={styles.botonEliminarTexto}>Eliminar usuario permanentemente</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Modal de Edición */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Editar Usuario
                </Text>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={styles.modalClose}
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <KeyboardAwareScrollView
                style={styles.modalScrollContent}
                contentContainerStyle={styles.modalScrollContainer}
                enableOnAndroid={true}
                enableAutomaticScroll={true}
                extraHeight={100}
                extraScrollHeight={50}
                keyboardOpeningTime={0}
                showsVerticalScrollIndicator={true}
              >
                <View style={styles.modalBody}>
                  <View style={styles.usuarioInfoModal}>
                    <View style={styles.avatarModal}>
                      <Text style={styles.avatarTextModal}>
                        {formulario.nombre.charAt(0)}{formulario.apellido.charAt(0)}
                      </Text>
                    </View>
                    <View style={styles.usuarioInfoText}>
                      <Text style={styles.usuarioNombreModal}>
                        {formulario.nombre} {formulario.apellido}
                      </Text>
                      <Text style={styles.usuarioEmailModal}>{formulario.correo}</Text>
                    </View>
                  </View>

                  <View style={styles.seccionFormulario}>
                    <Text style={styles.seccionTitulo}>Información Básica</Text>
                    
                    {renderCampoFormulario(
                      'Nombre',
                      formulario.nombre,
                      (text) => setFormulario(prev => ({ ...prev, nombre: text })),
                      'nombre',
                      'Ingresa el nombre',
                      'text',
                      true,
                    )}

                    {renderCampoFormulario(
                      'Apellido',
                      formulario.apellido,
                      (text) => setFormulario(prev => ({ ...prev, apellido: text })),
                      'apellido',
                      'Ingresa el apellido',
                      'text',
                      true,
                    )}

                    {renderCampoFormulario(
                      'Correo Electrónico',
                      formulario.correo,
                      (text) => setFormulario(prev => ({ ...prev, correo: text })),
                      'correo',
                      'usuario@ejemplo.com',
                      'email',
                      true,
                    )}

                    {renderCampoFormulario(
                      'Teléfono',
                      formulario.telefono,
                      (text) => setFormulario(prev => ({ ...prev, telefono: text })),
                      'telefono',
                      '+56 9 1234 5678',
                      'phone',
                      false,
                    )}

                    <View style={styles.campoContainer}>
                      <Text style={styles.campoLabel}>Rol del usuario</Text>
                      <View style={styles.rolesGrid}>
                        {['admin', 'entrenador', 'jugador', 'apoderado'].map((rol) => (
                          <TouchableOpacity
                            key={rol}
                            style={[
                              styles.rolOption,
                              formulario.rol === rol && styles.rolOptionActive
                            ]}
                            onPress={() => setFormulario(prev => ({ ...prev, rol }))}
                          >
                            <Ionicons 
                              name={getRolIcon(rol)} 
                              size={20} 
                              color={formulario.rol === rol ? '#FFFFFF' : getRolColor(rol)} 
                            />
                            <Text style={[
                              styles.rolOptionText,
                              formulario.rol === rol && styles.rolOptionTextActive
                            ]}>
                              {rol}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>

                  {renderSeccionJugador()}
                  {renderSeccionApoderado()}

                  <View style={styles.seccionFormulario}>
                    <Text style={styles.seccionTitulo}>
                      Cambiar Contraseña
                    </Text>
                    <Text style={styles.seccionSubtitulo}>
                      Dejar en blanco para mantener la contraseña actual
                    </Text>
                    {renderCampoFormulario(
                      'Nueva Contraseña',
                      formulario.nuevaPassword || '',
                      (text) => setFormulario(prev => ({ ...prev, nuevaPassword: text })),
                      'nuevaPassword',
                      'Ingresa nueva contraseña',
                      'text',
                      false,
                    )}

                    {renderCampoFormulario(
                      'Confirmar Contraseña',
                      formulario.confirmarPassword || '',
                      (text) => setFormulario(prev => ({ ...prev, confirmarPassword: text })),
                      'confirmarPassword',
                      'Confirma la contraseña',
                      'text',
                      false,
                    )}
                  </View>

                  <View style={styles.campoContainer}>
                    <Text style={styles.campoLabel}>Estado de la cuenta</Text>
                    <View style={styles.estadoContainer}>
                      <Text style={styles.estadoTextModal}>
                        {formulario.estado_cuenta ? 'Activa' : 'Inactiva'}
                      </Text>
                      <Switch
                        value={formulario.estado_cuenta}
                        onValueChange={(value) => setFormulario(prev => ({ ...prev, estado_cuenta: value }))}
                        trackColor={{ false: '#D1D5DB', true: '#10B981' }}
                        thumbColor="#FFFFFF"
                      />
                    </View>
                    <Text style={styles.estadoDescripcion}>
                      {formulario.estado_cuenta 
                        ? 'El usuario puede acceder al sistema normalmente'
                        : 'El usuario no podrá iniciar sesión en el sistema'
                      }
                    </Text>
                  </View>
                </View>
              </KeyboardAwareScrollView>

              <View style={styles.botonesAccion}>
                <TouchableOpacity
                  style={styles.botonCancelar}
                  onPress={() => setModalVisible(false)}
                  disabled={guardando}
                >
                  <Text style={styles.botonCancelarTexto}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.botonGuardar, guardando && styles.botonGuardarDisabled]}
                  onPress={guardarUsuario}
                  disabled={guardando}
                >
                  {guardando ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="save" size={18} color="#FFFFFF" />
                      <Text style={styles.botonGuardarTexto}>
                        Actualizar Usuario
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {mostrarDatePicker && (
          <DateTimePicker
            value={formulario.fecha_nacimiento || new Date()}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setMostrarDatePicker(false);
              if (date) {
                setFormulario(prev => ({ ...prev, fecha_nacimiento: date }));
              }
            }}
          />
        )}
      </Modal>

      {/* Modal Nuevo Usuario */}
      <Modal
        visible={modalNuevoUsuario}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalNuevoUsuario(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Nuevo Usuario</Text>
                <TouchableOpacity
                  onPress={() => setModalNuevoUsuario(false)}
                  style={styles.modalClose}
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <KeyboardAwareScrollView
                style={styles.modalScrollContent}
                contentContainerStyle={styles.modalScrollContainer}
                enableOnAndroid={true}
                enableAutomaticScroll={true}
                extraHeight={100}
                extraScrollHeight={50}
                keyboardOpeningTime={0}
                showsVerticalScrollIndicator={true}
              >
                <View style={styles.modalBody}>
                  <View style={styles.usuarioInfoModal}>
                    <View style={styles.avatarModal}>
                      <Text style={styles.avatarTextModal}>
                        {formulario.nombre.charAt(0)}{formulario.apellido.charAt(0)}
                      </Text>
                    </View>
                    <View style={styles.usuarioInfoText}>
                      <Text style={styles.usuarioNombreModal}>
                        {formulario.nombre || 'Nuevo'} {formulario.apellido || 'Usuario'}
                      </Text>
                      <Text style={styles.usuarioEmailModal}>{formulario.correo || 'email@ejemplo.com'}</Text>
                    </View>
                  </View>

                  <View style={styles.seccionFormulario}>
                    <Text style={styles.seccionTitulo}>Información Básica</Text>
                    
                    {renderCampoFormulario(
                      'Nombre',
                      formulario.nombre,
                      (text) => setFormulario(prev => ({ ...prev, nombre: text })),
                      'nombre',
                      'Ingresa el nombre',
                      'text',
                      true,
                    )}

                    {renderCampoFormulario(
                      'Apellido',
                      formulario.apellido,
                      (text) => setFormulario(prev => ({ ...prev, apellido: text })),
                      'apellido',
                      'Ingresa el apellido',
                      'text',
                      true,
                    )}

                    {renderCampoFormulario(
                      'Correo Electrónico',
                      formulario.correo,
                      (text) => setFormulario(prev => ({ ...prev, correo: text })),
                      'correo',
                      'usuario@ejemplo.com',
                      'email',
                      true,
                    )}

                    {renderCampoFormulario(
                      'Teléfono',
                      formulario.telefono,
                      (text) => setFormulario(prev => ({ ...prev, telefono: text })),
                      'telefono',
                      '+56 9 1234 5678',
                      'phone',
                      false,
                    )}

                    <View style={styles.campoContainer}>
                      <Text style={styles.campoLabel}>Rol del usuario</Text>
                      <View style={styles.rolesGrid}>
                        {['admin', 'entrenador', 'jugador', 'apoderado'].map((rol) => (
                          <TouchableOpacity
                            key={rol}
                            style={[
                              styles.rolOption,
                              formulario.rol === rol && styles.rolOptionActive
                            ]}
                            onPress={() => setFormulario(prev => ({ ...prev, rol }))}
                          >
                            <Ionicons 
                              name={getRolIcon(rol)} 
                              size={20} 
                              color={formulario.rol === rol ? '#FFFFFF' : getRolColor(rol)} 
                            />
                            <Text style={[
                              styles.rolOptionText,
                              formulario.rol === rol && styles.rolOptionTextActive
                            ]}>
                              {rol}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>

                  {renderSeccionJugador()}
                  {renderSeccionApoderado()}

                  <View style={styles.seccionFormulario}>
                    <Text style={styles.seccionTitulo}>Contraseña</Text>
                    {renderCampoFormulario(
                      'Contraseña',
                      formulario.nuevaPassword || '',
                      (text) => setFormulario(prev => ({ ...prev, nuevaPassword: text })),
                      'nuevaPassword',
                      'Ingresa la contraseña',
                      'text',
                      true,
                    )}

                    {renderCampoFormulario(
                      'Confirmar Contraseña',
                      formulario.confirmarPassword || '',
                      (text) => setFormulario(prev => ({ ...prev, confirmarPassword: text })),
                      'confirmarPassword',
                      'Confirma la contraseña',
                      'text',
                      true,
                    )}
                  </View>
                </View>
              </KeyboardAwareScrollView>

              <View style={styles.botonesAccion}>
                <TouchableOpacity
                  style={styles.botonCancelar}
                  onPress={() => setModalNuevoUsuario(false)}
                  disabled={guardando}
                >
                  <Text style={styles.botonCancelarTexto}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.botonGuardar, guardando && styles.botonGuardarDisabled]}
                  onPress={guardarUsuario}
                  disabled={guardando}
                >
                  {guardando ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="person-add" size={18} color="#FFFFFF" />
                      <Text style={styles.botonGuardarTexto}>Crear Usuario</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {mostrarDatePicker && (
          <DateTimePicker
            value={formulario.fecha_nacimiento || new Date()}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setMostrarDatePicker(false);
              if (date) {
                setFormulario(prev => ({ ...prev, fecha_nacimiento: date }));
              }
            }}
          />
        )}
      </Modal>
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
  botonNuevo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  botonNuevoTexto: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  scrollContent: {
    flex: 1,
  },
  loadingContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
    textAlign: "center",
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
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
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
  filtrosContainer: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  busquedaContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  busquedaInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#1F2937",
  },
  filtrosRow: {
    gap: 16,
  },
  filtroGroup: {
    gap: 8,
  },
  filtroLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  filtrosScroll: {
    flexGrow: 0,
  },
  filtrosChips: {
    flexDirection: "row",
    gap: 8,
  },
  filtroChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  filtroChipActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  filtroChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "capitalize",
  },
  filtroChipTextActive: {
    color: "#FFFFFF",
  },
  usuariosList: {
    gap: 12,
  },
  usuarioCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    overflow: 'hidden',
  },
  usuarioHeader: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  usuarioInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  usuarioDetails: {
    flex: 1,
  },
  usuarioNombre: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 2,
  },
  usuarioEmail: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  usuarioMeta: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  rolBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  rolText: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  estadoBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
  },
  estadoText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  usuarioActions: {
    alignItems: "flex-end",
    gap: 8,
  },
  actionButton: {
    padding: 6,
  },
  actionButtonDanger: {
    padding: 6,
    opacity: 0.7,
  },
  infoAdicional: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 6,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    color: "#6B7280",
  },
  seccionEliminacion: {
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  separador: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginHorizontal: 16,
  },
  botonEliminarCompleto: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#FEF2F2',
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  botonEliminarTexto: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: "#FFFFFF",
    padding: 40,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  emptyTitle: {
    fontSize: 18,
    color: "#374151",
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: 'flex-end',
  },
  modalContainer: {
    width: '100%',
    height: '100%'
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flex: 1
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
  },
  modalClose: {
    padding: 4,
  },
  modalScrollContent: {
    flex: 1,
  },
  modalScrollContainer: {
    flexGrow: 1,
  },
  modalBody: {
    padding: 20,
    gap: 24,
  },
  usuarioInfoModal: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  usuarioInfoText: {
    flex: 1,
  },
  avatarModal: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarTextModal: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  usuarioNombreModal: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 2,
  },
  usuarioEmailModal: {
    fontSize: 14,
    color: "#6B7280",
  },
  seccionFormulario: {
    gap: 16,
  },
  seccionTitulo: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  seccionSubtitulo: {
    fontSize: 12,
    color: "#6B7280",
    fontStyle: 'italic',
    marginBottom: 8,
  },
  campoContainer: {
    gap: 8,
  },
  campoLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  obligatorio: {
    color: '#DC2626',
  },
  campoInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#1F2937",
    minHeight: 50,
  },
  campoInputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  textoError: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 4,
  },
  fechaTexto: {
    fontSize: 16,
    color: "#1F2937",
  },
  rolesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  rolOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  rolOptionActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  rolOptionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "capitalize",
  },
  rolOptionTextActive: {
    color: "#FFFFFF",
  },
  estadoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  estadoTextModal: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  estadoDescripcion: {
    fontSize: 12,
    color: "#6B7280",
    fontStyle: 'italic',
    marginTop: 4,
  },
  seccionRol: {
    gap: 16,
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  opcionesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  opcionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  opcionChipActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  opcionChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  opcionChipTextActive: {
    color: "#FFFFFF",
  },
  selector: {
    gap: 8,
  },
  jugadoresScroll: {
    flexGrow: 0,
  },
  botonesAccion: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    backgroundColor: "#FFFFFF",
  },
  botonCancelar: {
    flex: 1,
    padding: 16,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    alignItems: "center",
  },
  botonCancelarTexto: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  botonGuardar: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    backgroundColor: "#2563EB",
    borderRadius: 8,
  },
  botonGuardarDisabled: {
    opacity: 0.6,
  },
  botonGuardarTexto: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});