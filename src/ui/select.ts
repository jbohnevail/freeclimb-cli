import * as inquirer from "inquirer"
import chalk from "chalk"
import { BrandColors, isTTY } from "./theme"
import { icons } from "./chars"

export interface SelectChoice<T = string> {
    name: string
    value: T
    description?: string
    disabled?: boolean | string
}

export interface SelectOptions {
    pageSize?: number
}

// Single-choice selection menu
export async function select<T = string>(
    message: string,
    choices: Array<SelectChoice<T> | string>,
    options: SelectOptions = {}
): Promise<T> {
    if (!isTTY()) {
        throw new Error("Interactive selection requires a TTY. Use --json flag for non-interactive output.")
    }

    // Normalize choices to SelectChoice format
    const normalizedChoices = choices.map((choice) => {
        if (typeof choice === "string") {
            return { name: choice, value: choice as unknown as T }
        }
        return choice
    })

    // Format choices with FreeClimb styling
    const formattedChoices = normalizedChoices.map((choice) => {
        let display = choice.name
        if (choice.description) {
            display = `${choice.name} ${chalk.dim(`- ${choice.description}`)}`
        }
        return {
            name: display,
            value: choice.value,
            disabled: choice.disabled,
        }
    })

    const { selection } = await inquirer.prompt([
        {
            type: "list",
            name: "selection",
            message: chalk.hex(BrandColors.orange)(message),
            choices: formattedChoices,
            pageSize: options.pageSize || 10,
            prefix: icons.chevron(),
        },
    ])

    return selection
}

// Multi-choice selection menu (checkboxes)
export async function multiSelect<T = string>(
    message: string,
    choices: Array<SelectChoice<T> | string>,
    options: SelectOptions & { required?: boolean } = {}
): Promise<T[]> {
    if (!isTTY()) {
        throw new Error("Interactive selection requires a TTY. Use --json flag for non-interactive output.")
    }

    // Normalize choices to SelectChoice format
    const normalizedChoices = choices.map((choice) => {
        if (typeof choice === "string") {
            return { name: choice, value: choice as unknown as T }
        }
        return choice
    })

    // Format choices with FreeClimb styling
    const formattedChoices = normalizedChoices.map((choice) => {
        let display = choice.name
        if (choice.description) {
            display = `${choice.name} ${chalk.dim(`- ${choice.description}`)}`
        }
        return {
            name: display,
            value: choice.value,
            disabled: choice.disabled,
        }
    })

    const { selections } = await inquirer.prompt([
        {
            type: "checkbox",
            name: "selections",
            message: chalk.hex(BrandColors.orange)(message),
            choices: formattedChoices,
            pageSize: options.pageSize || 10,
            prefix: icons.chevron(),
            validate: (answer: T[]) => {
                if (options.required && answer.length === 0) {
                    return "Please select at least one option"
                }
                return true
            },
        },
    ])

    return selections
}

// Yes/No confirmation prompt
export async function confirm(
    message: string,
    defaultValue = false
): Promise<boolean> {
    if (!isTTY()) {
        throw new Error("Interactive confirmation requires a TTY. Use --yes flag for non-interactive mode.")
    }

    const { confirmed } = await inquirer.prompt([
        {
            type: "confirm",
            name: "confirmed",
            message: chalk.hex(BrandColors.orange)(message),
            default: defaultValue,
            prefix: icons.chevron(),
        },
    ])

    return confirmed
}

// Text input prompt
export async function input(
    message: string,
    options: {
        default?: string
        validate?: (input: string) => boolean | string
        mask?: string
    } = {}
): Promise<string> {
    if (!isTTY()) {
        throw new Error("Interactive input requires a TTY.")
    }

    const promptType = options.mask ? "password" : "input"

    const { value } = await inquirer.prompt([
        {
            type: promptType,
            name: "value",
            message: chalk.hex(BrandColors.orange)(message),
            default: options.default,
            validate: options.validate,
            mask: options.mask,
            prefix: icons.chevron(),
        },
    ])

    return value
}

// Numbered list selection (for when you want numbered items)
export async function numberedSelect<T = string>(
    message: string,
    choices: Array<SelectChoice<T> | string>,
    options: SelectOptions = {}
): Promise<T> {
    if (!isTTY()) {
        throw new Error("Interactive selection requires a TTY. Use --json flag for non-interactive output.")
    }

    // Normalize and number choices
    const normalizedChoices = choices.map((choice, index) => {
        if (typeof choice === "string") {
            return {
                name: `${chalk.hex(BrandColors.orange)(`${index + 1}.`)} ${choice}`,
                value: choice as unknown as T,
            }
        }
        let display = `${chalk.hex(BrandColors.orange)(`${index + 1}.`)} ${choice.name}`
        if (choice.description) {
            display = `${display} ${chalk.dim(`- ${choice.description}`)}`
        }
        return {
            name: display,
            value: choice.value,
            disabled: choice.disabled,
        }
    })

    const { selection } = await inquirer.prompt([
        {
            type: "list",
            name: "selection",
            message: chalk.hex(BrandColors.orange)(message),
            choices: normalizedChoices,
            pageSize: options.pageSize || 10,
            prefix: icons.chevron(),
        },
    ])

    return selection
}
