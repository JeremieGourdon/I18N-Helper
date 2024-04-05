import { Range } from 'vscode';

export type TranslationFile = { lang: string; path: string };
export type Translation = { lang: string; translation: string };
export type MissingKey = { key: string; range: Range };
export type JSONValue =
    | string
    | number
    | boolean
    | { [x: string]: JSONValue }
    | Array<JSONValue>;

export type ITranslationJSON = {
    [key: string]: JSONValue;
};
export type Configuration = {
    dirPath: string;
    mainLanguage: string;
    displayMessage: boolean;
};
