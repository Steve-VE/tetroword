function translation(rawString) {
    const translatedString = data.translations[lang][rawString];
    if (!translatedString) {
        console.warn(`-- No translation found for:\n\t"${rawString}"`);
        return rawString;
    }
    return translatedString;
}
