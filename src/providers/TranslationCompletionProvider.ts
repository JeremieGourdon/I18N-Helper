import * as vscode from 'vscode';
import { Trie } from '../utils/Trie';
import { Translation } from '../utils/types';

export class TranslationCompletionProvider
    implements vscode.CompletionItemProvider
{
    constructor(private getTranslation: () => Trie, private mainLang: string) {}

    provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
    ): vscode.ProviderResult<vscode.CompletionItem[]> {
        const translation = this.getTranslation();
        if (!translation) {
            return [];
        }

        const linePrefix = document
            .lineAt(position)
            .text.substr(0, position.character);
        const matches = linePrefix.match(/['"]([^'"]*)$/);
        if (!matches) {
            return [];
        }

        const keyPrefix = matches[1];
        const line = document.lineAt(position).text;
        const lineUpToPosition = line.substring(0, position.character);
        const match = lineUpToPosition.match(/["']([^"']*)$/);

        const items: vscode.CompletionItem[] = [];
        const autocompleteResults = translation.autocomplete(keyPrefix);

        autocompleteResults.forEach(([key, value]) => {
            const item = new vscode.CompletionItem(
                key,
                vscode.CompletionItemKind.Keyword,
            );
            item.detail = this.getTranslationDetail(value);
            item.documentation = this.generateMarkdownDocumentation(value);
            if (match) {
                const startReplacePosition = position.translate(
                    0,
                    -match[1].length,
                );
                const rangeToReplace = new vscode.Range(
                    startReplacePosition,
                    position,
                );
                item.range = rangeToReplace;
            }
            items.push(item);
        });

        return items;
    }

    // Get translation detail based on main language
    private getTranslationDetail(translations: Translation[]): string {
        const mainTranslation = translations.find(
            (t) => t.lang === this.mainLang,
        );
        return mainTranslation
            ? mainTranslation.translation
            : translations[0].translation;
    }

    // Generate markdown documentation for completion item
    private generateMarkdownDocumentation(
        translations: Translation[],
    ): vscode.MarkdownString {
        const markdownString = new vscode.MarkdownString(
            `---\n\n*Tap to insert this translation key.*`,
        );
        translations.forEach((translation) => {
            markdownString.appendCodeblock(
                `${translation.lang}: "${translation.translation}"`,
                'json',
            );
        });
        return markdownString;
    }
}
