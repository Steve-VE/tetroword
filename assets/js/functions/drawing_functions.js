
let _drawFill = true;
let _drawStroke = false;
let _translateX =0;
let _translateY =0;


function drawImage(imageSrc, sx, sy, sw, sh, x, y, w, h) {
    if (!context) { return; }
    x += _translateX;
    y += _translateY;
    context.drawImage(imageSrc, sx, sy, sw, sh, x, y, w, h);
}


function fill(r, g=undefined, b=undefined, a=1) {
    if (!context) { return; }
    _drawFill = true;
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

function noFill() { _drawFill = false; }

function noStroke() { _drawStroke = false; }

function rect(x, y, w, h) {
    x += _translateX;
    y += _translateY;
    if (!context) { return; }
    if (_drawFill) {
        context.fillRect(x, y, w, h || w);
    }
    if (_drawStroke) {
        context.strokeRect(x, y, w, h || w);
    }
}

function stroke(r, g=undefined, b=undefined, a=1) {
    if (!context) { return; }
    _drawStroke = true;
    if (typeof r === 'string') {
        context.strokeStyle = r;
    } else {
        context.strokeStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
    }
}

function textAlign(align) {
    context.textAlign = align;
}

function translate(x, y) {
    _translateX = x;
    _translateY = y;
}

function write(x, y, text) {
    x += _translateX;
    y += _translateY;
    if (_drawStroke) {
        context.strokeText(text, x, y);
    }
    if (_drawFill) {
        context.fillText(text, x, y);
    }
}
