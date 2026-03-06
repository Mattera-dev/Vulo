import { RouteBuilder } from "../core/RouteBuilder.ts";

const route = new RouteBuilder()
    .setPath("/")
    .setMethod("get")
    .setExec(async (request, reply) => {
        reply.send({ message: "Welcome to Self AWS API!" });
    })
    .build();

export default route;