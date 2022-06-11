// Score constants.
const __POINTS_WORD_NEW = 100;
const __POINTS_WORD_DUPLICATE = 2;
const __POINTS_PIECE_DROP = 1;
const __POINTS_LINE_ERASED = 50;

class ScoreManager {
    constructor() {
        this.foundWords = {};
        this.scores = {
            tetris: 0,
            words: 0,
        };
        // Stats
        this.nbreOfDroppedPieces = 0;
        this.timesLinesWasErasedBy = {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
        };
        this.nbreOfErasedLines = 0;
    }

    addScoreForDroppedPiece() {
        this.nbreOfDroppedPieces++;
        this._addScore('tetris', __POINTS_PIECE_DROP);
    }

    addScoreForErasedLine(nbreOfLines=1, level=1) {
        this.nbreOfErasedLines += nbreOfLines;
        this.timesLinesWasErasedBy[nbreOfLines]++;
        let multiplicator = (nbreOfLines > 1 ? 1.25 : 1) * level;
        while (nbreOfLines > 1) {
            multiplicator *= nbreOfLines;
            nbreOfLines--;
        }
        this._addScore('tetris', __POINTS_LINE_ERASED * multiplicator);
    }

    addWord(word) {
        const wordSizeBonusLimit = 3;
        let multiplicator = (word.length > (wordSizeBonusLimit + 1) ? 1.25 : 1);
        for (let i = (word.length - wordSizeBonusLimit); i > 1; i--) {
            multiplicator *= i;
        }
        if (this.wordAlreadyFound(word)) {
            this.foundWords[word]++;
            this._addScore('words', __POINTS_WORD_DUPLICATE * multiplicator);
        } else {
            this.foundWords[word] = 1;
            this._addScore('words', __POINTS_WORD_NEW * multiplicator);
        }
    }

    wordAlreadyFound(word) {
        return Boolean(this.foundWords[word]);
    }

    _addScore(category, points) {
        this.scores[category] += Math.floor(points);
        console.log(`-- Score: ${this.score}`);
    }

    get numberOfFoundWords() {
        return Object.keys(this.foundWords).length;
    }

    get numberOfSubmittedWords() {
        return Object.values(this.foundWords).reduce((v1, v2) => v1 + v2);
    }

    get score() {
        return this.scores.tetris + this.scores.words;
    }
}
