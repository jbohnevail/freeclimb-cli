import React from "react"
import { Box, Text } from "ink"
import { BrandColors, supportsColor } from "../theme"

export interface BorderedBoxProps {
    borderColor?: string
    children: React.ReactNode
    title?: string
    width?: number
}

export function BorderedBox({
    children,
    title,
    borderColor,
    width,
}: BorderedBoxProps): React.ReactElement {
    const color = borderColor || (supportsColor() ? BrandColors.lightTeal : undefined)

    return (
        <Box
            borderColor={color}
            borderStyle="round"
            flexDirection="column"
            paddingX={1}
            width={width}
        >
            {title && (
                <Box marginBottom={1}>
                    <Text bold color={supportsColor() ? BrandColors.orange : undefined}>
                        {title}
                    </Text>
                </Box>
            )}
            {children}
        </Box>
    )
}
