import Dockerode, { Container } from "dockerode";
import colors from "colors"
import { access, mkdir } from "fs/promises";
import { join, resolve } from "path";
import { DbService } from "../services/DbService.ts";
import cliProgress from 'cli-progress';
import type { LanguageDetectRes } from "../types/language.ts";
import { createConfFile } from "../utils/functions.ts";

const defaultProxyContent = `server {
    listen 80;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        return 200 "Proxy rodando com sucesso";
        add_header Content-Type text/plain;

    }
}
`;

class ContainerManager {
    private client: Dockerode;
    private proxyContainerId: string | null = null;

    constructor(client: Dockerode) {
        this.client = client;
    }

    private async pullWithProgress(imageName: string) {
        const stream = await this.client.pull(imageName);
        const progressBar = new cliProgress.SingleBar({
            format: 'Downloading {bar} | {percentage}% | {status}',
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
        });

        progressBar.start(100, 0, { status: 'Iniciando...' });

        await new Promise((resolve, reject) => {
            this.client.modem.followProgress(stream, (err, res) => {
                if (err) {
                    progressBar.stop();
                    reject(err);
                } else {
                    progressBar.update(100, { status: 'Concluído!' });
                    progressBar.stop();
                    resolve(res);
                }
            }, (event) => {
                if (event.progressDetail && event.progressDetail.current) {
                    const percentage = Math.round((event.progressDetail.current / event.progressDetail.total) * 100);
                    progressBar.update(percentage, { status: event.status });
                }
            });
        });
    }

    async getProxyContainer() {
        if (!this.proxyContainerId) {
            try {
                const containers = await this.client.listContainers({ all: true, filters: { name: [process.env.PROXY_CONTAINER_NAME || "self-aws-proxy"] } });
                if (containers.length > 0) {
                    this.proxyContainerId = containers[0]!.Id;
                    return this.client.getContainer(this.proxyContainerId);
                } else {
                    console.error(colors.bold(colors.red("[ERROR] ")) + colors.bold(colors.red(`Proxy container not found. Ensure the proxy container is running.`)));
                }
            } catch (error) {
                console.error(colors.bold(colors.red("[ERROR] ")) + colors.bold(colors.red(`Failed to get proxy container: ${error}`)));
            }
        } else {
            return this.client.getContainer(this.proxyContainerId);

        }
    }

    async buildAndDeploy(languageData: LanguageDetectRes, maxRamInMb: number, projectName: string, uploadPath: string) {
        const image = await this.client.listImages({ filters: { reference: [languageData.image] } });
        console.log(image)
        console.log(colors.blue(`[DOCKER] Verificando imagem ${languageData.image}...`));
        if (!image || image.length === 0) {
            console.log(colors.yellow(`[DOCKER] Imagem ${languageData.image} não encontrada localmente. Iniciando download...`));
            await this.pullWithProgress(languageData.image);
        }

        console.log(colors.blue(`[DOCKER] Criando container para o projeto ${projectName}...`));
        console.log("path", resolve(uploadPath))
        const { container, error, is_running } = await this.CreateContainer({
            Env: [
                `PORT=${languageData.port || 3000}`,
                "NODE_ENV=production"
            ],
            Image: languageData.image,
            name: projectName,
            WorkingDir: "/app",
            Cmd: ["sh", "-c", `${languageData.installCommand} && ${languageData.startCommand}`],
            HostConfig: {
                Binds: [`${resolve(uploadPath)}:/app`],
                Memory: maxRamInMb * 1024 * 1024,
                NetworkMode: "self-aws-network",
                RestartPolicy: { Name: "unless-stopped" },
                LogConfig: { Type: "json-file", Config: {} }
            }
        });
        console.log(languageData.port)
        if (error || !container) {
            console.error(colors.bold(colors.red("[ERROR] ")) + colors.bold(colors.red(`Failed to create container for project ${projectName}: ${error}`)));
            return { success: false, error };
        }
        const proxyContainer = await this.getProxyContainer()
        if (!proxyContainer) {
            console.error(colors.bold(colors.red("[ERROR] ")) + colors.bold(colors.red(`Failed to connect container ${projectName} to proxy network: Proxy container not found.`)));
        } else {
            proxyContainer.exec({ Cmd: ["nginx", "-s", "reload"] }).then(exec => exec.start({ Detach: true })).catch(err => {
                console.error(colors.bold(colors.red("[ERROR] ")) + colors.bold(colors.red(`Failed to reload nginx for container ${projectName}: ${err}`)));
            });
        }

        console.log(colors.green.bold(`[SUCCESS] Container for project ${projectName} created successfully. Running: ${is_running}`));
        return { success: true, containerId: container.id, error: null, is_running };
    }

    async CreateContainer(options: Dockerode.ContainerCreateOptions) {
        try {
            const container = await this.client.createContainer(options);
            await createConfFile(options.name || "default", parseInt(options.Env?.find(env => env.startsWith("PORT="))?.split("=")[1] || "3000"));
            const is_running = await container.inspect().then(info => info.State.Running);
            if (!is_running) {
                await container.start();
            }
            return { container, error: null, is_running };
        } catch (error) {
            return { container: null, error: `Failed to create container: ${error}`, is_running: false };
        }
    }

