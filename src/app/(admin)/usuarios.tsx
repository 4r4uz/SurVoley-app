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
  TextInput,
} from "react-native";
import { useAuth } from "../../core/auth/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../core/supabase/supabaseClient";
import SafeLayout from "../../shared/components/SafeLayout";
import AdminFormModal, { FormSection, FormField } from "../../shared/components/AdminFormModal";
import { colors } from "../../shared/constants/theme";

const { width } = Dimensions.get("window");

interface Usuario {
  id_usuario: string;
  nombre: string;
  apellido: string;
  correo: string;
  rol: string;
  estado_cuenta: boolean;
  created_at: string;
}

interface UsuarioForm {
  nombre: string;
  apellido: string;
  correo: string;
  rol: string;
  estado_cuenta: boolean;
}

const ROLES = [
  { label: "Jugador", value: "jugador" },
  { label: "Apoderado", value: "apoderado" },
  { label: "Entrenador", value: "entrenador" },
  { label: "Administrador", value: "admin" },
];

export default function GestionUsuariosScreen() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("todos");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState<UsuarioForm>({
    nombre: "",
    apellido: "",
    correo: "",
    rol: "jugador",
    estado_cuenta: true,
  });

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("Usuarios")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsuarios(data || []);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
      Alert.alert("Error", "No se pudieron cargar los usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const usuariosFiltrados = usuarios.filter((usuario) => {
    const matchesSearch =
      usuario.nombre.toLowerCase().includes(searchText.toLowerCase()) ||
      usuario.apellido.toLowerCase().includes(searchText.toLowerCase()) ||
      usuario.correo.toLowerCase().includes(searchText.toLowerCase());

    const matchesRole = selectedRole === "todos" || usuario.rol === selectedRole;

    return matchesSearch && matchesRole;
  });

  const abrirModalCrear = () => {
    setEditingUser(null);
    setFormData({
      nombre: "",
      apellido: "",
      correo: "",
      rol: "jugador",
      estado_cuenta: true,
    });
    setModalVisible(true);
  };

  const abrirModalEditar = (usuario: Usuario) => {
    setEditingUser(usuario);
    setFormData({
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      correo: usuario.correo,
      rol: usuario.rol,
      estado_cuenta: usuario.estado_cuenta,
    });
    setModalVisible(true);
  };

  const guardarUsuario = async () => {
    try {
      if (!formData.nombre.trim() || !formData.apellido.trim() || !formData.correo.trim()) {
        Alert.alert("Error", "Todos los campos son obligatorios");
        return;
      }

      if (editingUser) {
        // Actualizar usuario existente
        const { error } = await supabase
          .from("Usuarios")
          .update({
            nombre: formData.nombre.trim(),
            apellido: formData.apellido.trim(),
            correo: formData.correo.trim().toLowerCase(),
            rol: formData.rol,
            estado_cuenta: formData.estado_cuenta,
          })
          .eq("id_usuario", editingUser.id_usuario);

        if (error) throw error;
        Alert.alert("Éxito", "Usuario actualizado correctamente");
      } else {
        // Crear nuevo usuario
        const { error } = await supabase
          .from("Usuarios")
          .insert([{
            nombre: formData.nombre.trim(),
            apellido: formData.apellido.trim(),
            correo: formData.correo.trim().toLowerCase(),
            rol: formData.rol,
            estado_cuenta: formData.estado_cuenta,
            password: "123456", // Contraseña por defecto
          }]);

        if (error) throw error;
        Alert.alert("Éxito", "Usuario creado correctamente");
      }

      setModalVisible(false);
      cargarUsuarios();
    } catch (error: any) {
      console.error("Error guardando usuario:", error);
      Alert.alert("Error", error.message || "No se pudo guardar el usuario");
    }
  };

  const toggleEstadoUsuario = async (usuario: Usuario) => {
    try {
      const { error } = await supabase
        .from("Usuarios")
        .update({ estado_cuenta: !usuario.estado_cuenta })
        .eq("id_usuario", usuario.id_usuario);

      if (error) throw error;

      Alert.alert(
        "Éxito",
        `Usuario ${!usuario.estado_cuenta ? "activado" : "desactivado"} correctamente`
      );
      cargarUsuarios();
    } catch (error) {
      console.error("Error cambiando estado:", error);
      Alert.alert("Error", "No se pudo cambiar el estado del usuario");
    }
  };

  const eliminarUsuario = async (usuario: Usuario) => {
    Alert.alert(
      "Confirmar eliminación",
      `¿Estás seguro de eliminar a ${usuario.nombre} ${usuario.apellido}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("Usuarios")
                .delete()
                .eq("id_usuario", usuario.id_usuario);

              if (error) throw error;
              Alert.alert("Éxito", "Usuario eliminado correctamente");
              cargarUsuarios();
            } catch (error) {
              console.error("Error eliminando usuario:", error);
              Alert.alert("Error", "No se pudo eliminar el usuario");
            }
          },
        },
      ]
    );
  };

  const getRoleColor = (rol: string) => {
    switch (rol) {
      case "admin": return colors.primaryDark;
      case "jugador": return colors.jugador;
      case "apoderado": return colors.apoderado;
      case "entrenador": return colors.entrenador;
      default: return colors.primary;
    }
  };

  const getRoleIcon = (rol: string) => {
    switch (rol) {
      case "admin": return "shield";
      case "jugador": return "person";
      case "apoderado": return "people";
      case "entrenador": return "fitness";
      default: return "person";
    }
  };

  // Configuración del formulario para AdminFormModal
  const formSections: FormSection[] = [
    {
      title: "Información Personal",
      icon: "person",
      fields: [
        {
          name: "nombre",
          label: "Nombre",
          type: "text",
          value: formData.nombre,
          onChange: (value) => setFormData({...formData, nombre: value}),
          required: true,
          placeholder: "Ingresa el nombre",
          icon: "person-outline",
        },
        {
          name: "apellido",
          label: "Apellido",
          type: "text",
          value: formData.apellido,
          onChange: (value) => setFormData({...formData, apellido: value}),
          required: true,
          placeholder: "Ingresa el apellido",
          icon: "person-outline",
        },
      ],
    },
    {
      title: "Información de Cuenta",
      icon: "mail",
      fields: [
        {
          name: "correo",
          label: "Correo Electrónico",
          type: "email",
          value: formData.correo,
          onChange: (value) => setFormData({...formData, correo: value}),
          required: true,
          placeholder: "usuario@ejemplo.com",
          icon: "mail-outline",
        },
      ],
    },
    {
      title: "Configuración",
      icon: "settings",
      fields: [
        {
          name: "rol",
          label: "Rol del Usuario",
          type: "select",
          value: formData.rol,
          onChange: (value) => setFormData({...formData, rol: value}),
          options: ROLES.map(role => ({ label: role.label, value: role.value })),
        },
        {
          name: "estado_cuenta",
          label: "Estado de la Cuenta",
          type: "toggle",
          value: formData.estado_cuenta,
          onChange: (value) => setFormData({...formData, estado_cuenta: value}),
          options: [
            { label: "Activo", value: true },
            { label: "Inactivo", value: false },
          ],
        },
      ],
    },
  ];

  if (loading) {
    return (
      <SafeLayout>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando usuarios...</Text>
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
              <Ionicons name="people" size={28} color="#8B5CF6" />
              <View>
                <Text style={styles.title}>Gestión de Usuarios</Text>
                <Text style={styles.subtitle}>
                  Administra todos los usuarios del sistema
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.quickStatCard}>
              <Text style={styles.quickStatNumber}>{usuarios.length}</Text>
              <Text style={styles.quickStatLabel}>Total</Text>
            </View>
            <View style={styles.quickStatCard}>
              <Text style={styles.quickStatNumber}>
                {usuarios.filter(u => u.estado_cuenta).length}
              </Text>
              <Text style={styles.quickStatLabel}>Activos</Text>
            </View>
            <View style={styles.quickStatCard}>
              <Text style={styles.quickStatNumber}>
                {usuarios.filter(u => !u.estado_cuenta).length}
              </Text>
              <Text style={styles.quickStatLabel}>Inactivos</Text>
            </View>
          </View>
        </View>

        {/* Filters Section */}
        <View style={styles.filtersSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nombre, apellido o email..."
              value={searchText}
              onChangeText={setSearchText}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText("")}>
                <Ionicons name="close-circle" size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.roleFiltersContainer}>
            <Text style={styles.filterTitle}>Filtrar por rol:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roleFilters}>
              <TouchableOpacity
                style={[styles.roleFilter, selectedRole === "todos" && styles.roleFilterActive]}
                onPress={() => setSelectedRole("todos")}
              >
                <Ionicons name="apps" size={16} color={selectedRole === "todos" ? "#FFFFFF" : "#6B7280"} />
                <Text style={[styles.roleFilterText, selectedRole === "todos" && styles.roleFilterTextActive]}>
                  Todos
                </Text>
              </TouchableOpacity>
              {ROLES.map((role) => (
                <TouchableOpacity
                  key={role.value}
                  style={[styles.roleFilter, selectedRole === role.value && styles.roleFilterActive]}
                  onPress={() => setSelectedRole(role.value)}
                >
                  <Ionicons
                    name={getRoleIcon(role.value) as any}
                    size={16}
                    color={selectedRole === role.value ? "#FFFFFF" : "#6B7280"}
                  />
                  <Text style={[styles.roleFilterText, selectedRole === role.value && styles.roleFilterTextActive]}>
                    {role.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Users List */}
        <View style={styles.usersSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="list" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>
                Usuarios ({usuariosFiltrados.length})
              </Text>
            </View>
            <TouchableOpacity style={styles.addButton} onPress={abrirModalCrear}>
              <Ionicons name="add-circle" size={18} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Nuevo</Text>
            </TouchableOpacity>
          </View>

          {usuariosFiltrados.length > 0 ? (
            usuariosFiltrados.map((usuario) => (
              <View key={usuario.id_usuario} style={styles.userCard}>
                <View style={styles.userHeader}>
                  <View style={styles.userAvatar}>
                    <Text style={styles.avatarText}>
                      {usuario.nombre.charAt(0)}{usuario.apellido.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>
                      {usuario.nombre} {usuario.apellido}
                    </Text>
                    <Text style={styles.userEmail}>{usuario.correo}</Text>
                  </View>
                  <View style={styles.userActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() => abrirModalEditar(usuario)}
                    >
                      <Ionicons name="pencil" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                    {!usuario.estado_cuenta && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => {
                          Alert.alert(
                            "Eliminar Usuario",
                            `¿Estás seguro de eliminar permanentemente a ${usuario.nombre} ${usuario.apellido}?`,
                            [
                              { text: "Cancelar", style: "cancel" },
                              {
                                text: "Eliminar",
                                style: "destructive",
                                onPress: () => eliminarUsuario(usuario),
                              },
                            ]
                          );
                        }}
                      >
                        <Ionicons name="trash" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <View style={styles.userFooter}>
                  <View style={[styles.roleBadge, { backgroundColor: getRoleColor(usuario.rol) }]}>
                    <Ionicons name={getRoleIcon(usuario.rol) as any} size={12} color="#FFFFFF" />
                    <Text style={styles.roleText}>
                      {ROLES.find(r => r.value === usuario.rol)?.label || usuario.rol}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, {
                    backgroundColor: usuario.estado_cuenta ? "#10B981" : "#EF4444"
                  }]}>
                    <View style={[styles.statusDot, {
                      backgroundColor: usuario.estado_cuenta ? "#34D399" : "#F87171"
                    }]} />
                    <Text style={styles.statusText}>
                      {usuario.estado_cuenta ? "Activo" : "Inactivo"}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="people-outline" size={48} color="#D1D5DB" />
              </View>
              <Text style={styles.emptyTitle}>No hay usuarios</Text>
              <Text style={styles.emptyDescription}>
                No se encontraron usuarios con los filtros aplicados
              </Text>
              <TouchableOpacity style={styles.emptyAction} onPress={abrirModalCrear}>
                <Ionicons name="add-circle" size={18} color={colors.primary} />
                <Text style={styles.emptyActionText}>Crear primer usuario</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <AdminFormModal
        visible={modalVisible}
        title={editingUser ? "Editar Usuario" : "Crear Nuevo Usuario"}
        subtitle={editingUser ? "Modifica la información del usuario" : "Ingresa los datos del nuevo usuario"}
        icon="person-add"
        sections={formSections}
        onSave={guardarUsuario}
        onCancel={() => setModalVisible(false)}
        isEditing={!!editingUser}
        loading={false}
      />
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
  quickStats: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  quickStatNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  // Filters Section
  filtersSection: {
    padding: 20,
    backgroundColor: "#F8FAFC",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#1F2937",
  },
  roleFiltersContainer: {
    marginBottom: 8,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  roleFilters: {
    flexDirection: "row",
  },
  roleFilter: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 6,
  },
  roleFilterActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roleFilterText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  roleFilterTextActive: {
    color: "#FFFFFF",
  },
  // Users Section
  usersSection: {
    flex: 1,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  // User Cards
  userCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: "#6B7280",
  },
  userActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  editButton: {
    backgroundColor: "#3B82F6",
  },
  statusButton: {
    backgroundColor: "#F59E0B",
  },
  deleteButton: {
    backgroundColor: "#EF4444",
  },
  userFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  roleText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  // Empty State
  emptyContainer: {
    alignItems: "center",
    padding: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    color: "#374151",
    fontWeight: "600",
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 20,
  },
  emptyAction: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 8,
  },
  emptyActionText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

});
