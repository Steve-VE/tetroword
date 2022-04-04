const tileSize = 38;
const gridSize = new Vector(10, 20);
const gridWidth = tileSize * gridSize.x;
const gridHeight = tileSize * gridSize.y;

let canvas;
let context;
let gameContainer;

const wordsLists = {
    3: _3_letters,
    4: _4_letters,
    5: _5_letters,
    6: _6_letters,
    7: _7_letters,
    8: _8_letters,
    9: _9_letters,
    10: _10_letters,
    11: _11_letters,
    12: _12_letters,
    13: _13_letters,
    14: _14_letters,
    15: _15_letters,
    16: _16_letters,
    17: _17_letters,
    18: _18_letters,
    19: _19_letters,
    20: _20_letters,
    21: _21_letters,
};

window.onload = function () {
    const fontSize = 24;
    canvas = document.querySelector('canvas');
    context = canvas.getContext('2d');
    // context.font = `${fontSize}px Titillium Web`;
    context.font = `${fontSize}px monospace`;
    context.textAlign = "center";
    gameContainer = new GameContainer();
};
