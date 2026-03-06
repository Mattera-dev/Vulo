import colors from "colors";
import { DbService } from "../services/DbService.ts";

class Timers {
    static __timers: Map<string, number> = new Map();

    static start(label: string) {
        this.__timers.set(label, Bun.nanoseconds());
        console.log(colors.bold(colors.blue(`[TIMER] <${label}> `)) + colors.bold(colors.blue(`Starting timer`)));
    }

    static end(label: string) {
        const startTime = this.__timers.get(label);
        if (startTime) {
            const duration = Bun.nanoseconds() - startTime;
            console.log(colors.bold(colors.blue(`[TIMER] `)) + colors.bold(colors.blue(`<${label}>: ${duration / 1_000_000}ms`)));
            this.__timers.delete(label);
        } else {
            console.warn(colors.bold(colors.yellow("[WARNING] ")) + colors.bold(colors.yellow(`Timer with label "${label}" not found.`)));
        }
    }
}

export class Config {
    private static __isPerfMode: boolean = false;
    static timers = Timers;

    static get isPerformanceMode(): boolean {
        return this.__isPerfMode;
    }

    static init() {
        console.clear()
        const args = Bun.argv;
        this.__isPerfMode = args.includes("--performance") || args.includes("-p");
        if (this.__isPerfMode) {
            console.log(colors.bold(colors.magenta("[PERFORMANCE MODE] ")) + colors.bold(colors.magenta("Performance debug mode enabled.")));
        }

        DbService.init();
    }


}

