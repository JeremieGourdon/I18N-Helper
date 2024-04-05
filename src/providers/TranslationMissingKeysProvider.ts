import {
    CodeAction,
    CodeActionKind,
    CodeActionProvider,
    Diagnostic,
    DiagnosticRelatedInformation,
    DiagnosticSeverity,
    Location,
    ProviderResult,
    Range,
    TextDocument,
    Uri,
} from 'vscode';
import { Trie } from '../utils/Trie';
import { MissingKey, TranslationFile } from '../utils/types';

export class TranslationMissingKeysProvider implements CodeActionProvider {
    constructor(
        private getTranslation: () => Trie | null,
        private filePaths: TranslationFile[],
    ) {}

    provideCodeActions(
        document: TextDocument,
        _range: Range,
    ): ProviderResult<CodeAction[]> {
        const missingKeys: MissingKey[] = this.findMissingKeys(
            document,
            _range,
        );
        return this.createCodeActions(missingKeys);
    }

    resolveCodeAction(codeAction: CodeAction): ProviderResult<CodeAction> {
        return codeAction;
    }

    // Find missing translation keys in the document
    private findMissingKeys(
        document: TextDocument,
        range: Range,
    ): MissingKey[] {
        const missingKeys: MissingKey[] = [];
        const trie = this.getTranslation();
        const regex = /('[\w.]*')|("[\w.]*")/g;

        let match;
        do {
            match = regex.exec(document.getText());
            const key = match?.[0].slice(1, -1) as string;
            if (match && !trie?.exists(key)) {
                const startIndex = match.index;
                const endIndex = startIndex + key.length;
                const matchRange = new Range(
                    document.positionAt(startIndex + 1),
                    document.positionAt(endIndex + 1),
                );

                if (matchRange.contains(range)) {
                    missingKeys.push({ key, range: matchRange });
                }
            }
        } while (match);

        return missingKeys;
    }

    // Create code actions for each missing key
    private createCodeActions(missingKeys: MissingKey[]): CodeAction[] {
        return missingKeys.map((missingKey) => {
            const action = new CodeAction(
                `Create translation key '${missingKey.key}'`,
                CodeActionKind.QuickFix,
            );
            action.command = {
                command: 'i18n-helper.createTranslationKey',
                title: 'Create Translation Key',
                arguments: [missingKey.key, this.filePaths],
            };
            action.diagnostics = [this.createDiagnostic(missingKey)];
            action.isPreferred = true;
            return action;
        });
    }

    // Create a diagnostic for the missing translation key
    private createDiagnostic(missingKey: MissingKey): Diagnostic {
        const diagnostic = new Diagnostic(
            missingKey.range,
            `Missing translation key '${missingKey.key}'`,
            DiagnosticSeverity.Warning,
        );
        diagnostic.code = 'missing-translation';
        diagnostic.source = 'Translation Extension';
        diagnostic.relatedInformation = [
            new DiagnosticRelatedInformation(
                new Location(
                    Uri.file(this.filePaths[0].path),
                    new Range(0, 0, 0, 0),
                ),
                'Open i18n file',
            ),
        ];
        return diagnostic;
    }
}
