import React from "react";
import { View, StyleSheet } from "react-native";
import { colors } from "../constants/theme";

//Componente de fondo decorativo con bubbles

export default function BackgroundDecorativo() {
  return (
    <View style={styles.background}>
      <View style={[styles.bubble, styles.bubble1]} />
      <View style={[styles.bubble, styles.bubble2]} />
      <View style={[styles.bubble, styles.bubble3]} />
      <View style={[styles.bubble, styles.bubble4]} />
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  bubble: {
    position: "absolute",
    borderRadius: 500,
  },
  bubble1: {
    width: 220,
    height: 220,
    top: -80,
    right: -60,
    backgroundColor: colors.bubble1,
  },
  bubble2: {
    width: 180,
    height: 180,
    bottom: 120,
    left: -70,
    backgroundColor: colors.bubble2,
  },
  bubble3: {
    width: 120,
    height: 120,
    top: "35%",
    right: 40,
    backgroundColor: colors.bubble3,
  },
  bubble4: {
    width: 90,
    height: 90,
    bottom: 200,
    right: 100,
    backgroundColor: colors.bubble4,
  },
});
