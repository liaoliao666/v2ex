import { StyleSheet, View, ViewProps } from "react-native";

export interface PlaceholderProps extends ViewProps {
  /* An optional component to display on the left */
  Left?: React.ComponentType<ViewProps>;
  /* An optional component to display on the right */
  Right?: React.ComponentType<ViewProps>;
}

const styles = StyleSheet.create({
  full: {
    flex: 1,
  },
  left: {
    marginRight: 12,
  },
  right: {
    marginLeft: 12,
  },
  row: { flexDirection: "row", width: "100%" },
})

export const Placeholder = ({
  Left,
  Right,
  style,
  children,
  ...props
}: PlaceholderProps) => {
  return (
    <View style={[styles.row, style]} {...props}>
      {Left && <Left style={styles.left} />}
      <View style={styles.full}>{children}</View>
      {Right && <Right style={styles.right} />}
    </View>
  )
}
