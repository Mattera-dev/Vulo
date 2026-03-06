import { PassThrough } from "stream";
import { Extract } from "unzipper";
import { createHash } from "crypto";
import { readdir, rename, rmdir, lstat } from "fs/promises";
import path from "path";

export function isPerformanceEnabled(): boolean {
    const args = Bun.argv;
    return args.includes("--performance") || args.includes("-p");

}

export async function normalizeExtractPath(uploadPath: string) {
    const files = await readdir(uploadPath);
    if (files.length === 1) {
        const nestedFolderPath = path.join(uploadPath, files[0]!);
        const stat = await lstat(nestedFolderPath);

        if (stat.isDirectory()) {
            const nestedFiles = await readdir(nestedFolderPath);

            for (const file of nestedFiles) {
                const oldPath = path.join(nestedFolderPath, file);
                const newPath = path.join(uploadPath, file);
                await rename(oldPath, newPath);
            }

            await rmdir(nestedFolderPath);
        }
    }
}

function formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

export async function discardStream(dataFile: any) {
    if (dataFile && dataFile.file) {
        dataFile.file.resume();
        await new Promise((resolve) => dataFile.file.on("end", resolve));
    }
}

export async function saveHashToJson(hash: string, projectName: string, uploadPath: string, date: Date): Promise<void> {

    const dbPath = "./hashes.json";
    let data: Record<string, { projectName: string; uploadPath: string; date: string }> = {};

    try {
        const content = await Bun.file(dbPath).text();
        data = JSON.parse(content);
    } catch (e) {
    }

    data[hash] = {
        projectName: projectName,
        uploadPath: uploadPath,
        date: formatDate(date)
    };

    await Bun.write(dbPath, JSON.stringify(data, null, 2));
}

export async function removeFromJson(hash: string): Promise<void> {

    const dbPath = "./hashes.json";
    let data: Record<string, { projectName: string; uploadPath: string; date: string }> = {};

    try {
        const content = await Bun.file(dbPath).text();
        data = JSON.parse(content);
    } catch (e) {
        return;
    }

    delete data[hash];

    await Bun.write(dbPath, JSON.stringify(data, null, 2));
}

export async function createConfFile(projectName: string, port: number) {
    if (projectName == "api" || projectName == "default" || projectName == "defaultError") {
        projectName = `${projectName}-${Date.now()}`;
    }
    const confContent = `server {\n  listen 80;\n  server_name ${projectName}.localhost ${projectName}.shynex.tech;\n\n  location / {\n    proxy_pass http://${projectName}:${port};\n    proxy_set_header Host $host;\n    proxy_set_header X-Real-IP $remote_addr;\n    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n    proxy_set_header X-Forwarded-Proto $scheme;\n  }\n}\n`;
    const confPath = path.join("./proxy/conf.d", `${projectName}.conf`);
    await Bun.write(confPath, confContent);

}

export async function checkHash(hash: string) {
    const dbPath = "./hashes.json";
    try {
        const content = await Bun.file(dbPath).text();
        const data: Record<string, { projectName: string; uploadPath: string; date: string }> = JSON.parse(content);
        if (data[hash]) {
            return data[hash];
        }
        return null;
    } catch (e) {
        return null;
    }
}

export async function processDeployStream(fileStream: any, uploadPath: string) {
    const hasher = createHash("sha256");
    const passThrough = new PassThrough();
    const extractor = Extract({ path: uploadPath });

    return new Promise<{ hash: string }>((resolve, reject) => {
        passThrough.on("data", (chunk) => hasher.update(chunk));

        fileStream.pipe(passThrough).pipe(extractor);

        // O evento 'close' no extractor é o sinal mais confiável de que o disco terminou
        extractor.on("close", () => {
            resolve({ hash: hasher.digest("hex") });
        });

        extractor.on("error", reject);
    });


}