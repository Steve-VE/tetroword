import { getContext } from "./functions";

let __drawFill = true;
let __drawStroke = false;
let __translateX = 0;
let __translateY = 0;

const context = getContext();


export function drawImage(imageSrc, sx, sy, sw, sh, x, y, w, h) {
    if (!context) { return; }
    x += __translateX;
    y += __translateY;
    context.drawImage(imageSrc, sx, sy, sw, sh, x, y, w, h);
}


export function fill(r, g=undefined, b=undefined, a=1) {
    if (!context) { return; }
    __drawFill = true;
    if (typeof r === 'string') {
        context.fillStyle = r;
    } else {
        if (r && g === undefined && b === undefined) {
            g = r;
            b = r;
        }
        context.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
    }
}

export function noFill() { __drawFill = false; }

export function noStroke() { __drawStroke = false; }

export function rect(x, y, w, h) {
    x += __translateX;
    y += __translateY;
    if (!context) { return; }
    if (__drawFill) {
        context.fillRect(x, y, w, h || w);
    }
    if (__drawStroke) {
        context.strokeRect(x, y, w, h || w);
    }
}

export function stroke(r, g=undefined, b=undefined, a=1) {
    if (!context) { return; }
    __drawStroke = true;
    if (typeof r === 'string') {
        context.strokeStyle = r;
    } else {
        context.strokeStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
    }
}

export function textAlign(align) {
    context.textAlign = align;
}

export function translate(x, y) {
    __translateX = x;
    __translateY = y;
}

export function write(x, y, text) {
    x += __translateX;
    y += __translateY;
    if (__drawStroke) {
        context.strokeText(text, x, y);
    }
    if (__drawFill) {
        context.fillText(text, x, y);
    }
}
