class Tile {
    constructor(letter, frameIndex=0) {
        this.letter = letter;
        this.state = 'active';
        this.selected = false;
        this.frameIndex = frameIndex;
    }

    activeSelectiveMode() {
        this.state = 'selectable';
    }

    disableSelectiveMode() {
        this.state = 'locked';
    }

    draw(x, y, size=1, forcedFrame=undefined) {
        let frameIndex = this.frameIndex;
        if (forcedFrame !== undefined && !this.canBeSelected) {
            frameIndex = forcedFrame;
        }
        spriteTile.draw(frameIndex, x, y, tileSize * size, tileSize * size);
        if (size === 1) {
            this.drawLetter(x, y, forcedFrame !== undefined);
        }
    }

    drawLetter(x, y, transparent=false) {
        if (!this.letter) {
            return;
        }
        if (this.state === 'active' || this.canBeSelected) {
            fill('white');
        } else if (transparent) {
            fill('rgba(255, 255, 255, 0.2)');
        } else {
            fill('rgba(255, 255, 255, 0.6)');
        }
        textAlign('center');
        write(x + (tileSize / 2), y + (tileSize / 2) + 8, this.letter);
    }

    empty() {
        this.letter = false;
        this.selected = false;
    }

    get canBeSelected() {
        return this.state === 'selectable' && !this.selected && this.letter;
    }
}