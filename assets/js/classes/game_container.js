const [TETRIS, WORD] = [0, 1];

function _initiateInputs() {
    const inputNames = ['left', 'right', 'down', 'rotateLeft', 'rotateRight', 'pause'];
    const inputs = {};
    for (let inputName of inputNames) {
        inputs[inputName] = {
            pressed: false,
            priority: 0,
        };
    }
    return inputs;
}

const inputMapping = {
    ArrowLeft: 'left',
    q: 'left',
    ArrowRight: 'right',
    d: 'right',
    ArrowDown: 'down',
    s: 'down',
    ' ': 'rotateLeft',
    Tab: 'pause',
};
const inputStates = _initiateInputs();


class GameContainer {
    constructor() {
        this.fps = 60;
        this.framerate = 1000 / this.fps;
        this.framecount = 0;
        this.state = TETRIS;
        this.margin = new Vector(
            (canvas.width - gridWidth) / 2,
            (canvas.height - gridHeight) / 2
        );

        // Used by the Tetris game part.
        this.moveDelayLimit = 45;
        this.moveDelay = this.moveDelayLimit;
        this.inputDelay = 0;
        this.initialInputDelay = 16;
        this.currentInputDelay = 0;
        this.tetromino = new Tetromino(Math.floor(gridSize.x / 2) - 1, 0);

        // Used by the Word game part.
        this.lettersPool = [];
        this.wordProposal = [];
        this.foundWords = {};

        // Initializes the grid.
        this._grid = [];
        for (let y = 0; y < gridSize.y; y++) {
            this._grid[y] = [];
            for (let x = 0; x < gridSize.x; x++) {
                this._grid[y].push(0);
            }
        }
        this._completeLinesIndex = [];

        setInterval(this.process.bind(this), this.framerate);
        document.addEventListener('keydown', this.keyPressed.bind(this));
        document.addEventListener('keyup', this.keyRelased.bind(this));
        this.nextPieces = [];
        for (let i = 0; i < 4; i++) {
            this.nextPieces.push(new Tetromino());
        }
    }

    checkLines() {
        for (let y = 0; y < this.grid.length; y++) {
            const line = this.grid[y];
            let lineIsComplete = line.every(tile => tile);
            if (lineIsComplete) {
                this._completeLinesIndex.push(y);
            }
        }
        if (this._completeLinesIndex.length) {
            for (const line of this.activeLines) {
                for (const tile of line) {
                    tile.activeSelectiveMode();
                    this.lettersPool.push(tile);
                }
            }
            this.state = WORD;
        }
    }

    checkWord(word) {
        /* TODO:
            shouldn't work with a static array client side but should ask
            the server if the word is valid. To rework before upload. */
        if (!word || word.length < 3 || word.length > 21) { // The word is too short or too long.
            return false;
        }
        word = word.toUpperCase();
        if (this.foundWords[word]) { // Valid word, since this word was already found by the player.
            return word;
        }
        const relevantWordList = wordsLists[word.length];
        if (relevantWordList.includes(word)) { // Valid word !
            return word;
        }
        return false; // No valid word was found.
    }

    draw () {
        if (this.paused) {
            return;
        }
        // Background.
        fill(10, 20, 30);
        rect(0, 0, canvas.width, canvas.height);
        translate(this.margin.x, this.margin.y);
        this.drawGrid();
        // Tetrominos.
        for (const index in this.nextPieces) {
            const tetromino = this.nextPieces[index];
            const first = index == 0;
            tetromino.draw(
                gridWidth + (first ? 40 : 60),
                (index * 60) + (first ? 60 : 100),
                first ? 0.8 : 0.5
            );
        }
        if (this.tetromino) {
            this.tetromino.draw();
        }
        if (this.state === WORD) {
            const textPosition = new Vector(gridWidth / 2, gridHeight * 0.6);
            noStroke();
            fill(0, 0, 0, 0.2);
            rect(
                textPosition.x - (this.proposedWord.length * 8),
                textPosition.y - 24,
                this.proposedWord.length * 16,
                32
            );
            fill('white');
            write(textPosition.x, textPosition.y, this.proposedWord);
        }
        translate(0, 0);
    }

    drawGrid() {
        const colors = ['#768494', '#68798c'];
        const colors2 = ['#8d9476', '#8c8868'];
        noStroke();
        // Draws background's lines.
        for (let x = 0; x < this.grid[0].length; x++) {
            if (x % 2) {
                continue;
            }
            fill('rgba(64, 64, 150, 0.2');
            rect(x * tileSize, 0, tileSize, tileSize * this.grid.length);
        }
        // Draws blocks (or shadow gradient for empty space).
        for (let y = 0; y < this.grid.length; y++) {
            const row = this.grid[y];
            for (let x = 0; x < row.length; x++) {
                const tile = row[x];
                const position = new Vector((x * tileSize), (y * tileSize));
                if (tile) { // Draws a block.
                    if (this.state === WORD) {
                        tile.draw(position.x, position.y, 1, 7);
                    } else {
                        tile.draw(position.x, position.y);
                    }
                } else { // Draws a shadow gradient.
                    const alpha = (1.0 / this.grid.length) * y;
                    fill(`rgba(0, 0, 0, ${alpha})`);
                    rect(position.x, position.y, tileSize);
                }
            }
        }
    }

    dropNextTetromino() {
        const nextTetromino = this.nextPieces.shift();
        this.tetromino = nextTetromino;
        this.nextPieces.push(new Tetromino());
    }