    async StartContainer(containerId: string) {
        try {
            const container = this.client.getContainer(containerId);
            await container.start();
            return { success: true, error: null };
        } catch (error) {
            return { success: false, error: `Failed to start container ${containerId}: ${error}` };
        }
    }

    async StopContainer(containerId: string) {
        try {
            const container = this.client.getContainer(containerId);
            await container.stop();
            return { success: true, error: null };
        } catch (error) {
            return { success: false, error: `Failed to stop container ${containerId}: ${error}` };
        }
    }

    async RemoveContainer(containerId: string) {
        try {
            const container = this.client.getContainer(containerId);
            await container.remove({ force: true });
            return { success: true, error: null };
        } catch (error) {
            return { success: false, error: `Failed to remove container ${containerId}: ${error}` };
        }
    }


}


class DockerEngine {
    private client: Dockerode;
    container: ContainerManager

    networkName = process.env.NETWORK_NAME || "self-aws-network";
    proxyContainerName = process.env.PROXY_CONTAINER_NAME || "self-aws-proxy";

    cacheIdToName: Map<string, string> = new Map();
    cacheNameToId: Map<string, string> = new Map();

    dbService: DbService = DbService.create();
    private constructor({ socketPath }: { socketPath: string }) {

        this.client = new Dockerode({ socketPath });
        this.container = new ContainerManager(this.client);
    }
    static async create(config: { socketPath: string } = {
        socketPath: ""
    }): Promise<DockerEngine> {
        const socketPath = config.socketPath || process.env.DOCKER_SOCKET_PATH || "/run/docker.sock";

        const file = Bun.file(socketPath);
        const exists = await file.exists();


        if (!exists) {
            try {
                await access(socketPath);
            } catch (error) {
                console.log(colors.bold(colors.red("[ERROR] ")) + colors.bold(colors.red(`Docker socket not found at ${socketPath}\nCheck permissions and path.`)));
                process.exit(1);
            }
        }
        const instance = new DockerEngine({ socketPath });

        try {
            console.log(colors.cyan("[INIT] Preparando infraestrutura Docker..."));

            await instance.ensureNetwork();
            await instance.ensureProxyContainer(instance.proxyContainerName, instance.networkName);
            await instance.loadCaches();

            instance.activateEvents();
            console.log(colors.green.bold("[SUCCESS] Docker Engine initialized successfully."));
        } catch (error) {
            console.error(colors.red(`❌ [FATAL] Erro na inicialização do Docker: ${error}`));
            process.exit(1);
        }

        return instance;
    }

