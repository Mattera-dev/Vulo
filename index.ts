import { Config } from "./src/config/config.ts";
import { Api } from "./src/core/Api.ts";

Config.init()
const api = new Api();

api.start()