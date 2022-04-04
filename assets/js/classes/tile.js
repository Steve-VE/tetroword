class Tile {
    constructor(letter) {
        this.letter = letter;
        this.state = 'active';
        this.selected = false;
    }

    activeSelectiveMode() {
        this.state = 'selectable';
    }

    disableSelectiveMode() {
        this.state = 'locked';
    }

    draw(x, y) {
        const colorSchemes = [
            {
                dark: "#0d2f33",
                middle: "#1e5c63",
                light: "#2b99a6",
            },
            {
                dark: 64,
                middle: 86,
                light: 100,
            },
        ];
        let colorSchemeIndex = 1;
        if (this.state === 'active' || this.canBeSelected) {
            colorSchemeIndex = 0;
        }
        const colorScheme = colorSchemes[colorSchemeIndex];
        noStroke();
        fill(colorScheme.dark);
        rect(x, y, tileSize);
        fill(colorScheme.light);
        let offset = 2;
        rect(x + offset, y + offset, tileSize - (offset * 2));
        fill(colorScheme.middle);
        offset += 1;
        rect(x + offset, y + offset, tileSize - (offset * 2));
        fill(colorScheme.dark);
        offset += 2;
        rect(x + offset, y + offset, tileSize - (offset * 2));
        this.drawLetter(x, y, colorSchemeIndex);
    }

    drawLetter(x, y, colorIndex) {
        if (!this.letter) {
            return;
        }
        const colors = ['#2b99a6', '#cccccc'];
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