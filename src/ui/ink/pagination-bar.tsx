import React from "react"
import { Box, Text } from "ink"
import { BrandColors, supportsColor } from "../theme"

export interface PaginationBarProps {
    hasNext: boolean
    pageNum: number
}

export function PaginationBar({
    pageNum,
    hasNext,
}: PaginationBarProps): React.ReactElement {
    const useColor = supportsColor()

    return (
        <Box paddingX={1}>
            <Text dimColor>Page {pageNum}  </Text>
            {hasNext && (
                <Text color={useColor ? BrandColors.orange : undefined}>
                    Run again with -n to see next page
                </Text>
            )}
            {!hasNext && (
                <Text dimColor>Last page</Text>
            )}
        </Box>
    )
}
