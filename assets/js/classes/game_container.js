const [INTRO, TETRIS, WORD] = [0, 1, 2];

function _initiateInputs() {
    const inputNames = ['left', 'right', 'up', 'down', 'rotateLeft', 'rotateRight', 'pause'];
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
    ArrowUp: 'up',
    z: 'up',
    ArrowDown: 'down',
    s: 'down',
    ' ': 'rotateLeft',
    a: 'rotateLeft',
    e: 'rotateRight',
    Tab: 'pause',
};
const inputStates = _initiateInputs();


class GameContainer {
    constructor() {
        this.fps = 60;
        this.framerate = 1000 / this.fps;
        this.framecount = 0;
        this.started = false;
        this.state = INTRO;
        this.margin = new Vector(
            (canvas.width - gridWidth) / 2,
            (canvas.height - gridHeight) / 2
        );

        this.htmlUI = new HtmlUI();
        this.scoreManager = new ScoreManager();

        // Delays used by the Tetris game part.
        this.moveDelay = new Timer(this.fps * 0.75);
        this.inputDelay = new Timer({
            count: this.fps * 0.25,
            minimumCount: this.fps * 0.1,
        });

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
    }

    activeWordMode() {
        this.state = WORD;
        this.addTextBox();
    }

    addTextBox() {
        // const htmlTextBox = new HtmlTextBox();
        // canvas.parentElement.append(htmlTextBox.element);
        this.textBox = document.createElement('span');
        this.textBox.classList.add('text-input');
        const htmlTextContainer = document.createElement('div');
        htmlTextContainer.classList.add('text-box');
        const htmlTextBoxContainer = document.createElement('div');
        htmlTextBoxContainer.classList.add('container');
        htmlTextContainer.append(this.textBox);
        htmlTextBoxContainer.append(htmlTextContainer);
        const bottomLineIndex = this._completeLinesIndex[this._completeLinesIndex.length -1];
        // The text box will be displayed on the top of the completed lines.
        let posY = (this._completeLinesIndex[0] - 3) * tileSize;
        // If the completed lines are too high, we display the text box under them.
        if (bottomLineIndex <= 6) {
            posY = (bottomLineIndex + 2) * tileSize;
        }
        htmlTextBoxContainer.style.top = `${posY}px`;
        canvas.parentElement.append(htmlTextBoxContainer);
    }

