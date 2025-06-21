import { useTheme } from '@react-navigation/native';
import { useAtomValue } from 'jotai';
import { noop } from 'lodash-es';
import { createContext, useContext, useEffect, useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { Drawer as RawDrawer } from 'react-native-drawer-layout';
import { useSafeAreaFrame } from 'react-native-safe-area-context'

import { uiAtom } from '@/jotai/uiAtom'

const DRAWER_BORDER_RADIUS = 16

const getDefaultSidebarWidth = ({
  height,
  width,
}: {
  height: number
  width: number
}) => {
  /*
   * Default sidebar width is screen width - header height
   * with a max width of 280 on mobile and 320 on tablet
   * https://material.io/components/navigation-drawer
   */
  const smallerAxisSize = Math.min(height, width)
  const isLandscape = width > height
  const isTablet = smallerAxisSize >= 600
  const appBarHeight = Platform.OS === 'ios' ? (isLandscape ? 32 : 44) : 56
  const maxWidth = isTablet ? 320 : 280

  return Math.min(smallerAxisSize - appBarHeight, maxWidth)
}

const DrwaerContext = createContext<
  [boolean, React.Dispatch<React.SetStateAction<boolean>>]
>([false, noop])

export function useDrawer() {
  return useContext(DrwaerContext)
}

export default function Drawer({
  drawerType = 'slide',
  drawerPosition = 'left',
  drawerStyle,
  ...props
}: Partial<Parameters<typeof RawDrawer>[0]>) {
  const { colors } = useAtomValue(uiAtom)
  const dimensions = useSafeAreaFrame()
  const state = useState(false)
  const [open, setOpen] = state

  return (
    <DrwaerContext.Provider value={state}>
      <RawDrawer
        open={open}
        onClose={() => setOpen(false)}
        onOpen={() => setOpen(true)}
        drawerType={drawerType}
        layout={dimensions}
        drawerStyle={[
          {
            width: getDefaultSidebarWidth(dimensions),
          },
          drawerType === 'permanent' &&
            (drawerPosition === 'left'
              ? {
                  borderEndColor: colors.divider,
                  borderEndWidth: StyleSheet.hairlineWidth,
                }
              : {
                  borderStartColor: colors.divider,
                  borderStartWidth: StyleSheet.hairlineWidth,
                }),

          drawerType === 'front' &&
            (drawerPosition === 'left'
              ? {
                  borderTopRightRadius: DRAWER_BORDER_RADIUS,
                  borderBottomRightRadius: DRAWER_BORDER_RADIUS,
                }
              : {
                  borderTopLeftRadius: DRAWER_BORDER_RADIUS,
                  borderBottomLeftRadius: DRAWER_BORDER_RADIUS,
                }),
          drawerStyle,
        ]}
        {...(props as any)}
      />
    </DrwaerContext.Provider>
  )
}
