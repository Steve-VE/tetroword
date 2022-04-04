
class SpriteSheet {
    constructor(source, rowNumber, columnNumber) {
        this.loaded = false;
        this.source = source;
        this.image = new Image();
        this.image.src = this.source;

        this.row = rowNumber;
        this.column = columnNumber;
        this.numberOfSprites = this.row * this.column;

        this.image.onload = () => {
            this.width = this.image.width;
            this.height = this.image.height;
            this.spriteSize = new Vector(this.width / this.column, this.height / this.row);
        };
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
