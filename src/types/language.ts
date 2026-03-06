type Language = "python" | "javascript" | "typescript" | "bun" | "node";


export type LanguageDetectRes = {
    lang: Language;
    image: string;
    indexFile: string;
    installCommand: string;
    startCommand: string;
    port: number;
}