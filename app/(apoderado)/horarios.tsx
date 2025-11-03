import { View, Text, StyleSheet } from "react-native";

export default function Horarios() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Horarios de Entrenamiento</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
});
