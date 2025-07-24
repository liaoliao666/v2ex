import { ViewProps, ViewStyle } from "react-native"
import { PlaceholderShape } from "./PlaceholderShape";

export interface PlaceholderLineProps extends ViewProps {
  /* The line height, default is 12  */
  height?: number;
  /* The line color, default is #efefef  */
  color?: string;
  /* The line width in percent, default is 100(%)  */
  width?: number;
  /* Defines if a line should have a margin bottom or not, default is false */
  noMargin?: boolean;
}

export const PlaceholderLine = ({ width = 100, height = 12, color = '#efefef', noMargin, ...props }: PlaceholderLineProps) => {
  const placeholderLineStyle: ViewStyle = {
    width: `${width}%`,
    height: height,
    backgroundColor: color,
    borderRadius: height / 4,
    marginBottom: noMargin ? 0 : height,
    overflow: 'hidden',
  }
  return <PlaceholderShape {...props} style={[placeholderLineStyle, props.style]} />
}
