import { RouteBuilder } from "../../core/RouteBuilder.ts";
import os from "os";

const route = new RouteBuilder()
    .setPath("/health")
    .setMethod("get")
    .setExec(async (request, reply) => {
        const cpu = os.cpus();
        const memory = os.totalmem() || 1;
        const memoryInGB = (memory / (1024 ** 3)).toFixed(2);
        const memUsage = process.memoryUsage();
        if (!cpu || !cpu[0] || cpu.length === 0) {
            reply.status(500).send({ error: "Unable to retrieve CPU information." });
            return;
        }
        reply.send({
            status: "ok", cpu: {
                cores: cpu.length,
                model: cpu[0].model,
                speed: cpu[0].speed
            }, memory: {
                total: {
                    InMb: (memory / (1024 ** 2)).toFixed(2) + " MB",
                    InGB: memoryInGB + " GB"
                },
                free: {
                    InMb: (os.freemem() / (1024 ** 2)).toFixed(2) + " MB",
                    InGB: (os.freemem() / (1024 ** 3)).toFixed(2) + " GB",
                    InPercent: ((os.freemem() / memory) * 100).toFixed(2) + " %"
                },
                usedFromProcess: {
                    InMb: (memUsage.rss / (1024 ** 2)).toFixed(2) + " MB",
                    InGB: (memUsage.rss / (1024 ** 3)).toFixed(2) + " GB",
                    InPercent: ((memUsage.rss / memory) * 100).toFixed(2) + " %"
                },
                usedFromProcessHeap: {
                    InMb: (memUsage.heapUsed / (1024 ** 2)).toFixed(2) + " MB",
                    InGB: (memUsage.heapUsed / (1024 ** 3)).toFixed(2) + " GB",
                    InPercent: ((memUsage.heapUsed / memory) * 100).toFixed(2) + " %"
                },
                external: {
                    InMb: (memUsage.external / (1024 ** 2)).toFixed(2) + " MB",
                    InGB: (memUsage.external / (1024 ** 3)).toFixed(2) + " GB",
                    InPercent: ((memUsage.external / memory) * 100).toFixed(2) + " %"
                },
                arrayBuffers: {
                    InMb: (memUsage.arrayBuffers / (1024 ** 2)).toFixed(2) + " MB",
                    InGB: (memUsage.arrayBuffers / (1024 ** 3)).toFixed(2) + " GB",
                    InPercent: ((memUsage.arrayBuffers / memory) * 100).toFixed(2) + " %"
                },
            },
            uptime: {
                computer: {
                    seconds: os.uptime(),
                    humanReadable: new Date(os.uptime() * 1000).toISOString().substr(11, 8),
                },
                process: {
                    bunTime: process.uptime(),
                    bunTimeHuman: new Date(process.uptime() * 1000).toISOString().substr(11, 8),
                }
            },
            os: {
                platform: os.platform(),
                arch: os.arch(),
                osType: os.type(),
                release: os.release(),
            }
        });
    })
    .build();

export default route;
