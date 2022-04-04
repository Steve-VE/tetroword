const env = {
    debugMode: true,
};

function debugMessage(message) {
    if (env.debugMode) {
        console.log(message);
    }
}

