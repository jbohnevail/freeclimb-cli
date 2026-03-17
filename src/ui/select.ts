import chalk from "chalk"
import { BrandColors, isTTY } from "./theme"

export interface SelectChoice<T = string> {
    name: string
    value: T
    description?: string
    disabled?: boolean | string
}

export interface SelectOptions {
    pageSize?: number
}

export async function select<T = string>(
    message: string,
    choices: Array<SelectChoice<T> | string>,
    options: SelectOptions = {}
): Promise<T> {
    if (!isTTY()) {
        throw new Error("Interactive selection requires a TTY. Use --json flag for non-interactive output.")
    }

    const normalizedChoices = choices.map((choice) => {
        if (typeof choice === "string") {
            return { name: choice, value: choice as unknown as T }
        }
        let display = choice.name
        if (choice.description) {
            display = `${choice.name} ${chalk.dim(`- ${choice.description}`)}`
        }
        return {
            name: display,
            value: choice.value,
            disabled: choice.disabled ? true : false,
        }
    })

    const { select: inquirerSelect } = await import("@inquirer/prompts")
    return inquirerSelect({
        message: chalk.hex(BrandColors.orange)(message),
        choices: normalizedChoices,
        pageSize: options.pageSize || 10,
    }) as Promise<T>
}

export async function multiSelect<T = string>(
    message: string,
    choices: Array<SelectChoice<T> | string>,
    options: SelectOptions & { required?: boolean } = {}
): Promise<T[]> {
    if (!isTTY()) {
        throw new Error("Interactive selection requires a TTY. Use --json flag for non-interactive output.")
    }

    const normalizedChoices = choices.map((choice) => {
        if (typeof choice === "string") {
            return { name: choice, value: choice as unknown as T }
        }
        let display = choice.name
        if (choice.description) {
            display = `${choice.name} ${chalk.dim(`- ${choice.description}`)}`
        }
        return {
            name: display,
            value: choice.value,
            disabled: choice.disabled ? true : false,
        }
    })

    const { checkbox: inquirerCheckbox } = await import("@inquirer/prompts")
    return inquirerCheckbox({
        message: chalk.hex(BrandColors.orange)(message),
        choices: normalizedChoices,
        pageSize: options.pageSize || 10,
        required: options.required,
    }) as Promise<T[]>
}

export async function confirm(
    message: string,
    defaultValue = false
): Promise<boolean> {
    if (!isTTY()) {
        throw new Error("Interactive confirmation requires a TTY. Use --yes flag for non-interactive mode.")
    }

    const { confirm: inquirerConfirm } = await import("@inquirer/prompts")
    return inquirerConfirm({
        message: chalk.hex(BrandColors.orange)(message),
        default: defaultValue,
    })
}

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

    if (options.mask) {
        const { password: inquirerPassword } = await import("@inquirer/prompts")
        return inquirerPassword({
            message: chalk.hex(BrandColors.orange)(message),
            mask: options.mask,
            validate: options.validate,
        })
    }

    const { input: inquirerInput } = await import("@inquirer/prompts")
    return inquirerInput({
        message: chalk.hex(BrandColors.orange)(message),
        default: options.default,
        validate: options.validate,
    })
}

export async function numberedSelect<T = string>(
    message: string,
    choices: Array<SelectChoice<T> | string>,
    options: SelectOptions = {}
): Promise<T> {
    if (!isTTY()) {
        throw new Error("Interactive selection requires a TTY. Use --json flag for non-interactive output.")
    }

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
            disabled: choice.disabled ? true : false,
        }
    })

    const { select: inquirerSelect } = await import("@inquirer/prompts")
    return inquirerSelect({
        message: chalk.hex(BrandColors.orange)(message),
        choices: normalizedChoices,
        pageSize: options.pageSize || 10,
    }) as Promise<T>
}
