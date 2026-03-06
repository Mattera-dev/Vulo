import { RouteBuilder } from "../../core/RouteBuilder.ts";

const route = new RouteBuilder<{ Params: { name: string } }>().setPath("/containers/:name").setMethod("get").setExec(async (request, reply) => {
    const docker = request.server.docker;
    const { name } = request.params;
    const id = docker.cacheNameToId.get(name);

    if (!id) {
        reply.status(404).send({ error: `Container with name ${name} not found` });
        return;
    }
    const { data, error } = await docker.getContainerStats(id);

    if (error) {
        reply.status(500).send({ error });
    } else {
        reply.send({ containers: data });
    }
}).build();

export default route