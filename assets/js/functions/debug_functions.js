import { getConfig } from "../classes/config";

const config = getConfig();

export function debugMessage(message) {
    if (config.debug) {
        console.log(message);
    }
}

