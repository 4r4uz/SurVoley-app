import { ReactNode } from "react";
import { SafeAreaView, Edge } from "react-native-safe-area-context";
import { StyleSheet, ViewStyle } from "react-native";
import { colors } from "../constants/theme";

interface SafeLayoutProps {
  children: ReactNode;
  backgroundColor?: string;
  edges?: Edge[];
  style?: ViewStyle;
}

export default function SafeLayout({ 
  children, 
  backgroundColor = colors.background,
  edges = ["top", "bottom", "left", "right"],
  style 
}: SafeLayoutProps) {
  return (
    <SafeAreaView 
      style={[
        styles.container,
        { backgroundColor },
        style
      ]}
      edges={edges}
    >
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
