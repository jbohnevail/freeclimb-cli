import { confirm as inquirerConfirm, password as inquirerPassword } from "@inquirer/prompts"

export const prompts = {
    confirm: (message: string, defaultValue = false) =>
        inquirerConfirm({ message, default: defaultValue }),
    password: (message: string) => inquirerPassword({ message }),
}
