class FakeElement {
    public outputX: number
    public outputY: number
    public outputWidth: number
    public outputHeight: number
    public constructorOptions: Record<string, any>
    private handlers: Record<string, Function[]> = {}

    public constructor(options: Record<string, any> = {}) {
        this.constructorOptions = options
        this.outputX = options.x ?? 0
        this.outputY = options.y ?? 0
        this.outputWidth = options.width ?? 0
        this.outputHeight = options.height ?? 0
    }

    public on(event: string, cb: Function) {
        if (!this.handlers[event]) {this.handlers[event] = []}
        this.handlers[event].push(cb)
    }

    public draw() {}
    public destroy() {}
    public resize(options: Record<string, any>) {
        if (options.x !== undefined) {this.outputX = options.x}
        if (options.y !== undefined) {this.outputY = options.y}
        if (options.width !== undefined) {this.outputWidth = options.width}
        if (options.height !== undefined) {this.outputHeight = options.height}
    }
}

class TextBox extends FakeElement {
    public content = ''
    public scrollY = 0
    public scrollX = 0
    public textAreaHeight = 0
    public textBuffer = {
        cy: 0,
        selectionRegion: null as any,
        setSelectionRegion(_: any) {},
    }

    public setContent(content: string) {
        this.content = content
    }

    public setSizeAndPosition(opts: Record<string, any>) {
        this.resize(opts)
    }

    public scrollToBottom() {}
}

class Bar extends FakeElement {
    public setValue(_: number) {}
    public setContent(_: string) {}
}

class Layout extends FakeElement {
    public computed = { xmin: 0, ymin: 0, width: 80, height: 24 }
    public zChildren: any[] = []
    public updateLayout() {}
    public addRow(_row: any) {}
    public setRowHeight(_idx: number, _h: any) {}
    public addColumn(_idx: number, _col: any) {}
    public setColumnWidth(_opts: any) {}
    public getRows() { return [] }
    public off(_event: string, _cb: any) {}
    public onParentResize() {}
}

class Palette {}

const fakeDocument = {
    eventSource: { on(_event: string, _cb: any) {} },
    __widget: null as any,
    inputWidth: 120,
    inputHeight: 40,
    focusElement: { __widget: null },
    giveFocusTo: (_el: any) => {},
    destroy: () => {},
}

const fakeTerm = {
    createDocument: () => fakeDocument,
    grabInput: (_opts: any) => {},
    on: (_event: string, _cb: any) => {},
    hideCursor: (_v: boolean) => {},
    windowTitle: (_t: string) => {},
    styleReset: () => {},
    clear: () => {},
    removeAllListeners: () => {},
}

const terminalKit = {
    terminal: fakeTerm,
    TextBox,
    Bar,
    Layout,
    Palette,
}

export default terminalKit
