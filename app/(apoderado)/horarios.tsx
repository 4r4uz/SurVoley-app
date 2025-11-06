import { View, Text, StyleSheet } from "react-native";
import { colors, typography } from "../../constants/theme";

export default function Horarios() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Horarios de Entrenamiento</Text>
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
