import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, commonStyles, spacing } from "../constants/theme";

interface SupervisedPlayer {
  id_jugador: string;
  nombre: string;
  apellido: string;
  correo: string;
  fecha_nacimiento?: string;
  estadisticas?: {
    asistencia: number;
    mensualidades: number;
    certificados: number;
  };
}

interface PlayerSupervisionCardProps {
  player: SupervisedPlayer;
  onPress?: () => void;
  showStats?: boolean;
  showArrow?: boolean;
}

export const PlayerSupervisionCard = ({
  player,
  onPress,
  showStats = true,
  showArrow = true
}: PlayerSupervisionCardProps) => {
  const getInitials = (nombre: string, apellido: string) => {
    return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
  };

  const getAge = (fechaNacimiento?: string) => {
    if (!fechaNacimiento) return null;
    const birthDate = new Date(fechaNacimiento);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = getAge(player.fecha_nacimiento);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View style={styles.playerInfo}>
          <View style={[commonStyles.iconContainer, { backgroundColor: colors.apoderado }]}>
            <Text style={styles.avatarText}>
              {getInitials(player.nombre, player.apellido)}
            </Text>
          </View>
          <View style={styles.playerDetails}>
            <Text style={styles.playerName}>
              {player.nombre} {player.apellido}
            </Text>
            {age && (
              <Text style={styles.playerAge}>{age} años</Text>
            )}
          </View>
        </View>
        {showArrow && (
          <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
        )}
      </View>

      {showStats && player.estadisticas && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: colors.success + "20" }]}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            </View>
            <View>
              <Text style={styles.statValue}>{player.estadisticas.asistencia}%</Text>
              <Text style={styles.statLabel}>Asistencia</Text>
            </View>
          </View>

          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: colors.warning + "20" }]}>
              <Ionicons name="card" size={16} color={colors.warning} />
            </View>
            <View>
              <Text style={styles.statValue}>{player.estadisticas.mensualidades}</Text>
              <Text style={styles.statLabel}>Mensualidades</Text>
            </View>
          </View>

          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: colors.info + "20" }]}>
              <Ionicons name="document-text" size={16} color={colors.info} />
            </View>
            <View>
              <Text style={styles.statValue}>{player.estadisticas.certificados}</Text>
              <Text style={styles.statLabel}>Certificados</Text>
            </View>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    ...commonStyles.card,
    marginBottom: spacing.md,
  },
  cardHeader: {
    ...commonStyles.cardHeader,
    justifyContent: "space-between",
  },
  playerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: 2,
  },
  playerAge: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text.inverse,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text.primary,
    textAlign: "center",
  },
  statLabel: {
    fontSize: 10,
    color: colors.text.secondary,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
