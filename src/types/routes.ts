import type { FastifyReply, FastifyRequest, HTTPMethods } from "fastify"

export type routeMethods = "get" | "post" | "put" | "delete" | "patch" | "options" | "head";

export type RouteProps<T extends { Params?: any; Body?: any; Querystring?: any } = {}> = {
    path: string,
    method: routeMethods,
    exec: (req: FastifyRequest<{
        Params: T['Params'];
        Body: T['Body'];
        Querystring: T['Querystring'];
    }>, res: FastifyReply) => void | Promise<void>
}