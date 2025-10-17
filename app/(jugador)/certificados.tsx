import { View, Text, StyleSheet, Pressable } from "react-native";
import { Link } from "expo-router";

export default function CertificadosScreen() {
    return (
        <View style={styles.container}>
            <Text>Hola</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
}); 