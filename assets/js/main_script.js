import { SpriteSheet } from "./classes/sprite";
import { GameContainer } from "./classes/game_container";

let canvas;
let context;
let gameContainer;
let spriteTile;

window.onload = function mainScript() {
    const fontSize = 24;
    canvas = document.querySelector('canvas');
    context = canvas.getContext('2d');
    // context.font = `${fontSize}px Titillium Web`;
    context.font = `${fontSize}px monospace`;
    spriteTile = new SpriteSheet("tile", 'assets/img/tile.png', 2, 4);
    spriteTile.loaded.then(() => {
        gameContainer = new GameContainer();
    });
};
