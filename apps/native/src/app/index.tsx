import { View } from "react-native"
import { Button } from "heroui-native"

export default function MyComponent() {
  return (
    <View className="bg-background flex-1 items-center justify-center">
      <Button onPress={() => console.log("Pressed!")}>Get Started</Button>
    </View>
  )
}
