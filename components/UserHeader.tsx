import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, getRolColor, getRolIcon, typography } from "../constants/theme";

interface UserHeaderProps {
  user: {
    nombre?: string;
    apellido?: string;
    rol?: string;
  } | null;
  greeting?: string;
  showAvatar?: boolean;
  avatarColor?: string;
  roleText?: string;
}

//Componente de header con información de usuario y animaciones

export default function UserHeader({
  user,
  greeting = "¡Hola de nuevo!",
  showAvatar = true,
  avatarColor,
  roleText,
}: UserHeaderProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(25)).current;

  useEffect(() => {
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

  const rolColor = user?.rol ? getRolColor(user.rol) : colors.primary;
  const rolIcon = user?.rol ? getRolIcon(user.rol) : "person";
  const finalAvatarColor = avatarColor || rolColor;
  const displayRoleText = roleText || user?.rol || "Usuario";

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideUpAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.userInfo}>
          {showAvatar && (
            <View style={styles.avatarContainer}>
              <View style={[styles.avatar, { backgroundColor: finalAvatarColor }]}>
                {user?.nombre && user?.apellido ? (
                  <Text style={styles.avatarText}>
                    {user.nombre.charAt(0)}
                    {user.apellido.charAt(0)}
                  </Text>
                ) : (
                  <Ionicons name={rolIcon as any} size={24} color="#FFFFFF" />
                )}
              </View>
            </View>
          )}
          <View style={styles.userText}>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.userName}>
              {user?.nombre} {user?.apellido}
            </Text>
            <View style={[styles.roleBadge, { backgroundColor: rolColor }]}>
              <Ionicons name={rolIcon as any} size={12} color="#FFFFFF" />
              <Text style={styles.roleText}>{displayRoleText}</Text>
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 28,
    paddingTop: 40,
    paddingBottom: 25,
  },
  content: {
    alignItems: "flex-start",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 16,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text.inverse,
  },
  userText: {
    flex: 1,
  },
  greeting: {
    fontSize: 15,
    color: colors.text.secondary,
    fontWeight: "500",
    marginBottom: 4,
  },
  userName: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text.primary,
    lineHeight: 30,
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    gap: 4,
  },
  roleText: {
    fontSize: 11,
    color: colors.text.inverse,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});

