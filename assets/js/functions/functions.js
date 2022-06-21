function translation(rawString) {
    const translatedString = data.translations[config.lang][rawString];
    if (!translatedString) {
        debugMessage(`-- No translation found for:\n\t"${rawString}"`);
        return rawString;
    }
    return translatedString;
}
