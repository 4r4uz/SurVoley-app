import { View, Text, StyleSheet } from "react-native";
import SafeLayout from "../../components/safearea";

export default function GestionUsuarios() {
  return (
    <SafeLayout edges={["right", "left"]}>
      <View style={styles.container}>
        <Text style={styles.title}>gestion_usuarios</Text>
      </View>
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
});
