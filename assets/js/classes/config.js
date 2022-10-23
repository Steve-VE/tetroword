class Config {
    constructor() {
        const queryString = window.location.search;
        this.urlParams = new URLSearchParams(queryString);
        this.lang = this.getUserLang();
        this.debug = this.getEnvDebug();
    }

    /**
     * Checks if the user specified a lang to use. It will check in the localStorage (user chose a
     * lang in the game's settings) or in the url parameters.
     * @returns {string} 'en' by default
     */
    getUserLang() {
        const supportedLangs = ['en', 'fr'];
        const userLang = this.urlParams.get('lang') || localStorage.getItem('favorite_lang');
        return supportedLangs.includes(userLang) ? userLang : 'en';
    }

    getEnvDebug() {
        const debugParams = this.urlParams.get('debug');
        return debugParams == 1;
    }
}
