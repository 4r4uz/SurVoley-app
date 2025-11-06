import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, shadows, typography } from "../constants/theme";
import RoleBadge from "./RoleBadge";

interface UserCardProps {
  usuario: {
    id_usuario: string;
    nombre: string;
    apellido: string;
    correo: string;
    rol: string;
    estado_cuenta: boolean;
    jugador?: {
      rut?: string;
      categoria?: string;
    };
    apoderado?: {
      parentesco?: string;
    };
  };
  onEdit?: () => void;
  onDelete?: () => void;
  showDelete?: boolean;
}

//Componente de tarjeta de usuario para listados

export default function UserCard({
  usuario,
  onEdit,
  onDelete,
  showDelete = false,
}: UserCardProps) {
  const getInitials = () => {
    return `${usuario.nombre.charAt(0)}${usuario.apellido.charAt(0)}`;
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials()}</Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>
              {usuario.nombre} {usuario.apellido}
            </Text>
            <Text style={styles.userEmail}>{usuario.correo}</Text>
            <View style={styles.meta}>
              <RoleBadge rol={usuario.rol} size="sm" />
              <View
                style={[
                  styles.estadoBadge,
                  {
                    backgroundColor: usuario.estado_cuenta
                      ? "#10B98120"
                      : "#EF444420",
                    borderColor: usuario.estado_cuenta ? "#10B981" : "#EF4444",
                  },
                ]}
              >
                <Ionicons
                  name={usuario.estado_cuenta ? "checkmark-circle" : "close-circle"}
                  size={12}
                  color={usuario.estado_cuenta ? "#10B981" : "#EF4444"}
                />
                <Text
                  style={[
                    styles.estadoText,
                    {
                      color: usuario.estado_cuenta ? "#10B981" : "#EF4444",
                    },
                  ]}
                >
                  {usuario.estado_cuenta ? "Activo" : "Inactivo"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          {onEdit && (
            <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
              <Ionicons name="create" size={18} color={colors.primary} />
            </TouchableOpacity>
          )}

          {showDelete && !usuario.estado_cuenta && onDelete && (
            <TouchableOpacity
              style={styles.actionButtonDanger}
              onPress={onDelete}
            >
              <Ionicons name="trash-outline" size={18} color={colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {(usuario.jugador || usuario.apoderado) && (
        <View style={styles.infoAdicional}>
          {usuario.jugador && (
            <>
              {usuario.jugador.rut && (
                <View style={styles.infoItem}>
                  <Ionicons name="id-card" size={14} color={colors.text.secondary} />
                  <Text style={styles.infoText}>
                    RUT: {usuario.jugador.rut}
                  </Text>
                </View>
              )}
              {usuario.jugador.categoria && (
                <View style={styles.infoItem}>
                  <Ionicons name="calendar" size={14} color={colors.text.secondary} />
                  <Text style={styles.infoText}>
                    Categoría: {usuario.jugador.categoria}
                  </Text>
                </View>
              )}
            </>
          )}

          {usuario.apoderado && usuario.apoderado.parentesco && (
            <View style={styles.infoItem}>
              <Ionicons name="heart" size={14} color={colors.text.secondary} />
              <Text style={styles.infoText}>
                Parentesco: {usuario.apoderado.parentesco}
              </Text>
            </View>
          )}
        </View>
      )}

      {!usuario.estado_cuenta && showDelete && onDelete && (
        <View style={styles.seccionEliminacion}>
          <View style={styles.separador} />
          <TouchableOpacity
            style={styles.botonEliminarCompleto}
            onPress={onDelete}
          >
            <Ionicons name="trash-outline" size={16} color={colors.error} />
            <Text style={styles.botonEliminarTexto}>
              Eliminar usuario permanentemente
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: "hidden",
  },
  header: {
    padding: spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.text.inverse,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    ...typography.h3,
    marginBottom: 2,
  },
  userEmail: {
    ...typography.bodySmall,
    marginBottom: spacing.sm,
  },
  meta: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  estadoBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    gap: 4,
    borderWidth: 1,
  },
  estadoText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  actions: {
    alignItems: "flex-end",
    gap: spacing.sm,
  },
  actionButton: {
    padding: 6,
  },
  actionButtonDanger: {
    padding: 6,
    opacity: 0.7,
  },
  infoAdicional: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: 6,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoText: {
    ...typography.bodySmall,
  },
  seccionEliminacion: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  separador: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginHorizontal: spacing.lg,
  },
  botonEliminarCompleto: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: "#FEF2F2",
    margin: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  botonEliminarTexto: {
    ...typography.body,
    color: colors.error,
    fontWeight: "600",
  },
});

