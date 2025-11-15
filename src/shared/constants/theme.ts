//Tema y estilos compartidos de la aplicación

export const colors = {
  // Colores principales
  primary: "#2563EB",
  primaryDark: "#1E40AF",
  primaryLight: "#3B82F6",
  secondary: "#1E293B",

  // Colores de roles
  admin: "#DC2626",
  entrenador: "#2563EB",
  jugador: "#059669",
  apoderado: "#7C3AED",

  // Colores de estado
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",

  // Colores neutros
  background: "#FFFFFF",
  surface: "#F9FAFB",
  text: {
    primary: "#1F2937",
    secondary: "#6B7280",
    tertiary: "#9CA3AF",
    inverse: "#FFFFFF",
  },
  border: "#E5E7EB",
  borderLight: "#F3F4F6",

  // Colores de fondo para bubbles/decorativos
  bubble1: "#EFF6FF",
  bubble2: "#F0FDF9",
  bubble3: "#FEF7ED",
  bubble4: "#F8FAFC",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  section: 32,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
};

export const typography = {
  h1: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: colors.text.primary,
  },
  h2: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: colors.text.primary,
  },
  h3: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: colors.text.primary,
  },
  body: {
    fontSize: 14,
    fontWeight: "400" as const,
    color: colors.text.primary,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: "400" as const,
    color: colors.text.secondary,
  },
  label: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.text.primary,
  },
};

// Estilos comunes reutilizables
export const commonStyles = {
  // Tarjetas base
  card: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    shadowColor: colors.text.primary,
    shadowOffset: shadows.sm.shadowOffset,
    shadowOpacity: shadows.sm.shadowOpacity,
    shadowRadius: shadows.sm.shadowRadius,
    elevation: shadows.sm.elevation,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  // Tarjetas con fondo blanco
  whiteCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    shadowColor: colors.text.primary,
    shadowOffset: shadows.sm.shadowOffset,
    shadowOpacity: shadows.sm.shadowOpacity,
    shadowRadius: shadows.sm.shadowRadius,
    elevation: shadows.sm.elevation,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  // Tarjetas elevadas (más prominentes)
  elevatedCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.xxl,
    shadowColor: colors.text.primary,
    shadowOffset: shadows.md.shadowOffset,
    shadowOpacity: shadows.md.shadowOpacity,
    shadowRadius: shadows.md.shadowRadius,
    elevation: shadows.md.elevation,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  // Botones primarios
  primaryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    shadowColor: colors.primary,
    shadowOffset: shadows.sm.shadowOffset,
    shadowOpacity: 0.2,
    shadowRadius: shadows.sm.shadowRadius,
    elevation: shadows.sm.elevation,
  },

  // Botones secundarios
  secondaryButton: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Botones de acción rápida (círculos pequeños)
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    shadowColor: colors.text.primary,
    shadowOffset: shadows.sm.shadowOffset,
    shadowOpacity: shadows.sm.shadowOpacity,
    shadowRadius: shadows.sm.shadowRadius,
    elevation: shadows.sm.elevation,
  },

  // Contenedores de iconos
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },

  // Contenedores de iconos pequeños
  smallIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },

  // Elementos de detalle (ubicación, hora, etc.)
  detailItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: spacing.sm,
  },

  // Headers de sección
  sectionHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },

  // Contenedores de búsqueda
  searchContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.text.primary,
    shadowOffset: shadows.sm.shadowOffset,
    shadowOpacity: shadows.sm.shadowOpacity,
    shadowRadius: shadows.sm.shadowRadius,
    elevation: shadows.sm.elevation,
  },

  // Filtros de tipo
  typeFilter: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 25,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },

  // Badges de estado
  statusBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xl,
    gap: spacing.xs,
  },

  // Headers de tarjetas
  cardHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    marginBottom: spacing.md,
    gap: spacing.md,
  },

  // Contenido de tarjetas
  cardContent: {
    gap: spacing.sm,
  },

  // Contenedores vacíos
  emptyContainer: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
    padding: spacing.xxxl,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed" as const,
  },
};

/**
 * Obtiene el color asociado a un rol
 */
export const getRolColor = (rol: string): string => {
  switch (rol) {
    case 'admin': return colors.admin;
    case 'entrenador': return colors.entrenador;
    case 'jugador': return colors.jugador;
    case 'apoderado': return colors.apoderado;
    default: return colors.text.tertiary;
  }
};

/**
 * Obtiene el icono asociado a un rol
 */
export const getRolIcon = (rol: string): string => {
  switch (rol) {
    case 'admin': return 'shield';
    case 'entrenador': return 'fitness';
    case 'jugador': return 'person';
    case 'apoderado': return 'people';
    default: return 'help';
  }
};
