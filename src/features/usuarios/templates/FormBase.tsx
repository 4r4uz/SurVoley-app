import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows, typography } from '../../../shared/constants/theme';
import { FormularioUsuario, ErroresFormulario } from '../hooks/useForm';

interface FormBaseProps {
  formulario: FormularioUsuario;
  setFormulario: (form: FormularioUsuario) => void;
  errores: ErroresFormulario;
  guardando: boolean;
  editando: boolean;
  onGuardar: () => void;
  onCancelar: () => void;
  renderRoleSpecificFields: () => React.ReactNode;
}

const FormBase = ({
  formulario,
  setFormulario,
  errores,
  guardando,
  editando,
  onGuardar,
  onCancelar,
  renderRoleSpecificFields,
}: FormBaseProps) => {
  const renderCampo = (
    label: string,
    value: string,
    onChange: (text: string) => void,
    errorKey: keyof ErroresFormulario,
    placeholder?: string,
    keyboardType: 'default' | 'email-address' | 'phone-pad' = 'default',
    secureTextEntry = false,
    required = false
  ) => (
    <View style={styles.campoContainer}>
      <Text style={styles.campoLabel}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <TextInput
        style={[
          styles.campoInput,
          errores[errorKey] && styles.campoInputError
        ]}
        value={value}
        onChangeText={(text: string) => {
          onChange(text);
          // Clear error when user starts typing
          if (errores[errorKey]) {
            // This would need to be handled in the parent
          }
        }}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
      />
      {errores[errorKey] && (
        <Text style={styles.errorText}>{errores[errorKey]}</Text>
      )}
    </View>
  );

  const getRolIcon = (rol: string) => {
    switch (rol) {
      case 'admin': return 'shield';
      case 'entrenador': return 'fitness';
      case 'jugador': return 'person';
      case 'apoderado': return 'people';
      default: return 'help';
    }
  };

  const getRolColor = (rol: string) => {
    switch (rol) {
      case 'admin': return '#DC2626';
      case 'entrenador': return '#2563EB';
      case 'jugador': return '#059669';
      case 'apoderado': return '#7C3AED';
      default: return '#6B7280';
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* User Info Header */}
      <View style={styles.userInfoContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {formulario.nombre.charAt(0)}{formulario.apellido.charAt(0)}
          </Text>
        </View>
        <View style={styles.userInfoText}>
          <Text style={styles.userName}>
            {formulario.nombre || 'Nuevo'} {formulario.apellido || 'Usuario'}
          </Text>
          <Text style={styles.userEmail}>
            {formulario.correo || 'email@ejemplo.com'}
          </Text>
        </View>
      </View>

      {/* Basic Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información Básica</Text>

        {renderCampo(
          'Nombre',
          formulario.nombre,
          (text) => setFormulario({ ...formulario, nombre: text }),
          'nombre',
          'Ingresa el nombre',
          'default',
          false,
          true
        )}

        {renderCampo(
          'Apellido',
          formulario.apellido,
          (text) => setFormulario({ ...formulario, apellido: text }),
          'apellido',
          'Ingresa el apellido',
          'default',
          false,
          true
        )}

        {renderCampo(
          'Correo Electrónico',
          formulario.correo,
          (text) => setFormulario({ ...formulario, correo: text }),
          'correo',
          'usuario@ejemplo.com',
          'email-address',
          false,
          true
        )}

        {renderCampo(
          'Teléfono',
          formulario.telefono,
          (text) => setFormulario({ ...formulario, telefono: text }),
          'telefono',
          '+56 9 1234 5678',
          'phone-pad',
          false,
          false
        )}

        {/* Role Selection */}
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
                onPress={() => setFormulario({ ...formulario, rol })}
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

      {/* Role-specific fields */}
      {renderRoleSpecificFields && renderRoleSpecificFields()}

      {/* Password section (only for new users) */}
      {!editando && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contraseña</Text>
          {renderCampo(
            'Contraseña',
            formulario.nuevaPassword || '',
            (text) => setFormulario({ ...formulario, nuevaPassword: text }),
            'nuevaPassword',
            'Ingresa la contraseña',
            'default',
            true,
            true
          )}

          {renderCampo(
            'Confirmar Contraseña',
            formulario.confirmarPassword || '',
            (text) => setFormulario({ ...formulario, confirmarPassword: text }),
            'confirmarPassword',
            'Confirma la contraseña',
            'default',
            true,
            true
          )}
        </View>
      )}

      {/* Account Status */}
      <View style={styles.section}>
        <View style={styles.campoContainer}>
          <Text style={styles.campoLabel}>Estado de la cuenta</Text>
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              {formulario.estado_cuenta ? 'Activa' : 'Inactiva'}
            </Text>
            <TouchableOpacity
              style={[
                styles.statusToggle,
                formulario.estado_cuenta && styles.statusToggleActive
              ]}
              onPress={() => setFormulario({
                ...formulario,
                estado_cuenta: !formulario.estado_cuenta
              })}
            >
              <View style={[
                styles.statusToggleKnob,
                formulario.estado_cuenta && styles.statusToggleKnobActive
              ]} />
            </TouchableOpacity>
          </View>
          <Text style={styles.statusDescription}>
            {formulario.estado_cuenta
              ? 'El usuario puede acceder al sistema normalmente'
              : 'El usuario no podrá iniciar sesión en el sistema'
            }
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancelar}
          disabled={guardando}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, guardando && styles.saveButtonDisabled]}
          onPress={onGuardar}
          disabled={guardando}
        >
          {guardando ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons
                name={editando ? "save" : "person-add"}
                size={18}
                color="#FFFFFF"
              />
              <Text style={styles.saveButtonText}>
                {editando ? 'Actualizar Usuario' : 'Crear Usuario'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userInfoText: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  section: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  campoContainer: {
    marginBottom: spacing.lg,
  },
  campoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  required: {
    color: '#DC2626',
  },
  campoInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text.primary,
    minHeight: 50,
  },
  campoInputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: spacing.xs,
  },
  rolesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  rolOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    minWidth: '48%',
  },
  rolOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  rolOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
    textTransform: 'capitalize',
  },
  rolOptionTextActive: {
    color: '#FFFFFF',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  statusText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  statusToggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    padding: 2,
  },
  statusToggleActive: {
    backgroundColor: colors.success,
  },
  statusToggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    transform: [{ translateX: 0 }],
  },
  statusToggleKnobActive: {
    transform: [{ translateX: 22 }],
  },
  statusDescription: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  cancelButton: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  bottomSpacer: {
    height: spacing.xxl,
  },
});

export default FormBase;
