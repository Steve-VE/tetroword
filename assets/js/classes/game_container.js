import { GameMenu } from "./game_menu.js";
import { Vector } from "./vector.js";
import { ScoreManager } from "./score_manager.js";
import { Timer } from "./timer.js";
import { fill, noStroke, rect, stroke, translate } from "../functions/drawing_functions.js";
import { getCanvas } from "../functions/functions.js";
import { configInputManager } from "./input_manager.js";
import { Tetromino } from "./tetromino.js";
import { tileSize, gridHeight, gridSize, gridWidth } from "../constants.js";
import { getConfig } from "./config.js";
import { debugMessage } from "../functions/debug_functions.js";
import { Tile } from "./tile.js";

const [INTRO, TETRIS, WORD] = [0, 1, 2];

let _gameContainer;

const config = getConfig();
const inputs = configInputManager({
    [config.get('left', 'ArrowLeft')]: ['left', "Move to Left"],
    // q: ['left', "Move to Left"],
    [config.get('right', 'ArrowRight')]: ['right', "Move to Right"],
    // d: ['right', "Move to Right"],
    [config.get('up', 'ArrowUp')]: ['up', "Hard Drop"],
    // z: ['up', "Hard Drop"],
    [config.get('down', 'ArrowDown')]: ['down', "Soft Drop"],
    // s: ['down', "Soft Drop"],
    [config.get('rotateLeft', ' ')]: ['rotateLeft', "Rotate Left"],
    // a: ['rotateLeft', "Rotate Left"],
    [config.get('rotateRight', 'e')]: ['rotateRight', "Rotate Right"],
    [config.get('pause', 'Tab')]: ['pause', "Pause"],
});

export class GameContainer {
    constructor() {
        this.fps = 60;
        this.framerate = 1000 / this.fps;
        this.framecount = 0;
        this.started = false;
        this.state = INTRO;
        this.canvas = getCanvas();
        this.margin = new Vector(
            (this.canvas.width - gridWidth) / 2,
            (this.canvas.height - gridHeight) / 2
        );

        this.gameMenu = new GameMenu({
            startMethod: this.gameStart.bind(this),
        });
        this.scoreManager = new ScoreManager();
        this.initializeGrid();

        // Variables and delays used by the Tetris game part.
        this._minSpeed = this.fps * 0.03;

        // Variables and delays used by the Word game part.
        this.lettersPool = [];
        this.wordProposal = [];
        this.writingTimer = new Timer({
            count: this.fps * 20,
            whenIsOver: this.activeTetrisMode.bind(this),
        });
        this._completeLinesIndex = [];

        setInterval(this.process.bind(this), this.framerate);
        document.addEventListener('keydown', this.keyPressed.bind(this));

        const scoreSectionTemplate = document.getElementById('score-section-template').content;
        this.scoreSection = scoreSectionTemplate.cloneNode(true);
        this.canvas.parentElement.append(this.scoreSection);
        this.scoreSection = document.querySelector('.score-section');
        this.scoreSection.style.width = `${(this.canvas.width - gridWidth) / 2}px`;

        this.scoreManager.onUpdate(() => {
            const score = String(this.scoreManager.score);
            document.querySelector('.dummy-score').innerText = ''.padStart(12 - score.length, '0');
            document.querySelector('.actual-score').innerText = score;
        });
    }

    activeWordMode() {
        this.state = WORD;
        this.writingTimer.reset();
        this.addTextBox();
    }

    activeTetrisMode() {
        this.removeTextBox();
        this.eraseLines();
        if (!this.tetromino) {
            this.dropNextTetromino();
        }
        this.state = TETRIS;
    }

    addTextBox() {
        this.textBox = document.createElement('span');
        this.textBox.classList.add('text-input');
        this.textBox.textContent = ' ';
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
        this.canvas.parentElement.append(htmlTextBoxContainer);
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
        const relevantWordList = data.words[config.lang][word.length];
        if (relevantWordList.includes(word)) { // Valid word !
            return word;
        }
        return false; // No valid word was found.
    }

    computeDelay() {
        debugMessage(`-- Difficulty: ${this.difficulty}`);
        debugMessage(`-- Old Speed: ${this.speed}`);
        const newSpeed = this.fps * (0.75 - (this.difficulty * 0.25));
        this.speed = Math.round(Math.max(this._minSpeed, newSpeed));
        this.moveDelay.set(this.speed);
        this.inputDelay = new Timer({
            count: this.speed * 0.3,
            minimumCount: this.speed * 0.8,
        });
        debugMessage(`-- New Speed: ${this.speed}`);
    }

