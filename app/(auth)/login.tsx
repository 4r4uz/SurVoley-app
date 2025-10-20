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
} from "react-native";
import { supabase } from "../../supabase/supabaseClient";
import { useAuth } from "../../types/use.auth";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import BouncyCheckbox from "react-native-bouncy-checkbox";
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
    44;
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

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={styles.container}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <View>
                {/* 
                <Ionicons name="basketball" size={42} color="#fff" />
                */}
                <Image
                  source={require("../../assets/icon.png")}
                  resizeMode="contain"
                  style={styles.logoContainer}
                />
              </View>
              <Text style={styles.title}>SURVOLEY</Text>
              <Text style={styles.subtitle}>Inicia sesión en tu cuenta</Text>
            </View>
            <View style={styles.formContainer}>
              {/* Email Input */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Correo electrónico</Text>
                <View
                  style={[
                    styles.inputContainer,
                    validationErrors.email && styles.inputError,
                  ]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={validationErrors.email ? "#ef4444" : "#6b7280"}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="tu@email.com"
                    placeholderTextColor="#9ca3af"
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
                </View>
                {validationErrors.email && (
                  <Text style={styles.errorText}>{validationErrors.email}</Text>
                )}
              </View>

              {/* Password Input */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Contraseña</Text>
                <View
                  style={[
                    styles.inputContainer,
                    validationErrors.password && styles.inputError,
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={validationErrors.password ? "#ef4444" : "#6b7280"}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#9ca3af"
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
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#6b7280"
                    />
                  </TouchableOpacity>
                </View>
                {validationErrors.password && (
                  <Text style={styles.errorText}>
                    {validationErrors.password}
                  </Text>
                )}
              </View>

              {/* Recordarme Checkbox */}
              <View style={styles.rememberMeContainer}>
                <BouncyCheckbox
                  size={20}
                  fillColor="#3f3db8ff"
                  unFillColor="#FFFFFF"
                  text="Mantener sesión iniciada"
                  iconStyle={{ borderColor: "#3f3db8ff", borderRadius: 4 }}
                  innerIconStyle={{ borderWidth: 1.5, borderRadius: 4 }}
                  textStyle={{
                    fontFamily: "System",
                    fontSize: 14,
                    color: "#374151",
                    textDecorationLine: "none",
                  }}
                  isChecked={rememberMe}
                  useBuiltInState
                  onPress={(isChecked: boolean) => setRememberMe(isChecked)}
                  disabled={loading}
                />
              </View>

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <View style={styles.buttonContent}>
                    <Ionicons name="log-in-outline" size={20} color="#fff" />
                    <Text style={styles.buttonText}>Iniciar Sesión</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Demo Credentials */}
              <View style={styles.demoContainer}>
                <Text style={styles.demoTitle}>Credenciales de Prueba</Text>
                <View style={styles.demoItem}>
                  <Ionicons name="person" size={14} color="#3f3db8ff" />
                  <Text style={styles.demoText}>
                    jugador@survoley.cl / jugador
                  </Text>
                </View>
                <View style={styles.demoItem}>
                  <Ionicons name="person" size={14} color="#3f3db8ff" />
                  <Text style={styles.demoText}>
                    entrenador@survoley.cl / entrenador
                  </Text>
                </View>
                <View style={styles.demoItem}>
                  <Ionicons name="person" size={14} color="#3f3db8ff" />
                  <Text style={styles.demoText}>
                    apoderado@survoley.cl / apoderado
                  </Text>
                </View>
                <View style={styles.demoItem}>
                  <Ionicons name="person" size={14} color="#3f3db8ff" />
                  <Text style={styles.demoText}>admin@survoley.cl / admin</Text>
                </View>
                <Text style={styles.demoNote}>
                  Usa estas credenciales para probar la aplicación
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  header: {
    backgroundColor: "#3f3db8ff",
    paddingVertical: 40,
    paddingHorizontal: 30,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    alignItems: "center",
    shadowColor: "#3f3db8ff",
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
    marginTop: 0,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },
  title: {
    fontSize: 36,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
  },
  formContainer: {
    backgroundColor: "white",
    margin: 20,
    marginTop: -20,
    padding: 18,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 25,
    elevation: 10,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 25,
    textAlign: "center",
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
  },
  inputError: {
    borderColor: "#ef4444",
  },
  inputIcon: {
    padding: 16,
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: "#1f2937",
    fontWeight: "500",
  },
  eyeIcon: {
    padding: 16,
  },
  rememberMeContainer: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  button: {
    backgroundColor: "#3f3db8ff",
    padding: 18,
    borderRadius: 14,
    marginTop: 10,
    shadowColor: "#3f3db8ff",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "700",
  },
  demoContainer: {
    marginTop: 25,
    padding: 20,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#3f3db8ff",
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
    textAlign: "center",
  },
  demoItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 8,
  },
  demoText: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
  },
  demoNote: {
    fontSize: 11,
    color: "#999",
    textAlign: "center",
    fontStyle: "italic",
    marginTop: 8,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default LoginScreen;
