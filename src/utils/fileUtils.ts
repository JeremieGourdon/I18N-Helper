import { readFileSync, readdirSync, watch, writeFileSync } from 'fs';
import { window, InputBoxOptions } from 'vscode';
import { Trie } from './Trie';
import { ITranslationJSON, JSONValue, TranslationFile } from './types';

// Util to parse and sort JSON objects
const sortObjectKeys = (obj: ITranslationJSON): ITranslationJSON => {
    return Object.keys(obj)
        .sort()
        .reduce((acc: ITranslationJSON, key: string) => {
            acc[key] =
                obj[key] instanceof Object && !Array.isArray(obj[key])
                    ? sortObjectKeys(obj[key] as ITranslationJSON)
                    : obj[key];
            return acc;
        }, {});
};

// File reading and writing enhanced with JSON parsing and formatting
const readJsonFile = (filePath: string): ITranslationJSON => {
    try {
        const fileContent = readFileSync(filePath, { encoding: 'utf-8' });
        return JSON.parse(fileContent);
    } catch (error) {
        return {};
    }
};

const writeJsonFile = (filePath: string, data: ITranslationJSON): void => {
    try {
        const formattedData = JSON.stringify(sortObjectKeys(data), null, 2);
        writeFileSync(filePath, formattedData, { encoding: 'utf-8' });
    } catch (error) {
        console.error(`Error writing JSON to file ${filePath}`, error);
    }
};

// Functions for handling translations and Trie manipulation
export const getTranslationFiles = (rootPath: string): TranslationFile[] => {
    return readdirSync(rootPath, { withFileTypes: true })
        .filter((dirent) => dirent.isFile())
        .map((file) => ({
            path: `${rootPath}\\${file.name}`,
            lang: file.name.substring(0, file.name.lastIndexOf('.')),
        }));
};

export const transformToTrie = (
    json: ITranslationJSON,
    lang: string,
    trie: Trie,
): void => {
    const insertKeys = (obj: ITranslationJSON, prefix: string): void => {
        Object.entries(obj).forEach(([key, value]) => {
            const newPrefix = prefix ? `${prefix}.${key}` : key;
            if (
                typeof value === 'object' &&
                value !== null &&
                !Array.isArray(value)
            ) {
                insertKeys(value as ITranslationJSON, newPrefix);
            } else {
                trie.insert(newPrefix, lang, value as string);
            }
        });
    };
    insertKeys(json, '');
};

export const extractTrieFromFiles = (files: TranslationFile[]): Trie => {
    const trie = new Trie();
    files.forEach((file) => {
        const json = readJsonFile(file.path);
        transformToTrie(json, file.lang, trie);
    });
    return trie;
};

export const watchChanges = (
    filesPaths: TranslationFile[],
    trie: Trie,
): void => {
    filesPaths.forEach((file) => {
        watch(file.path, (eventType) => {
            if (eventType === 'change') {
                trie = extractTrieFromFiles(filesPaths);
            }
        });
    });
};

export const updateFiles = async (
    filesPaths: TranslationFile[],
    newKey: string,
): Promise<void> => {
    for (const file of filesPaths) {
        let data = readJsonFile(file.path);
        const value = await window.showInputBox({
            title: 'Create Translation Key',
            prompt: `Enter the value for ${newKey} (${file.lang})`,
            placeHolder:
                'Value (leave empty for no value, escape will put empty value)',
            ignoreFocusOut: true,
        } as InputBoxOptions);

        const translationValue: JSONValue = value ?? ''; // Use JSONValue type for flexibility

        // Fix type conflict by ensuring the accumulator is always treated as an object
        const keyParts = newKey.split('.');
        const lastKey = keyParts.pop() as string; // Safe to assert non-undefined due to preceding operations

        // Adjusted to correctly handle typing and assignment
        const lastObj = keyParts.reduce(
            (obj: ITranslationJSON, key): ITranslationJSON => {
                if (
                    !(key in obj) ||
                    typeof obj[key] !== 'object' ||
                    Array.isArray(obj[key])
                ) {
                    obj[key] = {};
                }
                return obj[key] as ITranslationJSON;
            },
            data,
        );

        // Ensure that lastObj is correctly typed and allows string assignment
        if (lastKey && typeof lastObj === 'object' && !Array.isArray(lastObj)) {
            lastObj[lastKey] = translationValue;
        }

        writeJsonFile(file.path, data);
    }
};
