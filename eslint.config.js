import tseslint from "typescript-eslint"
import eslintConfigPrettier from "eslint-config-prettier"

export default tseslint.config(
    {
        ignores: ["lib/**", "node_modules/**", "generation/**", "deployment-scripts/**"],
    },
    ...tseslint.configs.recommended,
    eslintConfigPrettier,
    {
        files: ["**/*.ts"],
        rules: {
            "no-await-in-loop": "warn",
            "prefer-destructuring": ["error", { object: true, array: false }],
            "no-var": "error",
            "no-param-reassign": ["error", { props: false }],
            "no-underscore-dangle": ["error", { allow: ["__dirname"] }],
            "no-shadow": "warn",
            "no-useless-constructor": "off",
            "no-use-before-define": "off",
            eqeqeq: "error",
            "@typescript-eslint/explicit-member-accessibility": "off",
            "@typescript-eslint/explicit-function-return-type": "off",
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-namespace": ["error", { allowDeclarations: true }],
            "@typescript-eslint/no-unused-vars": ["warn", { args: "none" }],
            "@typescript-eslint/triple-slash-reference": [
                "error",
                { path: "never", types: "never", lib: "never" },
            ],
            "@typescript-eslint/no-empty-function": "warn",
            "no-multiple-empty-lines": ["error", { max: 1, maxEOF: 1 }],
        },
    },
    {
        files: ["src/commands/*/*.ts"],
        rules: {
            "no-underscore-dangle": "off",
        },
    },
    {
        files: ["test/**/*.ts"],
        rules: {
            "@typescript-eslint/no-unused-expressions": "off",
        },
    },
)
