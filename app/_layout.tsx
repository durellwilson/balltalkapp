import { Slot } from "expo-router";
import { AuthProvider } from "../contexts/auth";

export default function RootLayout() {
  // Wrap the entire app with the AuthProvider
  return (
    <AuthProvider>
      <Slot />
    </AuthProvider>
  );
}
