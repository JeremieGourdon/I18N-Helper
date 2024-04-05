import {
    ExtensionContext,
    StatusBarAlignment,
    Uri,
    commands,
    languages,
    window,
    workspace,
} from 'vscode';
import { TranslationCompletionProvider } from './providers/TranslationCompletionProvider';
import { TranslationHoverProvider } from './providers/TranslationHoverProvider';
import { TranslationMissingKeysProvider } from './providers/TranslationMissingKeysProvider';
import {
    getTranslationFiles,
    extractTrieFromFiles,
    watchChanges,
    updateFiles,
} from './utils/fileUtils';
import { checkWorkspaceOpen, getConfig } from './utils/globalUtils';
import { CONFIG } from './utils/constants';

export function activate(context: ExtensionContext) {
    // Check if a workspace is open
    const rootFolder = checkWorkspaceOpen();
    if (!rootFolder) {
        return;
    }

    let i18nFolderPath = Uri.joinPath(rootFolder.uri, CONFIG.dirPath).fsPath;

    // Get translation files and create trie
    let files = getTranslationFiles(i18nFolderPath);
    let translation = extractTrieFromFiles(files);
    if (!translation) {
        window.showErrorMessage('Failed to parse i18n files.');
        return;
    } else if (CONFIG.displayMessage) {
        window.showInformationMessage('i18n files loaded successfully.');
    }

    // Watch for changes in translation files
    watchChanges(files, translation);

    // Register providers
    const hoverProvider = new TranslationHoverProvider(
        () => translation,
        CONFIG.mainLanguage,
    );
    const completionProvider = new TranslationCompletionProvider(
        () => translation,
        CONFIG.mainLanguage,
    );
    const missingKeyProvider = new TranslationMissingKeysProvider(
        () => translation,
        files,
    );

    context.subscriptions.push(
        languages.registerCompletionItemProvider(
            [{ language: 'typescript' }, { language: 'html' }],
            completionProvider,
            "'",
            '"',
        ),
        languages.registerHoverProvider(
            [{ language: 'typescript' }, { language: 'html' }],
            hoverProvider,
        ),
        languages.registerCodeActionsProvider(
            [{ language: 'typescript' }, { language: 'html' }],
            missingKeyProvider,
        ),
        commands.registerCommand(
            'i18n-helper.createTranslationKey',
            async (key: string) => {
                updateFiles(files, key);
            },
        ),
    );

    // Trigger completion when typing in quotes
    workspace.onDidChangeTextDocument((event) => {
        if (
            event.document.languageId === 'html' ||
            event.document.languageId === 'typescript'
        ) {
            const editor = window.activeTextEditor;
            if (editor && editor.document === event.document) {
                const position = editor.selection.active;
                const line = editor.document.lineAt(position.line);
                const regex = /('[\w.]*')|("[\w.]*")/;
                const match = line.text.match(regex);
                if (!match) {
                    return;
                }

                const matchedText = match[1] || match[2];
                const start = match.index || 0;
                const end = start + matchedText.length;

                if (position.character >= start && position.character <= end) {
                    commands.executeCommand('editor.action.triggerSuggest');
                }
            }
        }
    });
}

// This method is called when your extension is deactivated
export function deactivate() {}
