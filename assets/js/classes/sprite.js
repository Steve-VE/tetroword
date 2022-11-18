import { debugMessage } from "../functions/debug_functions";
import { Vector } from "./vector";
import { drawImage } from "../functions/drawing_functions";

export class SpriteSheet {
    static getSpriteSheet(spriteSheetName) {
        return SpriteSheet._spriteSheetCollection[spriteSheetName];
    }

    constructor(spriteSheetName, source, rowNumber, columnNumber) {
        this.name = spriteSheetName;
        debugMessage(`-- Loading spritesheet (${source})`);
        this.source = source;
        this.image = new Image();
        this.image.src = this.source;

        this.row = rowNumber;
        this.column = columnNumber;
        this.numberOfSprites = this.row * this.column;

        this.loaded = new Promise((resolve, reject) => {
            this.image.onload = () => {
                this.width = this.image.width;
                this.height = this.image.height;
                this.spriteSize = new Vector(this.width / this.column, this.height / this.row);
                debugMessage('---- Spritesheet loaded !');
                resolve();
            };
        });
        if (SpriteSheet._spriteSheetCollection === undefined) {
            SpriteSheet._spriteSheetCollection = {};
        }
        SpriteSheet._spriteSheetCollection[this.name] = this;
    }

    draw(spriteIndex, x, y, width, height) {
        const pos = new Vector(
            (spriteIndex % this.column) * this.spriteSize.x,
            Math.floor(spriteIndex / this.column) * this.spriteSize.y
        );
        drawImage(
            this.image,
            pos.x, pos.y, this.spriteSize.x, this.spriteSize.y,
            x, y, width, height
        );
    }
}
