import { useEffect } from "react"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { Stack } from "expo-router"
import * as SplashScreen from "expo-splash-screen"
import { HeroUINativeProvider } from "heroui-native"

import "#native/styles/globals.css"

import { ConvexProvider } from "#native/components/providers/convex.provider"

export { ErrorBoundary } from "expo-router"

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync()
  }, [])

  return <RootLayoutNav />
}

function RootLayoutNav() {
  return (
    <ConvexProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <HeroUINativeProvider>
          <Stack>
            <Stack.Screen name="index" />
          </Stack>
        </HeroUINativeProvider>
      </GestureHandlerRootView>
    </ConvexProvider>
  )
}
