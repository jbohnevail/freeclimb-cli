import React from "react"
import { Box, Text } from "ink"
import { BrandColors, supportsColor } from "../theme"

export interface SuccessMessageProps {
    command?: string
    message?: string
}

export function SuccessMessage({
    message,
    command,
}: SuccessMessageProps): React.ReactElement {
    const useColor = supportsColor()
    const displayMessage = message || "Received a success code from FreeClimb. There is no further output."

    return (
        <Box paddingX={1}>
            <Text color={useColor ? BrandColors.lime : undefined}>
                {"\u2714"} {displayMessage}
            </Text>
            {command && (
                <Text dimColor> ({command})</Text>
            )}
        </Box>
    )
}
