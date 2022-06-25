class InputManager {
    constructor(inputMapping) {
        this.keys = {};
        this._actions = {};
        for (const [key, action] of Object.entries(inputMapping)) {
            this._actions[action] = this._actions[action] || new InputAction();
            this.keys[key] = new Input(key, this._actions[action]);
        }
        document.addEventListener('keydown', this.keyPressed.bind(this));
        document.addEventListener('keyup', this.keyRelased.bind(this));
    }

    action(actionName) {
        const action = this.getAction(actionName);
        return action.value > 0;
    }

    bind(actionName, callback) {
        const action = this.getAction(actionName);
        action.callback = callback;
    }

    getAction(actionName) {
        const action = this._actions[actionName];
        if (!action) {
            throw `There is no input's action named "${actionName}".`;
        }
        return action;
    }

    keyPressed(ev) {
        const key = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key;
        const input = this.keys[key];
        if (input) {
            ev.preventDefault();
            input.pressed();
        }
    }

    keyRelased(ev) {
        const key = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key;
        const input = this.keys[key];
        if (input) {
            input.released();
        }
    }
}


class Input {
    constructor(key, action) {
        this.key = key;
        this._pressed = false;
        this.action = action;
    }

    pressed() {
        if (!this._pressed) {
            this._pressed = true;
            this.action.pressed();
        }
    }

    released() {
        if (this._pressed) {
            this._pressed = false;
            this.action.released();
        }
    }
}


class InputAction {
    constructor() {
        this.value = 0;
    }

    pressed() {
        if (this.callback && this.value == 0) {
            this.callback();
        }
        this.value++;
    }

    released() {
        this.value--;
    }
}