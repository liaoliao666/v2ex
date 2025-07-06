import { memo } from "react";
import { ViewProps, ViewStyle, View } from "react-native";

interface PlaceholderShapeProps extends ViewProps {
  color?: string;
}

export const PlaceholderShape = memo(function PlaceholderComp({
  color,
  ...props
}: PlaceholderShapeProps) {
  const placeholderShapeStyle: ViewStyle = {
    backgroundColor: color,
  };

  return (
    <View
      {...props}
      style={[placeholderShapeStyle, props.style]}
    />
  );
});
