declare module 'ckeditor5' {
    export class ClassicEditor {
        static create(sourceElementOrData: HTMLElement | string, config?: any): Promise<any>;
        static builtinPlugins: Array<any>;
        static defaultConfig: any;
        getData(): string;
        setData(data: string): void;
        destroy(): Promise<void>;
    }

    export const Essentials: any;
    export const Bold: any;
    export const Italic: any;
    export const Underline: any;
    export const Paragraph: any;
    export const Link: any;
    export const List: any;
    export const BlockQuote: any;
    export const Heading: any;
    export const Indent: any;
    export const Autoformat: any;
    export const Undo: any;
}

declare module '@ckeditor/ckeditor5-react' {
    import { ComponentType } from 'react';
    import { ClassicEditor } from 'ckeditor5';

    export interface CKEditorProps {
        editor: typeof ClassicEditor;
        data?: string;
        config?: any;
        onChange?: (event: any, editor: any) => void;
        onReady?: (editor: any) => void;
        onBlur?: (event: any, editor: any) => void;
        onFocus?: (event: any, editor: any) => void;
        disabled?: boolean;
    }

    export const CKEditor: ComponentType<CKEditorProps>;
}