    draw () {
        if (this.paused) {
            return;
        }
        // Background.
        fill(10, 20, 30);
        rect(0, 0, this.canvas.width, this.canvas.height);
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
            // Display the timer as a bar.
            const { completion } = this.writingTimer;
            const colorGood = [75, 120, 180, completion];
            const colorHurry = [80, 25, 100];
            const pos = new Vector(0, (gridSize.y * tileSize) + 2);
            const size = new Vector(tileSize * this.grid[0].length, 16);
            fill('black');
            stroke('white');
            rect(pos.x, pos.y, size.x, size.y);
            noStroke();
            fill(...colorHurry);
            rect(pos.x, pos.y, size.x * completion, size.y);
            fill(...colorGood);
            rect(pos.x, pos.y, size.x * completion, size.y);
        }
        translate(0, 0);
    }

    drawGrid() {
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
        this.nextPieces.push(new Tetromino(this));
    }

    eraseLines() {
        let nbrOfErasedLines = 0;
        let completion = 0;
        for (let y = 0; y < this.grid.length; y++) {
            const line = this.grid[y];
            const lineIsComplete = line.every(tile => tile);
            if (lineIsComplete) {
                completion += line.filter(tile => tile.letter == false).length / line.length;
                nbrOfErasedLines++;
                this.grid.splice(y, 1);
                const newLine = [];
                for (let i = 0; i < gridSize.x; i++) {
                    newLine.push(0);
                }
                this.grid.unshift(newLine);
            }
        }
        if (nbrOfErasedLines) {
            completion /= nbrOfErasedLines;
            this.increasePenalty(nbrOfErasedLines * 10);
            if (completion === 1) { // All letters was used ! Amazing !
                this.scoreManager.incrementAllLettersUsed(nbrOfErasedLines);
            } else if (completion <= 0.8) { // 80% or less of letters was used: adds penalty points.
                let penaltyPoints = 9 - (completion * 10);
                penaltyPoints = Math.round(penaltyPoints * (penaltyPoints * 0.5)) * nbrOfErasedLines;
                this.increasePenalty(penaltyPoints);
            }
            this.scoreManager.addScoreForErasedLine(nbrOfErasedLines);
        }
        this.lettersPool = [];
        this._completeLinesIndex = [];
    }

    gameOver() {
        const fillingPromise = new Promise(resolve => {
            const delay = 5;
            const fillGrid = (x, y) => {
                if (x >= gridSize.x) {
                    x = 0;
                y--;
                }
                if (y < 0) {
                    this.tetromino = undefined;
                    return setTimeout(
                        eraseGrid.bind(this, this.grid.length - 1),
                        delay * 10
                    );
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
            const eraseGrid = (y) => {
                if (y < 0) {
                    return resolve();
                }
                this.grid[y] = [,,,,,,,,,,];
                setTimeout(eraseGrid.bind(this, --y), delay * 5);
            };
            this.state = INTRO;
            setTimeout(fillGrid.bind(this, 0, gridSize.y - 1), delay);
        });
        fillingPromise.then(() => {
            setTimeout(() => {
                this.gameMenu.render();
            }, 500);
        });
    }

    gameStart() {
        this.resetTimer();
        this.scoreManager.reset();
        this.difficulty = 0;
        this.penaltyPoints = 0; // When get 10 penalty points, increase the difficulty by 1.
        this.initializeGrid();

        this.nextPieces = [];
        for (let i = 0; i < 4; i++) {
            this.nextPieces.push(new Tetromino(this));
        }
        this.tetromino = new Tetromino(this);
        this.started = true;
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

    increasePenalty(points) {
        const penaltyLimit = 40;
        this.penaltyPoints += points;
        if (this.penaltyPoints >= penaltyLimit) { // Too much penalty points: increases the difficulty.
            const penaltySubstract = Math.floor(this.penaltyPoints / penaltyLimit);
            this.difficulty += penaltySubstract * 0.1;
            this.penaltyPoints -= penaltySubstract * penaltyLimit;
            this.computeDelay();
        }
    }

    initializeGrid() {
        this.grid = [];
        for (let y = 0; y < gridSize.y; y++) {
            this.grid[y] = [];
            for (let x = 0; x < gridSize.x; x++) {
                this.grid[y].push(0);
            }
        }
    }

    keyPressed(ev) {
        if (this.state === WORD) {
            this.manageWordInput(ev);
        }
    }

    manageTetrisInput() {
        if (this.paused) {
            return;
        }
        if (inputs.action('up')) {
            if (this.inputDelay.finished) {
                this.hardDropTetromino();
                this.inputDelay.reset();
            } else {
                this.inputDelay.decrease();
            }
        } else if (inputs.action('left')) {
            if (this.inputDelay.finished) {
                this.tetromino.goLeft();
                this.inputDelay.lowerDelay();
            } else {
                this.inputDelay.decrease();
            }
        } else if (inputs.action('down')) {
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
        } else if (inputs.action('right')) {
            if (this.inputDelay.finished) {
                this.tetromino.goRight();
                this.inputDelay.lowerDelay();
            } else {
                this.inputDelay.decrease();
            }
        }
        if (inputs.action('rotateLeft')) {
            if (this.inputDelay.finished) {
                this.tetromino.rotateLeft();
                this.inputDelay.reset();
            } else {
                this.inputDelay.decrease();
            }
        } else if (inputs.action('rotateRight')) {
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
                const alreadyFound = this.scoreManager.wordAlreadyFound(foundWord);
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
                if (alreadyFound) {
                    const percent = Math.min(1, foundWord.length / 8);
                    this.writingTimer.addTime(percent);
                } else {
                    this.writingTimer.reset();
                }
                this.wordProposal = [];
                refrestWord = true;
            } else {
                const removeWrongAlert = (ev) => {
                    const { animationName } = ev;
                    if (animationName === 'red-alert') {
                        this.textBox.classList.remove('wrong');
                        this.textBox.removeEventListener('animationend', removeWrongAlert);
                    }
                };
                this.textBox.classList.add('wrong');
                this.textBox.addEventListener('animationend', removeWrongAlert.bind(this));
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
                this.activeTetrisMode();
            }
        }

        const letter = key.length === 1 ? key.toUpperCase() : false;
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
            this.textBox.classList.remove('wrong');
            this.textBox.innerText = ` ${this.proposedWord} `;
            if (this.scoreManager.wordAlreadyFound(this.proposedWord)) {
                this.textBox.classList.add('already-found');
            } else {
                this.textBox.classList.remove('already-found');
            }
            if (this.letterUsageCompletion === 1) { // All letters were used, return to Tetris.
                this.activeTetrisMode();
            }
        }
    }

    process() {
        // debugMessage(`${this.framecount} (${Math.floor(this.framecount / this.fps)})`);
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
        this.writingTimer.process();
    }

    removeTextBox() {
        this.wordProposal = [];
        this.textBox.parentElement.remove();
        this.textBox = undefined;
    }

    resetInputDelay() {
        if (this.state != TETRIS) {
            return;
        }
        this.inputDelay.reset(0);
    }

    resetTetromino() {
        delete this.tetromino;
        this.inputDelay.reset();
        this.checkLines();
        if (this.state === TETRIS) {
            this.dropNextTetromino();
        }
    }

    /**
     * (Re)set the timers used for gameplay purpose.
     */
    resetTimer() {
        this.speed = this._minSpeed * 25;
        this.moveDelay = new Timer(this.speed);
        this.inputDelay = new Timer({
            count: this.speed * 0.3,
            minimumCount: this.speed * 0.8,
        });
        inputs.bind('left', this.resetInputDelay.bind(this));
        inputs.bind('right', this.resetInputDelay.bind(this));
        inputs.bind('down', this.resetInputDelay.bind(this));
        inputs.bind('up', this.resetInputDelay.bind(this));
        inputs.bind('rotateLeft', this.resetInputDelay.bind(this));
        inputs.bind('rotateRight', this.resetInputDelay.bind(this));
        inputs.bind('pause', this.togglePause.bind(this));
    }

    togglePause() {
        if (this.state != TETRIS) {
            return;
        }
        this.paused = !this.paused;
        if (this.paused) {
            // Adds CSS paused class;
            this.canvas.classList.add('paused');
            document.body.classList.add('paused');
        } else {
            // Removes CSS paused class;
            this.canvas.classList.remove('paused');
            document.body.classList.remove('paused');
        }
    }

    get activeLines() {
        const lines = [];
        for (const lineIndex of this._completeLinesIndex) {
            lines.push(this.grid[lineIndex]);
        }
        return lines;
    }

    get letterUsageCompletion() {
        let completion = 0;
        for (const lineIndex of this._completeLinesIndex) {
            const line = this.grid[lineIndex];
            completion += line.filter(tile => tile.letter == false).length / line.length;
        }
        return completion / this._completeLinesIndex.length;
    }

    get proposedWord() {
        return this.wordProposal.map(tile => tile.letter).join('');
    }
}

export const getGameContainer = () => {
    if (!_gameContainer) {
        _gameContainer = new GameContainer();
    }
    return _gameContainer;
};