    eraseLines() {
        for (let y = 0; y < this.grid.length; y++) {
            const line = this.grid[y];
            let eraseLine = true;
            for (const tile of line) {
                if (!tile) {
                    eraseLine = false;
                    break;
                }
            }
            if (eraseLine) {
                this.grid.splice(y, 1);
                const newLine = [];
                for (let i = 0; i < gridSize.x; i++) {
                    newLine.push(0);
                }
                this.grid.unshift(newLine);
            }
        }
        this.lettersPool = [];
        this._completeLinesIndex = [];
    }

    keyPressed(ev) {
        const key = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key;
        const input = inputMapping[key];
        const inputState = inputStates[input];
        if (inputState) {
            ev.preventDefault();
            if (!inputState.pressed) {
                this.inputDelay = 0;
                this.resetInputDelay();
            }
            inputState.pressed = true;
        }
        if (this.state === WORD) {
            this.manageWordInput(ev);
        }
    }

    keyRelased(ev) {
        const key = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key;
        const input = inputMapping[key];
        const inputState = inputStates[input];
        if (inputState) {
            inputState.pressed = false;
        }
    }

    lowerInputDelay(delta=0.5) {
        this.currentInputDelay *= delta;
    }

    resetInputDelay() {
        this.currentInputDelay = this.initialInputDelay;
    }

    manageTetrisInput() {
        if (inputStates.pause.pressed) {
            inputStates.pause.pressed = false;
            this.paused = !this.paused;
            if (this.paused) {
                // Adds CSS paused class;
                canvas.classList.add('paused');
            } else {
                // Removes CSS paused class;
                canvas.classList.remove('paused');
            }
        }
        if (this.paused) {
            return;
        }
        if (inputStates.left.pressed) {
            if (this.inputDelay === 0) {
                this.tetromino.goLeft();
                this.lowerInputDelay();
                this.inputDelay = Math.max(1, this.currentInputDelay);
            } else {
                this.inputDelay--;
            }
        } else if (inputStates.down.pressed) {
            if (this.inputDelay === 0) {
                this.moveDelay = this.moveDelayLimit;
                if (this.tetromino.canGoDown) {
                    this.tetromino.goDown();
                } else{
                    this.tetromino.lock();
                }
                this.lowerInputDelay();
                this.inputDelay = Math.max(1, this.currentInputDelay);
            } else {
                this.inputDelay--;
            }
        } else if (inputStates.right.pressed) {
            if (this.inputDelay === 0) {
                this.tetromino.goRight();
                this.lowerInputDelay();
                this.inputDelay = Math.max(1, this.currentInputDelay);
            } else {
                this.inputDelay--;
            }
        }
        if (inputStates.rotateLeft.pressed) {
            if (this.inputDelay === 0) {
                this.tetromino.rotateLeft();
                this.inputDelay = this.currentInputDelay;
            } else {
                this.inputDelay--;
            }
        }
    }

    manageWordInput(ev) {
        const { key } = ev;
        if (key === 'Backspace' && this.wordProposal.length) { // Deletes last character.
            const tile = this.wordProposal.pop();
            tile.selected = false;
        } else if (key === 'Enter' && this.wordProposal.length >= 3) { // Submits the current word.
            const foundWord = this.checkWord(this.proposedWord);
            if (foundWord) {
                // Adds the found word into the score table.
                if (!this.foundWords[foundWord]) {
                    this.foundWords[foundWord] = 1;
                } else {
                    this.foundWords[foundWord]++;
                }
                // Erases all letters who was used to write this word.
                for (const line of this.activeLines) {
                    for (let i = 0; i < line.length; i++) {
                        const tile = line[i];
                        if (tile.selected) {
                            line[i].empty();
                        }
                    }
                }
                this.wordProposal = [];
            }
        } else if (key === 'Escape') { // Removes current word or returns to Tetris mode.
            if (this.wordProposal.length) { // Removes current word.
                for (const line of this.activeLines) {
                    for (const tile of line) {
                        if (tile.selected) {
                            tile.selected = false;
                        }
                    }
                }
                this.wordProposal = [];
            } else { // Returns to the Tetris mode.
                this.eraseLines();
                if (!this.tetromino) {
                    this.dropNextTetromino();
                }
                this.state = TETRIS;
            }
        }

        const letter = key.length === 1 ? key.toLowerCase() : false;
        // Adds the letter in the word if the letter is somewhere in the completed line(s).
        if (letter) {
            for (let i = 0; i < this.lettersPool.length; i++) {
                const tile = this.lettersPool[i];
                if (letter === tile.letter && tile.canBeSelected) {
                    this.wordProposal.push(this.lettersPool[i]);
                    tile.selected = true;
                    break;
                }
            }
        }
    }

    process() {
        // console.log(`${this.framecount} (${Math.floor(this.framecount / this.fps)})`);
        switch (this.state) {
            case TETRIS:
                this.processTetrisGame(); break;
            case WORD:
                this.processWordGame(); break;
        }
        this.draw();
        this.framecount++;
    }

    processTetrisGame() {
        this.manageTetrisInput();
        if (this.paused) {
            return;
        }
        if (this.moveDelay === 0) {
            this.tetromino.goDown();
            this.moveDelay = this.moveDelayLimit;
        }
        this.moveDelay --;
    }

    processWordGame() {
        return;
    }

    resetTetromino() {
        delete this.tetromino;
        this.resetInputDelay();
        this.checkLines();
        if (this.state === TETRIS) {
            this.dropNextTetromino();
        }
    }

    get activeLines() {
        const lines = [];
        for (const lineIndex of this._completeLinesIndex) {
            lines.push(this.grid[lineIndex]);
        }
        return lines;
    }

    get grid() {
        return this._grid;
    }

    get proposedWord() {
        return this.wordProposal.map(tile => tile.letter).join('');
    }
}
