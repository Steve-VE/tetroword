class Config {
    constructor() {
        const queryString = window.location.search;
        this.urlParams = new URLSearchParams(queryString);
        this.lang = this.getUserLang();
        this.debug = this.getEnvDebug();
    }

    getUserLang() {
        const supportedLangs = ['en', 'fr'];
        const userLang = this.urlParams.get('lang');
        return supportedLangs.includes(userLang) ? userLang : 'en';
    }

    getEnvDebug() {
        const debugParams = this.urlParams.get('debug');
        return debugParams == 1;
    }
}
