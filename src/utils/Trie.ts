import { Translation } from './types';

export class TrieNode {
    children: { [char: string]: TrieNode } = {};
    value: Translation[] | null = null;
}

export class Trie {
    root: TrieNode = new TrieNode();

    // Insert a key-value pair into the trie
    insert(key: string, lang: string, value: string): void {
        let node = this.root;
        for (const char of key) {
            if (!node.children[char]) {
                node.children[char] = new TrieNode();
            }
            node = node.children[char];
        }
        // Update existing translation or add new translation
        let translationArray = node.value?.find((v) => v.lang === lang);
        if (translationArray) {
            translationArray.translation = value;
        } else if (node.value) {
            node.value.push({ lang, translation: value });
        } else {
            node.value = [{ lang, translation: value }];
        }
    }

    // Search for translations given a key
    search(key: string): Translation[] | null {
        let node = this.root;
        for (const char of key) {
            if (!node.children[char]) {
                return null; // Key not found
            }
            node = node.children[char];
        }
        return node.value;
    }

    // Perform autocomplete given a prefix
    autocomplete(prefix: string): [string, Translation[]][] {
        let node = this.root;
        for (const char of prefix) {
            if (!node.children[char]) {
                return []; // No matching prefixes found
            }
            node = node.children[char];
        }
        const results: [string, Translation[]][] = [];
        this.traverse(node, prefix, results);
        return results;
    }

    // Check if a key exists in the trie
    exists(key: string): boolean {
        return this.search(key) !== null;
    }

    // Helper function to recursively traverse the trie
    private traverse(
        node: TrieNode,
        prefix: string,
        results: [string, Translation[]][],
    ): void {
        if (node.value !== null) {
            results.push([prefix, node.value]);
        }
        for (const char in node.children) {
            this.traverse(node.children[char], prefix + char, results);
        }
    }
}