    checkLines() {
        for (let y = 0; y < this.grid.length; y++) {
            const line = this.grid[y];
            let lineIsComplete = line.every(tile => tile);
            if (lineIsComplete) {
                this._completeLinesIndex.push(y);
            }
        }
        if (this.activeLines.length) {
            for (const line of this.activeLines) {
                for (const tile of line) {
                    tile.activeSelectiveMode();
                    this.lettersPool.push(tile);
                }
            }
            this.activeWordMode();
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
        if (this.scoreManager.wordAlreadyFound(word)) { // Valid word, since this word was already found by the player.
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
        // Display the score.
        let score = this.scoreManager.score ? String(this.scoreManager.score) : '';
        textAlign('right');
        fill('gray');
        write(-20 - (13 * score.length), 20, ''.padStart(12 - score.length, 0));
        if (score) {
            fill('white');
            write(-20, 20, score);
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
            fill('rgba(128, 200, 255, 0.2');
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
        let nbreOfErasedLines = 0;
        for (let y = 0; y < this.grid.length; y++) {
            const line = this.grid[y];
            const lineIsComplete = line.every(tile => tile);
            if (lineIsComplete) {
                nbreOfErasedLines++;
                this.grid.splice(y, 1);
                const newLine = [];
                for (let i = 0; i < gridSize.x; i++) {
                    newLine.push(0);
                }
                this.grid.unshift(newLine);
            }
        }
        if (nbreOfErasedLines) {
            this.scoreManager.addScoreForErasedLine(nbreOfErasedLines);
        }
        this.lettersPool = [];
        this._completeLinesIndex = [];
    }

    gameOver() {
        const delay = 5;
        const fillGrid = (x, y) => {
            if (x >= gridSize.x) {
                x = 0;
                y--;
            }
            if (y < 0) {
                return;
            }
            const frameIndex = 7; // Frame index for the gray tile.
            const tile = this.grid[y][x];
            if (tile) {
                tile.frameIndex = frameIndex;
            } else {
                this.grid[y][x] = new Tile('', frameIndex);
            }
            setTimeout(fillGrid.bind(this, ++x, y), delay);
        };
        this.state = INTRO;
        setTimeout(fillGrid.bind(this, 0, gridSize.y - 1), delay);
    }

    gameStart() {
        this.nextPieces = [];
        for (let i = 0; i < 4; i++) {
            this.nextPieces.push(new Tetromino());
        }
        this.tetromino = new Tetromino();
        this.state = TETRIS;
    }

    hardDropTetromino() {
        if (this.tetromino) {
            while (this.tetromino.canGoDown) {
                this.tetromino.goDown();
            }
            this.tetromino.lock();
            this.moveDelay.reset();
        }
    }

    keyPressed(ev) {
        const key = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key;
        const input = inputMapping[key];
        const inputState = inputStates[input];
        if (inputState) {
            ev.preventDefault();
            if (!inputState.pressed) {
                this.inputDelay.reset();
                this.inputDelay.count = 0;
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
        if (inputStates.up.pressed) {
            if (this.inputDelay.finished) {
                this.hardDropTetromino();
                this.inputDelay.reset();
            } else {
                this.inputDelay.decrease();
            }
        } else if (inputStates.left.pressed) {
            if (this.inputDelay.finished) {
                this.tetromino.goLeft();
                this.inputDelay.lowerDelay();
            } else {
                this.inputDelay.decrease();
            }
        } else if (inputStates.down.pressed) {
            if (this.inputDelay.finished) {
                this.moveDelay.reset();
                if (this.tetromino.canGoDown) {
                    this.tetromino.goDown();
                } else{
                    this.tetromino.lock();
                }
                this.inputDelay.lowerDelay();
            } else {
                this.inputDelay.decrease();
            }
        } else if (inputStates.right.pressed) {
            if (this.inputDelay.finished) {
                this.tetromino.goRight();
                this.inputDelay.lowerDelay();
            } else {
                this.inputDelay.decrease();
            }
        } else if (inputStates.rotateLeft.pressed) {
            if (this.inputDelay.finished) {
                this.tetromino.rotateLeft();
                this.inputDelay.reset();
            } else {
                this.inputDelay.decrease();
            }
        } else if (inputStates.rotateRight.pressed) {
            if (this.inputDelay.finished) {
                this.tetromino.rotateRight();
                this.inputDelay.reset();
            } else {
                this.inputDelay.decrease();
            }
        }
    }

    manageWordInput(ev) {
        const { key } = ev;
        let refrestWord = false;
        if (key === 'Backspace' && this.wordProposal.length) { // Deletes last character.
            const tile = this.wordProposal.pop();
            tile.selected = false;
            refrestWord = true;
        } else if (key === 'Enter' && this.wordProposal.length >= 3) { // Submits the current word.
            const foundWord = this.checkWord(this.proposedWord);
            if (foundWord) {
                // Adds the found word into the score table.
                this.scoreManager.addWord(foundWord);
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
                refrestWord = true;
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
                refrestWord = true;
            } else { // Returns to the Tetris mode.
                this.removeTextBox();
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
                    refrestWord = true;
                    tile.selected = true;
                    break;
                }
            }
        }
        if (refrestWord) {
            this.textBox.innerText = ` ${this.proposedWord} `;
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
        if (this.tetromino) {
            if (this.moveDelay.finished) {
                this.tetromino.goDown();
                this.moveDelay.reset();
            }
            this.moveDelay.decrease();
        }
    }

    processWordGame() {
        return;
    }

    removeTextBox() {
        this.textBox.parentElement.remove();
        this.textBox = undefined;
    }

    resetTetromino() {
        delete this.tetromino;
        this.inputDelay.reset();
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
