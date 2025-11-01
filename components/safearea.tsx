import { ReactNode } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, View } from "react-native";

interface SafeLayoutProps {
  children: ReactNode;
  backgroundColor?: string;
}

export default function SafeLayout({ children, backgroundColor }: SafeLayoutProps) {
  return (
    <SafeAreaView style={[styles.container]}>
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
