import { getConfig } from "../classes/config.js";

const config = getConfig();

export function debugMessage(message) {
    if (config.debug) {
        console.log(message);
    }
}

