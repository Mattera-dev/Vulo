import type DockerEngine from "../core/DockerEngine.ts";

declare module "fastify" {
    interface FastifyInstance {
        docker: DockerEngine;
    }
}