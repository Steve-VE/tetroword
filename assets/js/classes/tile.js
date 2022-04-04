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

    draw(x, y, size=1, forcedFrame) {
        let colorSchemeIndex = 1;
        if (this.state === 'active' || this.canBeSelected) {
            colorSchemeIndex = 0;
        }
        const frameIndex = forcedFrame != undefined && !this.canBeSelected ? forcedFrame : this.frameIndex;
        spriteTile.draw(frameIndex, x, y, tileSize * size, tileSize * size);
        if (size === 1) {
            this.drawLetter(x, y, colorSchemeIndex);
        }
    }

    drawLetter(x, y, colorIndex) {
        if (!this.letter) {
            return;
        }
        const colors = ['rgba(255, 255, 255, 0.6)', 'rgba(255, 255, 255, 0.2)'];
        if (this.canBeSelected) {
            fill('white');
        } else {
            fill(colors[colorIndex]);
        }
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