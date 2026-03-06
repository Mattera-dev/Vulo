import fp from "fastify-plugin";
import DockerEngine from "../core/DockerEngine.ts";
import colors from "colors";

export default fp(async (fastify, options) => {
    const docker = await DockerEngine.create({ socketPath: "/run/docker.sock" });
    fastify.decorate("docker", docker);
    console.log(colors.bold(colors.white("[INFO] ")) + colors.bold(colors.white("DockerEngine plugin registered successfully.")));
});