import { join } from "path";
import { Database } from "bun:sqlite";
import colors from "colors";
import { mkdirSync } from "node:fs";

const dbPath = join(import.meta.dirname, "../../db");

export class DbService {
    public database: Database;
    private static instance: DbService;

    private constructor() {
        this.database = new Database(join(dbPath, "selfaws.db"), { create: true });
    }

    static create(): DbService {
        mkdirSync(dbPath, { recursive: true });

        if (!DbService.instance) {
            DbService.instance = new DbService();
        }

        return DbService.instance;
    }

    async createContainerLog(containerId: string, log: string) {
        const timestamp = new Date().toISOString();
        const res = this.database.run(
            "INSERT INTO logs (container_id, log, timestamp) VALUES (?, ?, ?)",
            [containerId, log, timestamp]
        );
        if (res.changes === 0) {
            console.log(colors.bold(colors.red("[ERROR] ")) + colors.bold(colors.red(`Failed to insert log for container ${containerId}`)));
            return false
        }
        return true
    }

    static async init() {
        const dbService = await DbService.create();
        dbService.database.run(`
            CREATE TABLE IF NOT EXISTS logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                container_id TEXT,
                log TEXT,
                timestamp TEXT
            )
        `);
        dbService.database.run(`
            CREATE TABLE IF NOT EXISTS containers (
                id TEXT PRIMARY KEY,
                name TEXT,
                created_at TEXT
            )
        `);
    }
}