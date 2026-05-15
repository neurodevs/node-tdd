declare module 'terminal-kit' {
    export interface Terminal {
        (text?: string, ...args: any[]): Terminal
        hideCursor(hide?: boolean): void
        windowTitle(title: string): void
        styleReset(): void
        grabInput(state: boolean, extra?: boolean): Promise<void>
        clear(): void
        on(event: string, listener: (...args: any[]) => void): this
        removeAllListeners(event?: string): this
        createDocument(options?: any): any
        [key: string]: any
    }

    const terminal: Terminal

    export { terminal }
    export default { terminal } & Record<string, any>

    export class Palette {}
    export class Button {}
    export class DropDownMenu {}
    export class InlineInput {}
    export class Layout {}
    export class Bar {}
    export class TextBox {}
    export class Window {}
}
