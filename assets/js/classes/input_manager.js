let _inputManager;
export class InputManager {
    constructor(inputMapping) {
        this.keys = {};
        this._actions = {};
        for (const [key, actionData] of Object.entries(inputMapping)) {
            const [ action, description ] = actionData;
            this._actions[action] = this._actions[action] || new InputAction(action, description);
            this.keys[key] = new Input(key, this._actions[action]);
            this._actions[action].addKey(this.keys[key]);
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

    replaceKeyForAction(inputAction, oldInput, newInputKey) {
        if (oldInput.key === newInputKey) {
            return oldInput; // Already this button, no need to do anything.
        }
        // First, checks if the new key in already used elsewhere.
        const inputAlreadyUsed = this.keys[newInputKey];
        if (inputAlreadyUsed) {
            this._switchInputKeys(inputAlreadyUsed, oldInput);
            return inputAlreadyUsed;
        } else {
            inputAction.removeKey(oldInput);
            delete this.keys[oldInput.key];
            const newInput = new Input(newInputKey, inputAction);
            this.keys[newInputKey] = newInput;
            inputAction.addKey(newInput);
            return newInput;
        }
    }

    _switchInputKeys(keyInputA, keyInputB) {
        const actionA = keyInputA.action;
        const actionB = keyInputB.action;
        actionA.removeKey(keyInputA);
        actionB.removeKey(keyInputB);
        actionA.addKey(keyInputB);
        actionB.addKey(keyInputA);
    }
}

export const configInputManager = (inputMapping) => {
    if (_inputManager) {
        throw "The input manager is already configured. Use `getInputManager` instead.";
    }
    _inputManager = new InputManager(inputMapping);
    return _inputManager;
};

export const getInputManager = () => {
    if (!_inputManager) {
        throw "InputManager need to be configured before used ! See `configInputManager`";
    }
    return _inputManager;
};


export class Input {
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


export class InputAction {
    constructor(name, description) {
        this.name = name;
        this.description = description;
        this.value = 0;
        this.keys = [];
    }

    addKey(keyInput) {
        keyInput.action = this;
        this.keys.push(keyInput);
    }

    removeKey(key) {
        for (const keyIndex in this.keys) {
            const inputKey = this.keys[keyIndex];
            if (inputKey === key) { // Removes the old key binding.
                inputKey.released(); // Be sure the key is released to avoid calling action in continue.
                inputKey.action = undefined;
                this.keys.splice(keyIndex, 1);
                return true;
            }
        }
        return false;
    }

    pressed() {
        if (this.callback && this.value == 0) {
            this.callback();
        }
        this.value++;
        console.log(`-- ${this.name} is pressed. Its value: ${this.value}`);
    }

    released() {
        this.value--;
        console.log(`-- ${this.name} is released. Its value: ${this.value}`);
    }
}