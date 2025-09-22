import { StyleSheet } from "react-native";

import ChatInterface from "@/components/ChatInterface";
import { View } from "@/components/Themed";

export default function TabTwoScreen() {
  return (
    <View style={styles.container}>
      <ChatInterface />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
