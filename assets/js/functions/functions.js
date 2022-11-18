import { getConfig } from "../classes/config";

const config = getConfig();
let _canvas, _context;

export const getCanvas = () => {
    if (!_canvas) {
        _canvas = document.querySelector('canvas');
    }
    return _canvas;
};

export const getContext = () => {
    if (!_context) {
        const canvas = getCanvas();
        _context = canvas.getContext('2d');
    }
    return _context;
};

export function translation(rawString) {
    const translatedString = data.translations[config.lang][rawString];
    if (!translatedString) {
        debugMessage(`-- No translation found for:\n\t"${rawString}"`);
        return rawString;
    }
    return translatedString;
}
