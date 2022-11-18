export class Vector {
    constructor(x=0, y=0) {
        this._position = [x, y];
    }

    get x() { return this._position[0]; }
    set x(param) { this._position[0] = param; }

    get y() { return this._position[1]; }
    set y(param) { this._position[1] = param; }
}
