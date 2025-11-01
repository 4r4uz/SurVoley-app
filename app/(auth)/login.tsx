import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  Image,
  Dimensions,
  Animated,
} from "react-native";
import { supabase } from "../../supabase/supabaseClient";
import { useAuth } from "../../types/use.auth";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import BouncyCheckbox from "react-native-bouncy-checkbox";

const { width, height } = Dimensions.get("window");

interface ValidationErrors {
  email?: string;
  password?: string;
}

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [rememberMe, setRememberMe] = useState(false);
  const { user, isAuthenticated, setUser } = useAuth();
  const router = useRouter();
  
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideUpAnim = useState(new Animated.Value(30))[0];
  const scaleAnim = useState(new Animated.Value(0.9))[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    const keyboardDidShow = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHide = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShow.remove();
      keyboardDidHide.remove();
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      const routeMap = {
        admin: "/(admin)",
        jugador: "/(jugador)",
        apoderado: "/(apoderado)",
        entrenador: "/(entrenador)",
      };

      const timer = setTimeout(() => {
        router.replace(
          routeMap[user.rol as keyof typeof routeMap] || "/(jugador)"
        );
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user]);

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    if (!email.trim()) {
      errors.email = "El email es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Por favor ingresa un email válido";
    }

    if (!password) {
      errors.password = "La contraseña es requerida";
    } else if (password.length < 4) {
      errors.password = "La contraseña debe tener al menos 4 caracteres";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async (): Promise<void> => {
    Keyboard.dismiss();
    setValidationErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { data: users, error } = await supabase
        .from("Usuarios")
        .select(
          "id_usuario, correo, rol, nombre, apellido, estado_cuenta, password"
        )
        .eq("correo", email.trim().toLowerCase())
        .eq("estado_cuenta", true)
        .limit(1);

      if (error) {
        throw new Error("DATABASE_ERROR");
      }

      if (!users || users.length === 0) {
        throw new Error("EMAIL_NOT_FOUND");
      }

      const userData = users[0];

      if (userData.password !== password) {
        throw new Error("INVALID_PASSWORD");
      }

      const user = {
        id: userData.id_usuario,
        email: userData.correo,
        rol: userData.rol,
        nombre: userData.nombre,
        apellido: userData.apellido,
      };

      if (setUser) {
        await setUser(user, rememberMe);
      } else {
        throw new Error("SESSION_ERROR");
      }
    } catch (error: any) {
      const errorMessages: {
        [key: string]: { message: string; field?: string };
      } = {
        EMAIL_NOT_FOUND: {
          message: "El email no encontrado",
          field: "email",
        },
        INVALID_PASSWORD: {
          message: "La contraseña es incorrecta",
          field: "password",
        },
        DATABASE_ERROR: {
          message: "Error de conexión con el servidor",
        },
        SESSION_ERROR: {
          message: "Error al iniciar sesión",
        },
      };

      const errorConfig = errorMessages[error.message] || {
        message: "Error desconocido",
      };

      if (errorConfig.field) {
        setValidationErrors({ [errorConfig.field]: errorConfig.message });
      } else {
        Alert.alert("Error", errorConfig.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleSubmit = () => {
    handleLogin();
  };

  const handleQuickLogin = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={styles.container}>
        {/* elementos del fondo */}
        <View style={styles.background}>
          <View style={[styles.circle, styles.circle1]} />
          <View style={[styles.circle, styles.circle2]} />
          <View style={[styles.circle, styles.circle3]} />
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={true}
          >
            {/* Header */}
            <Animated.View 
              style={[
                styles.header,
                {
                  opacity: fadeAnim,
                  transform: [
                    { translateY: slideUpAnim },
                    { scale: scaleAnim }
                  ]
                }
              ]}
            >
              <View style={styles.logoWrapper}>
                <View style={styles.logoContainer}>
                  <Image
                    source={require("../../assets/icon.png")}
                    resizeMode="contain"
                    style={styles.logo}
                  />
                </View>
                <View style={styles.logoGlow} />
              </View>
              <Text style={styles.title}>SURVOLEY</Text>
              <Text style={styles.subtitle}>Accede a tu cuenta</Text>
            </Animated.View>

            {/* Form Section */}
            <Animated.View 
              style={[
                styles.formContainer,
                {
                  opacity: fadeAnim,
                  transform: [
                    { translateY: slideUpAnim }
                  ]
                }
              ]}
            >
              {/* Email */}
              <View style={styles.inputWrapper}>
                <View style={styles.inputHeader}>
                  <Ionicons name="mail" size={16} color="#3B82F6" />
                  <Text style={styles.inputLabel}>EMAIL</Text>
                </View>
                <TextInput
                  style={[
                    styles.input,
                    validationErrors.email && styles.inputError,
                  ]}
                  placeholder="tu@email.com"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (validationErrors.email) {
                      setValidationErrors((prev) => ({
                        ...prev,
                        email: undefined,
                      }));
                    }
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  returnKeyType="next"
                  editable={!loading}
                />
                {validationErrors.email && (
                  <Text style={styles.errorText}>{validationErrors.email}</Text>
                )}
              </View>

              {/* Password */}
              <View style={styles.inputWrapper}>
                <View style={styles.inputHeader}>
                  <Ionicons name="lock-closed" size={16} color="#3B82F6" />
                  <Text style={styles.inputLabel}>CONTRASEÑA</Text>
                </View>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.passwordInput,
                      validationErrors.password && styles.inputError,
                    ]}
                    placeholder="••••••••"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (validationErrors.password) {
                        setValidationErrors((prev) => ({
                          ...prev,
                          password: undefined,
                        }));
                      }
                    }}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off" : "eye"}
                      size={20}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                </View>
                {validationErrors.password && (
                  <Text style={styles.errorText}>{validationErrors.password}</Text>
                )}
              </View>

              {/* Opciones */}
              <View style={styles.optionsRow}>
                <View style={styles.rememberContainer}>
                  <BouncyCheckbox
                    size={20}
                    fillColor="#000000"
                    unFillColor="#FFFFFF"
                    text="Recordarme"
                    iconStyle={{ 
                      borderColor: "#D1D5DB", 
                      borderRadius: 4,
                      borderWidth: 2
                    }}
                    innerIconStyle={{ borderWidth: 0, borderRadius: 4 }}
                    textStyle={{
                      fontFamily: "System",
                      fontSize: 14,
                      color: "#374151",
                      textDecorationLine: "none",
                      fontWeight: "500",
                    }}
                    isChecked={rememberMe}
                    useBuiltInState
                    onPress={(isChecked: boolean) => setRememberMe(isChecked)}
                    disabled={loading}
                  />
                </View>
                <TouchableOpacity>
                  <Text style={styles.forgotPassword}>¿Olvidaste tu contraseña?</Text>
                </TouchableOpacity>
              </View>

              {/* botón iniciar sesión */}
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.9}
              >
                <View style={styles.buttonBackground} />
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <View style={styles.buttonContent}>
                    <Text style={styles.buttonText}>ACCEDER</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>

              {/* acceso rapido */}
              <View style={styles.quickAccess}>
                <View style={styles.quickAccessHeader}>
                  <View style={styles.divider} />
                  <Text style={styles.quickAccessText}>ACCESO RÁPIDO</Text>
                  <View style={styles.divider} />
                </View>
                
                <View style={styles.demoButtons}>
                  <TouchableOpacity 
                    style={[styles.demoButton, styles.demoButton]}
                    onPress={() => handleQuickLogin("jugador@survoley.cl", "jugador")}
                    disabled={loading}
                  >
                    <Text style={styles.demoButtonText}>Jgdr</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.demoButton, styles.demoButton]}
                    onPress={() => handleQuickLogin("entrenador@survoley.cl", "entrenador")}
                    disabled={loading}
                  >
                    <Text style={styles.demoButtonText}>Entdr</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.demoButton, styles.demoButton]}
                    onPress={() => handleQuickLogin("apoderado@survoley.cl", "apoderado")}
                    disabled={loading}
                  >
                    <Text style={styles.demoButtonText}>Apdr</Text>  
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.demoButton, styles.demoButton]}
                    onPress={() => handleQuickLogin("admin@survoley.cl", "admin")}
                    disabled={loading}
                  >
                    <Text style={styles.demoButtonText}>Adm</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.demoNote}>
                  Credenciales de prueba para desarrollo
                </Text>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  circle: {
    position: 'absolute',
    borderRadius: 500,
    backgroundColor: '#F3F4F6',
  },
  circle1: {
    width: 300,
    height: 300,
    top: -150,
    right: -100,
  },
  circle2: {
    width: 200,
    height: 200,
    bottom: -50,
    left: -50,
  },
  circle3: {
    width: 150,
    height: 150,
    top: '30%',
    left: -75,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: height * 0.01,
    paddingBottom: 40,
  },
  logoWrapper: {
    position: 'relative',
    marginBottom: 20,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
    zIndex: 2,
    aspectRatio: 1
  },
  logoGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#000000',
    opacity: 0.1,
    top: -10,
    left: -10,
    zIndex: 1,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#000000',
    marginBottom: 8,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
    letterSpacing: 1,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    padding: 32,
    borderRadius: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 15,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  inputWrapper: {
    marginBottom: 24,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#F9FAFB',
    padding: 20,
    borderRadius: 16,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
    borderWidth: 2,
    borderColor: '#F3F4F6',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 60,
  },
  eyeIcon: {
    position: 'absolute',
    right: 20,
    top: 20,
    zIndex: 1,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  rememberContainer: {
    flex: 1,
  },
  forgotPassword: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#000000',
    padding: 20,
    borderRadius: 16,
    marginBottom: 30,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  buttonBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  quickAccess: {
    marginTop: 10,
  },
  quickAccessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  quickAccessText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginHorizontal: 12,
    letterSpacing: 1,
  },
  demoButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  demoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    backgroundColor: '#3B82F6'
  },
  demoButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  demoNote: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default LoginScreen;