    async loadCaches() {
        try {
            const containers = await this.client.listContainers({ all: true });
            for (const container of containers) {
                const id = container.Id;
                const name = container.Names[0]!.replace(/^\//, "");
                if (name === this.proxyContainerName) continue;
                this.cacheIdToName.set(id, name);
                this.cacheNameToId.set(name, id);
            }
        } catch (error) {
            console.error(colors.bold(colors.red("[ERROR] ")) + colors.bold(colors.red(`Failed to load Docker cache: ${error}`)));
        }
    }

    async activateEvents() {
        const eventsStream = await this.client.getEvents({ filters: { type: ["container"] } });
        const decoder = new TextDecoder();
        const dockerCacheLabel = colors.bold(colors.blue.bold("[DOCKER CACHE] "));
        let buffer = "";
        for await (const chunk of eventsStream) {
            buffer += decoder.decode(chunk as any, { stream: true });
            let lines = buffer.split("\n");
            buffer = lines.pop() || "";
            for (const line of lines) {
                if (line.trim()) {
                    try {
                        const event = JSON.parse(line);
                        switch (event.Action) {
                            case "create":
                                const id = event.Actor.ID;
                                const name = event.Actor.Attributes.name;
                                this.cacheIdToName.set(id, name);
                                this.cacheNameToId.set(name, id);
                                console.log(dockerCacheLabel + colors.bold(colors.green(`Cached container ${name} (${id.slice(0, 15)})`)));
                                break;
                            case "die":
                                const idToRemove = event.Actor.ID;
                                const nameToRemove = this.cacheIdToName.get(idToRemove);
                                console.log(dockerCacheLabel + colors.bold(colors.yellow(`Container ${nameToRemove} Died (${idToRemove.slice(0, 15)}) from cache`)));
                                this.dbService.createContainerLog(idToRemove, `Container ${nameToRemove} died at ${new Date().toISOString()}`);
                                break;
                            case "destroy":
                                const idToDelete = event.Actor.ID;
                                const nameToDelete = this.cacheIdToName.get(idToDelete);
                                if (nameToDelete) {
                                    this.cacheIdToName.delete(idToDelete);
                                    this.cacheNameToId.delete(nameToDelete);
                                    console.log(dockerCacheLabel + colors.bold(colors.red(`Deleted container ${nameToDelete} (${idToDelete.slice(0, 15)}) from cache`)));
                                }
                                break;
                        }
                        const file = Bun.file(join(import.meta.dirname, "../../logs/docker-events.log"));
                        const text = await file.text();
                        await file.write(`${text}[${new Date().toISOString()}] ${line}\n`);
                    } catch (error) {
                        console.error(colors.bold(colors.red("[ERROR] ")) + colors.bold(colors.red(`Failed to parse Docker event: ${error}`)));
                    }
                }
            }
        }
    }

    async ping() {
        try {
            await this.client.ping();
            return true;
        } catch (error) {
            console.log(colors.bold(colors.red("[ERROR] ")) + colors.bold(colors.red(`Failed to connect to Docker socket. Ensure Docker is running and permissions are correct.`)));
            return false;
        }
    }

    async getAllStats() {
        const [containers, images, volumes, networks] = await Promise.all([
            this.client.listContainers(),
            this.client.listImages(),
            this.client.listVolumes(),
            this.client.listNetworks()
        ])

        return { containers, images, volumes, networks };
    }

    private async ensureNetwork() {
        const networkName = this.networkName;
        const networks = await this.client.listNetworks();
        const existingNetwork = networks.find(n => n.Name === networkName);
        if (!existingNetwork) {
            console.log(colors.blue("[NETWORK] Criando rede customizada..."));
            await this.client.createNetwork({ Name: networkName, Driver: "bridge" });
        }
    }

    private async pullWithProgress(imageName: string) {
        const stream = await this.client.pull(imageName);
        const progressBar = new cliProgress.SingleBar({
            format: 'Downloading {bar} | {percentage}% | {status}',
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
        });

        progressBar.start(100, 0, { status: 'Iniciando...' });

        await new Promise((resolve, reject) => {
            this.client.modem.followProgress(stream, (err, res) => {
                if (err) {
                    progressBar.stop();
                    reject(err);
                } else {
                    progressBar.update(100, { status: 'Concluído!' });
                    progressBar.stop();
                    resolve(res);
                }
            }, (event) => {

                if (event.progressDetail && event.progressDetail.current) {
                    const percentage = Math.round((event.progressDetail.current / event.progressDetail.total) * 100);
                    progressBar.update(percentage, { status: event.status });
                }
            });
        });
    }


    async ensureProxyContainer(containerName: string, networkName: string) {
        const configPath = join(import.meta.dirname, "../../proxy/conf.d");
        await mkdir(configPath, { recursive: true });

        try {
            const container = this.client.getContainer(containerName);
            const data = await container.inspect();

            if (data.State.Running) {
                console.log(colors.gray(`[PROXY] Container ${containerName} já está rodando.`));
                return;
            } else {
                console.log(colors.yellow(`[PROXY] Container parado. Reiniciando...`));
                await container.start();
                return;
            }
        } catch (e) {

            console.log(colors.blue("[PROXY] Criando novo container mestre..."));


            await this.pullWithProgress("nginx:alpine");

            await this.client.createContainer({
                Image: "nginx:alpine",
                name: containerName,
                HostConfig: {
                    PortBindings: { "80/tcp": [{ HostPort: "80" }] },
                    Binds: [`${configPath}:/etc/nginx/conf.d`],
                    NetworkMode: networkName,
                    RestartPolicy: { Name: "always" },
                    ExtraHosts: ["host.internal:host-gateway"],
                    LogConfig: { Type: "json-file", Config: {} }
                }
            }).then(async c => {
                const file = Bun.file(join(configPath, "default.conf"));
                if (await file.exists()) {
                    console.log(colors.gray(`[PROXY] Configuração do proxy já existe. Pulando criação.`));
                } else {
                    await Bun.write(join(configPath, "default.conf"), defaultProxyContent);
                }
                c.start()
            });
        }
    }

    async getContainerStats(containerId: string) {
        try {
            const container = this.client.getContainer(containerId);
            return { data: await container.stats({ stream: false }), error: null };
        } catch (error) {
            return { error: `Failed to get stats for container ${containerId}`, data: null };
        }
    }

    async getContainers() {
        try {
            return { data: await this.client.listContainers({ all: true }), error: null };
        } catch (error) {
            return { error: "Failed to get containers", data: null };
        }
    }

    async getImages() {
        try {
            return { data: await this.client.listImages(), error: null };
        } catch (error) {
            return { error: "Failed to get images", data: null };
        }
    }

    async getVolumes() {
        try {
            return { data: await this.client.listVolumes(), error: null };
        } catch (error) {
            return { error: "Failed to get volumes", data: null };
        }
    }

    async getNetworks() {
        try {
            return { data: await this.client.listNetworks(), error: null };
        } catch (error) {
            return { error: "Failed to get networks", data: null };
        }
    }

    async getInfo() {
        return await this.client.info();
    }

}
export default DockerEngine;