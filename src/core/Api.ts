import fastify, { type FastifyInstance } from "fastify";
import { join } from "path";
import DockerEnginePlugin from "../plugins/DockerEngine.plugin.ts";
import colors from "colors";
import type { RouteProps } from "../types/routes.ts";
import { Config } from "../config/config.ts";
import multipart from "@fastify/multipart"

function checkExistsFile(path: string): Promise<boolean> {
    return new Promise(async (resolve) => {
        const file = Bun.file(path);

        if (await file.exists()) {
            resolve(true);
        } else {
            resolve(false);
        }
    });
}

const getRoutesFolderFiles = () => new Bun.Glob(join(import.meta.dirname, "../", "routes/**/*.ts"));

async function createIndexRouteFile() {
    const indexFilePath = join(folderPath, "index.ts");
    const files = new Bun.Glob(join(folderPath, "**/*.ts"));
    let idx = 0;
    const lines = []
    for await (const file of files.scan()) {
        if (file !== indexFilePath) {
            const relativePath = "./" + file.slice(folderPath.length);
            lines.push(`import route${idx} from "${relativePath}";`);
            idx++;
        }
    }
    lines.push(`export default [`);
    for (let i = 0; i < idx; i++) {
        lines.push(`    route${i},`);
    }
    lines.push(`];`);
    const content = lines.join("\n");
    const idxFile = await Bun.file(indexFilePath).text()
    if (idxFile === content) {
        console.log(colors.bold(colors.yellow("[WARNING] ")) + colors.bold(colors.yellow("index.ts file is already up to date. Skipping regeneration.")));
        return;
    }
    await Bun.write(indexFilePath, lines.join("\n"));
}
const folderPath = join(import.meta.dirname, "../", "routes");

export class Api {
    private client: FastifyInstance

    private port: number = process.env.API_PORT ? parseInt(process.env.API_PORT) : 3000;
    private host: string = process.env.API_HOST || "0.0.0.0";
    constructor() {
        this.client = fastify({ pluginTimeout: 120000 })
    }

    async start() {
        if (Config.isPerformanceMode) {
            Config.timers.start("startApi")
        }
        await this.client.register(DockerEnginePlugin);
        await this.client.register(multipart, {
            limits: {
                fieldNameSize: 100,
                fieldSize: 100,
                fields: 10,
                fileSize: 10 * 1024 * 1024,
                files: 1,
            }
        });
        await this.loadRoutes();
        this.client.listen({ port: this.port, host: this.host }, (err, address) => {
            if (err) {
                console.error("Error starting API server:", err);
                process.exit(1);
            }
            if (Config.isPerformanceMode) {
                Config.timers.end("startApi")
            }
            console.log(colors.green.bold("[SUCCESS] ") + colors.green.bold(`API server is running at ${address}`));
        });
    }

    private async loadRoutes() {
        if (Config.isPerformanceMode) {
            Config.timers.start("loadRoutes")
        }
        const indexFilePath = join(folderPath, "index.ts");
        if (!await checkExistsFile(indexFilePath)) {
            console.log(colors.bold(colors.yellow("[WARNING] ")) + colors.bold(colors.yellow("No index.ts found in routes folder. Creating one automatically.")));
            await createIndexRouteFile();
        }


        try {
            let routesModule = (await import(indexFilePath)).default;
            const routesFound = (await Array.fromAsync(getRoutesFolderFiles().scan())).filter(file => file !== indexFilePath);
            if (routesFound.length !== routesModule.length) {
                console.log(colors.bold(colors.yellow("[WARNING] ")) + colors.bold(colors.yellow("Routes count mismatch. Regenerating index.ts file.")));
                await createIndexRouteFile();
                routesModule = (await import(indexFilePath + `?update=${Date.now()}`)).default;
            }

            if (Array.isArray(routesModule)) {
                routesModule.forEach((route: RouteProps) => {
                    this.client[route.method](route.path, route.exec)
                });
                console.log(colors.bold(colors.white("[INFO] ")) + colors.bold(colors.white(`Loaded ${routesModule.length} routes successfully.`)));
            } else {
                console.error(colors.bold(colors.red("[ERROR] ")) + colors.bold(colors.red("Invalid routes module format. Expected an array of routes.")));
            }
        } catch (error) {
            console.error("Error loading routes:", error);
            process.exit(1)
        }

        if (Config.isPerformanceMode) {
            Config.timers.end("loadRoutes")
        }

    }
}

