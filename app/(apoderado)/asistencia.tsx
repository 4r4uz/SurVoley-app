import { View, Text, StyleSheet } from "react-native";
import { colors, typography } from "../../constants/theme";

export default function Asistencia() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Asistencia de tus hijos</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center",
    backgroundColor: colors.background,
  },
  title: { 
    ...typography.h2,
    marginBottom: 10,
  },
});