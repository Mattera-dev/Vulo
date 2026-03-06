import type { FastifyReply, FastifyRequest } from "fastify";
import type { routeMethods, RouteProps } from "../types/routes.ts";

type ExecFunc<T extends { Params?: any; Body?: any; Querystring?: any }> = (
    req: FastifyRequest<{ Body: T["Body"]; Params: T["Params"]; Querystring: T["Querystring"] }>,
    res: FastifyReply
) => void | Promise<void>;

export class RouteBuilder<T extends { Params?: any; Body?: any; Querystring?: any } = {}> {
    private readonly info: RouteProps<T> = {
        path: '',
        method: 'get',
        exec: () => { }
    };

    static create<T extends { Params?: any; Body?: any; Querystring?: any }>() {
        return new RouteBuilder<T>();
    }

    setPath(path: string) {
        this.info.path = path;
        return this;
    }

    setMethod(method: routeMethods) {
        this.info.method = method;
        return this;
    }

    setExec(exec: ExecFunc<T>) {
        this.info.exec = exec;
        return this;
    }

    build(): RouteProps<T> {
        if (!this.info.path) throw new Error("Path is required!");
        return this.info;
    }
}