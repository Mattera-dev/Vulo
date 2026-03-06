import { RouteBuilder } from "../../core/RouteBuilder.ts";

const route = new RouteBuilder().setPath("/containers").setMethod("get").setExec(async (request, reply) => {
    const docker = request.server.docker;
    const { data, error } = await docker.getContainers();

    if (error) {
        reply.status(500).send({ error });
    } else {
        reply.send({ containers: data });
    }
}).build();

export default route