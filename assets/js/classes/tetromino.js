const letterPatterns = {
    j: ['r', 'a', 'x', 'c'],
    l: ['m', 'e', 'b', 'z'],
    i: ['n', 'i', 'f', 't'],
    o: ['d', 'o', 'g', 'v'],
    s: ['n', 'u', 'l', 'k'],
    z: ['f', 'y', 's', 'j'],
    t: ['p', 'e', 'w', 'q'],
};

class Tetromino {
    static shapes(shapeName) {
        const _shapes = {
            j: [
                [1, 0, 0],
                [1, 1, 1],
            ],
            l: [
                [0, 0, 1],
                [1, 1, 1],
            ],
            i: [
                [0, 0, 0, 0],
                [1, 1, 1, 1],
                [0, 0, 0, 0],
            ],
            o: [
                [1, 1],
                [1, 1],
            ],
            s: [
                [0, 1, 1],
                [1, 1, 0],
            ],
            z: [
                [1, 1, 0],
                [0, 1, 1],
            ],
            t: [
                [0, 1, 0],
                [1, 1, 1],
                [0, 0, 0],
            ],
        };
        return _shapes[shapeName];
    }
    static shapeNames() { return ['i', 'j', 'l', 'o', 's', 't', 'z']; }

    constructor (x=4, y=-2, shapeIndex=false) {
        this.shapeIndex = shapeIndex || Math.floor(Math.random() * 7);
        this.type = Tetromino.shapeNames()[this.shapeIndex];
        if (this.type === 'i') { // Position's adjustment in case the tetromino is a pipe.
            x--;
            y++;
        }
        this.gridPosition = new Vector(x, y);
        const shapeScheme = Tetromino.shapes(this.type);
        const letters = letterPatterns[this.type].slice();
        this.shape = [];
        for (let y = 0; y < shapeScheme.length; y++) {
            this.shape.push([]);
            for (let x = 0; x < shapeScheme[y].length; x++) {
                if (shapeScheme[y][x]) {
                    const block = new Tile(letters.pop(), this.shapeIndex);
                    this.shape[y].push(block);
                } else {
                    this.shape[y].push(false);
                }
            }
        }
    }

    canRotate(shape, rx=0, ry=0) {
        if (this.type === 'o') {
            return true; // The square tetromino can rotate in any circumstance/
        }
        const grid = gameContainer.grid;
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[0].length; x++) {
                if (!shape[y][x]) { continue; }
                const pos = new Vector(this.gridPosition.x + x + rx, this.gridPosition.y + y + ry);
                if (pos.x < 0 || pos.x >= gridSize.x || (
                    pos.y >= 0 && (pos.y >= gridSize.y || grid[pos.y][pos.x]))) {
                    return false;
                }
            }
        }
        return true;
    }

    draw(absX=false, absY=false, size=1.0) {
        const position = new Vector(
            absX !== false ? absX : (this.gridPosition.x * tileSize * size),
            absY !== false ? absY : (this.gridPosition.y * tileSize * size)
        );
        // Draws each tiles composing the tetromino.
        for (let y = 0; y < this.shape.length; y++) {
            for (let x = 0; x < this.shape[0].length; x++) {
                if (!this.shape[y][x]) { continue; }
                const pos = new Vector(
                    position.x + (x * tileSize * size),
                    position.y + (y * tileSize * size)
                );
                const tile = this.shape[y][x];
                tile.draw(pos.x, pos.y, size);
            }
        }
    }

    goDown() {
        if (this.canGoDown) {
            this.gridPosition.y++;
            return true;
        } else {
            this.lock();
            this.locked = true;
            return false;
        }
    }

    goLeft() {
        if (this.canGoLeft) {
            this.gridPosition.x--;
        }
    }

    goRight() {
        if (this.canGoRight) {
            this.gridPosition.x++;
        }
    }

    lock() {
        const grid = gameContainer.grid;
        for (let y = 0; y < this.shape.length; y++) {
            for (let x = 0; x < this.shape[0].length; x++) {
                const tile = this.shape[y][x];
                if (!tile) {
                    continue;
                }
                if (this.gridPosition.y < 0) {
                    gameContainer.gameOver();
                    return;
                }
                tile.state = 'locked';
                grid[this.gridPosition.y + y][this.gridPosition.x + x] = tile;
            }
        }
        gameContainer.resetTetromino();
    }

    rotateLeft() {
        const newShape = [];
        const height = this.shape.length;
        const width = this.shape[0].length;
        for (let y = 0; y < width; y++) {
            newShape.push([]);
            for (let x = 0; x < height; x++) {
                newShape[y].push(this.shape[x][width - y - 1]);
            }
        }
        if (this.canRotate(newShape)) {
            this.shape = newShape;
        } else if(this.canRotate(newShape, -1)) {
            this.gridPosition.x -= 1;
            this.shape = newShape;
        } else if(this.canRotate(newShape, -2)) {
            this.gridPosition.x -= 2;
            this.shape = newShape;
        } else if(this.canRotate(newShape, 1)) {
            this.gridPosition.x += 1;
            this.shape = newShape;
        } else if(this.canRotate(newShape, 2)) {
            this.gridPosition.x += 2;
            this.shape = newShape;
        }
    }

    rotateRight() {
        const newShape = [];
        const height = this.shape.length;
        const width = this.shape[0].length;
        for (let y = 0; y < width; y++) {
            newShape.push([]);
            for (let x = height - 1; x >= 0; x--) {
                newShape[y].push(this.shape[x][y]);
            }
        }
        if (this.canRotate(newShape)) {
            this.shape = newShape;
        }
    }

    get canGoDown() {
        const grid = gameContainer.grid;
        for (let y = 0; y < this.shape.length; y++) {
            for (let x = 0; x < this.shape[0].length; x++) {
                if (!this.shape[y][x]) { continue; }
                const pos = new Vector(this.gridPosition.x + x, this.gridPosition.y + y + 1);
                if (pos.y >= 0 && (pos.y >= gridSize.y || grid[pos.y][pos.x])) {
                    return false;
                }
            }
        }
        return true;
    }

    get canGoLeft() {
        const grid = gameContainer.grid;
        for (let y = 0; y < this.shape.length; y++) {
            for (let x = 0; x < this.shape[0].length; x++) {
                if (!this.shape[y][x]) { continue; }
                const pos = new Vector(this.gridPosition.x + x, this.gridPosition.y + y);
                if (pos.x <= 0 || pos.x >= gridSize.x) {
                    return false;
                }
                if (pos.y >=0 && (pos.x <= 0 || grid[pos.y][pos.x - 1])) {
                    return false;
                }
            }
        }
        return true;
    }

    get canGoRight() {
        const grid = gameContainer.grid;
        for (let y = 0; y < this.shape.length; y++) {
            for (let x = 0; x < this.shape[0].length; x++) {
                if (!this.shape[y][x]) { continue; }
                const pos = new Vector(this.gridPosition.x + x + 1, this.gridPosition.y + y);
                if (pos.x <= 0 || pos.x >= gridSize.x) {
                    return false;
                }
                if (pos.y >=0 && (pos.x >= gridSize.x || grid[pos.y][pos.x])) {
                    return false;
                }
            }
        }
        return true;
    }
}
