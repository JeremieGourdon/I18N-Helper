import { WorkspaceFolder, window, workspace } from 'vscode';
import { Configuration } from './types';

// Types definition

// Function to check if a workspace is open
export function checkWorkspaceOpen(): WorkspaceFolder | undefined {
    const rootFolders = workspace.workspaceFolders;
    if (!rootFolders || rootFolders.length === 0) {
        window.showWarningMessage('No workspace folder opened.');
        return;
    }

    const rootFolder = rootFolders[0];
    if (!rootFolder) {
        window.showWarningMessage('Failed to get workspace root folder.');
        return undefined;
    }

    return rootFolder;
}

// Function to retrieve configuration settings
export function getConfig(): Configuration {
    const config = workspace.getConfiguration('i18n-helper');
    const dirPath = config.get<string>('i18nFolderUri') || '';
    const mainLanguage = config.get<string>('mainLanguage') || '';
    const displayMessage =
        config.get<boolean>('displayLoadingMessage') || false;

    return { dirPath, mainLanguage, displayMessage };
}
