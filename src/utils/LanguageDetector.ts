import { join } from "path";
import type { LanguageDetectRes } from "../types/language.ts";

export class LanguageDetector {
    private static languageMap: { [key: string]: string } = {
        "python": "python:alpine",
        "javascript": "node:alpine",
        "typescript": "node:alpine",
        "bun": "oven/bun:alpine",
        "node": "node:alpine",
    }

    private static tryGetLanguageFromPackageJson(folderPath: string): Promise<{ lang: "node" | "bun", indexFile: string, startCommand: string } | null> {
        return new Promise(async (resolve) => {
            const packageJsonPath = join(folderPath, "package.json");
            const exists = await Bun.file(packageJsonPath).exists();
            let language: "node" | "bun" | null = null;
            let indexFile = "index.js";
            const startCommand = "node index.js";
            if (!exists) {
                resolve(null);
                return;
            }
            if (await Bun.file(join(folderPath, "bun.lockb")).exists() || await Bun.file(join(folderPath, "bun.lock")).exists()) {
                language = "bun";
            } else if (await Bun.file(join(folderPath, "package-lock.json")).exists()) {
                language = ("node");
            } else if (await Bun.file(join(folderPath, "yarn.lock")).exists()) {
                language = ("node");
            }

            try {
                const content = await Bun.file(packageJsonPath).text();
                const packageJson = JSON.parse(content);
                if (packageJson.scripts && packageJson.scripts.start) {
                    const startScript = packageJson.scripts.start as string;
                    if (startScript.includes("bun")) {
                        language = "bun";
                        indexFile = startScript.split(" ").pop()!;
                        resolve({ lang: language, indexFile, startCommand: startScript });
                        return;
                    } else if (startScript.includes("node")) {
                        language = "node";
                        indexFile = startScript.split(" ").pop()!;
                        resolve({ lang: language, indexFile, startCommand: startScript });
                        return;
                    }
                } else {
                    resolve({ lang: language!, indexFile, startCommand });
                    return;
                }
                resolve(null);
            } catch (error) {
                resolve(null);
            }
        });
    }

    private static getDataFromEnv(folderPath: string): Promise<{ port: number } | null> {
        return new Promise(async (resolve) => {
            const envPath = join(folderPath, ".env");
            const exists = await Bun.file(envPath).exists();
            if (!exists) {
                resolve(null);
                return;
            }
            try {
                const content = await Bun.file(envPath).text();
                const lines = content.split("\n");
                let port: number | null = null;
                for (const line of lines) {
                    if (line.toLowerCase().startsWith("port=")) {
                        const value = line.split("=")[1]!.trim().replace(/["']/g, "");

                        port = parseInt(value);
                        break;
                    }
                }
                if (port) {
                    resolve({ port });
                } else {
                    resolve(null);
                }
            } catch (error) {
                resolve(null);
            }
        });
    }

    static async detect(folderPath: string): Promise<LanguageDetectRes | {
        error: string
    }> {
        let language: "python" | "javascript" | "typescript" | "bun" | "node" | null = null;
        let indexFile = "";
        const langFromPrefinder = await this.tryGetLanguageFromPackageJson(folderPath);
        const envData = await this.getDataFromEnv(folderPath);
        if (langFromPrefinder) {
            switch (langFromPrefinder.lang) {
                case "bun":
                    return {
                        lang: "bun",
                        image: this.languageMap["bun"]!,
                        indexFile: langFromPrefinder.indexFile || "index.js",
                        installCommand: "bun install --production",
                        startCommand: langFromPrefinder.startCommand || "bun start",
                        port: envData?.port || 3000,
                    }
                case "node":
                    return {
                        lang: "node",
                        image: this.languageMap["node"]!,
                        indexFile: langFromPrefinder.indexFile || "index.js",
                        installCommand: "npm install --omit=dev",
                        startCommand: langFromPrefinder.startCommand || "npm start",
                        port: envData?.port || 3000,
                    }
                default:
                    break;
            }
        }
        try {
            const rootFiles = await Array.fromAsync(new Bun.Glob(`${folderPath}/*.*`).scan());

            if (rootFiles.length == 0) return { error: "No files found in the root of the project" };
            for (const file of rootFiles) {
                const extension = file.split(".").pop()?.toLowerCase()
                if (!extension) continue;
                switch (extension) {
                    case "py":
                        language = "python";
                        indexFile = file.split("/").pop()!;
                        break;
                    default:
                        continue;
                }
            }

            if (language == "python") {
                const hasRequirements = await Bun.file(`${folderPath}/requirements.txt`).exists();
                if (!hasRequirements) {
                    return { error: "Python project must have a requirements.txt file" };
                }
                const hasMain = await Bun.file(`${folderPath}/main.py`).exists();
                if (!indexFile && !hasMain) {
                    return { error: "Python project must have a main.py file" };
                }

                return {
                    lang: language,
                    image: this.languageMap[language]!,
                    indexFile,
                    installCommand: "pip install -r requirements.txt",
                    startCommand: `python ${indexFile}`,
                    port: 5000,
                }
            } else {
                return { error: "Could not detect language" };
            }
        } catch (error) {
            return { error: "Failed to detect language" };
        }
    }
}

