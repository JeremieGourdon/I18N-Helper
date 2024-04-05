import * as vscode from 'vscode';
import { Trie } from '../utils/Trie'; // Assuming Trie is properly implemented
import { Translation } from '../utils/types';

export class TranslationHoverProvider implements vscode.HoverProvider {
    constructor(
        private getTranslation: () => Trie | null,
        private mainLang: string,
    ) {}

    public provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
    ): vscode.ProviderResult<vscode.Hover> {
        const trie = this.getTranslation();
        if (!trie) {
            return;
        }

        // Get the word range at the current position
        const wordRange = document.getWordRangeAtPosition(position, /[\w.]+/);
        if (!wordRange) {
            return;
        }

        // Extract the word at the current position
        const word = document.getText(wordRange);
        const translation = trie.search(word);

        if (translation) {
            // Construct hover content
            const hoverContent = this.constructHoverContent(translation);
            return new vscode.Hover(hoverContent, wordRange);
        }
    }

    // Construct hover content based on translation information
    private constructHoverContent(
        translation: Translation[],
    ): vscode.MarkdownString {
        const markdown = new vscode.MarkdownString();
        const mainTranslation = translation.find(
            (t) => t.lang === this.mainLang,
        );
        const translationText = mainTranslation
            ? mainTranslation.translation
            : translation[0].translation;
        markdown.appendCodeblock(translationText, 'plaintext');
        return markdown;
    }
}
