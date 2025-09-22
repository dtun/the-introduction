import { StyleSheet } from "react-native";

import { View } from "@/components/Themed";
import UserProfileForm from "@/components/UserProfileForm";

export default function TabOneScreen() {
  return (
    <View style={styles.container}>
      <UserProfileForm />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
