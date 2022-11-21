import { getConfig } from "./config.js";
import { debugMessage } from "../functions/debug_functions.js";
import { getCanvas, translation } from "../functions/functions.js";
import { getInputManager } from "./input_manager.js";

const [MAIN_MENU, SETTINGS] = [1, 2];
const canvas = getCanvas();
const config = getConfig();

export class GameMenu {
    constructor(params) {
        this.startMethod = params.startMethod;
        this.state = MAIN_MENU;
        this.element = document.createElement('div');
        this.element.id = 'ui_container';
        this.children = [];
        this.render();
    }

    destroy() {
        this.element.remove();
        this.element = document.createElement('div');
        this.element.id = 'ui_container';
    }

    render() {
        this.destroy();
        if (this.state === MAIN_MENU) {
            this.generateMainMenu();
        } else if (this.state === SETTINGS) {
            this.generateSettingsMenu();
        }
        canvas.parentElement.append(this.element);
    }

    generateMainMenu() {
            // Creates three main buttons: Start Game, Settings and High Score.
            const startGameButton = document.createElement('button');
            startGameButton.innerText = translation("Start Game");
            startGameButton.addEventListener('click', () => {
                this.destroy();
                this.startMethod();
            });
            const settingsButton = document.createElement('button');
            settingsButton.innerText = translation("Settings");
            settingsButton.addEventListener('click', () => {
                this.state = SETTINGS;
                this.render();
            });
            const highScoreButton = document.createElement('button');
            highScoreButton.innerText = translation("Records");
            highScoreButton.addEventListener('click', () => {
                debugMessage('-- Not implemented yet.');
            });
            this.element.appendChild(startGameButton);
            this.element.appendChild(settingsButton);
            this.element.appendChild(highScoreButton);
    }

    generateSettingsMenu() {
        const inputManager = getInputManager();

        // Generates the setting's buttons.
        // Lang's buttons.
        const langSection = document.createElement('section');
        const LangTitleElement = document.createElement('h3');
        LangTitleElement.innerText = translation("Lang");

        const langFRButton = document.createElement('button');
        langFRButton.innerText = "Français";
        langFRButton.addEventListener('click', () => {
            config.lang = 'fr';
            localStorage.setItem('favorite_lang', config.lang);
            this.render();
        });
        const langENButton = document.createElement('button');
        langENButton.innerText = "English";
        langENButton.addEventListener('click', () => {
            config.lang = 'en';
            localStorage.setItem('favorite_lang', config.lang);
            this.render();
        });
        const backButton = document.createElement('button');
        backButton.innerText = "<";
        backButton.addEventListener('click', () => {
            this.state = MAIN_MENU;
            this.render();
        });
        // Disables the button for the current lang.
        if (config.lang === 'en') {
            langENButton.disabled = true;
        } else if (config.lang === 'fr') {
            langFRButton.disabled = true;
        }
        // Appends them to the DOM.
        langSection.appendChild(LangTitleElement);
        langSection.appendChild(langFRButton);
        langSection.appendChild(langENButton);

        // Key binding's buttons.
        const keyInputSection = document.createElement('section');
        const keyInputTitleElement = document.createElement('h3');
        keyInputTitleElement.innerText = translation("Keys");
        const keyInputlistElement = document.createElement('ul');

        const keyElementTemplate = document.getElementById('key-input-template').content;
        for (const inputAction of Object.values(inputManager._actions)) {
            const dropKey = keyElementTemplate.cloneNode(true);
            dropKey.querySelector('.key-action-name').innerText = translation(inputAction.description);
            const keyButton = dropKey.querySelector('.selected-key');
            const inputKey = inputAction.keys[0];
            keyButton.innerText = translation(inputKey.key);
            keyButton.dataset.key = inputKey.key;
            keyButton.dataset.action = inputAction.name;
            // Adds the event waiting for the new input key.
            keyButton.addEventListener('click', (clickEvent) => {
                // Disabled all buttons so user cannot click on something else until they chose a key.
                keyInputSection.querySelectorAll('button').forEach(el => el.disabled = true);
                clickEvent.target.innerText = "...";
                // Waits the user press a new key for this action.
                const promiseWaitingNewKey = new Promise((resolve, reject) => {
                    addEventListener('keydown', (keyEvent) => {
                        keyEvent.preventDefault();
                        keyEvent.stopPropagation();
                        if (clickEvent.target.dataset.key === keyEvent.key) {
                            reject(); // Do nothing if the user push the key already used for this action.
                        }
                        resolve(keyEvent.key);
                    }, { once: true });
                });
                promiseWaitingNewKey.then((newKey) => { // Replaces the action's input by the pressed key.
                    const newInput = inputManager.replaceKeyForAction(inputAction, inputKey, newKey);
                    // Checks if the input was used by another button.
                    const otherButtonUsingThisKey = keyInputSection.querySelector(`button[data-key="${newInput.key}"]`);
                    if (otherButtonUsingThisKey) {
                        otherButtonUsingThisKey.innerText = translation(clickEvent.target.dataset.key);
                        otherButtonUsingThisKey.dataset.key = clickEvent.target.dataset.key;
                        // Saves the change into the localStorage so the user keeps their favorite keymapping.
                        localStorage.setItem(otherButtonUsingThisKey.dataset.action, clickEvent.target.dataset.key);
                    }
                    // Replaces the button's key.
                    clickEvent.target.dataset.key = newInput.key;
                    // Saves the change into the localStorage so the user keeps their favorite keymapping.
                    localStorage.setItem(inputAction.name, newInput.key);
                });
                promiseWaitingNewKey.finally(() => { // Unlock the button no matter what happened.
                    clickEvent.target.innerText = translation(clickEvent.target.dataset.key);
                    keyInputSection.querySelectorAll('button').forEach(el => el.disabled = false);
                });
            });
            keyInputlistElement.appendChild(dropKey);
        }
        keyInputSection.appendChild(keyInputTitleElement);
        keyInputSection.appendChild(keyInputlistElement);

        this.element.appendChild(langSection);
        this.element.appendChild(keyInputSection);
        this.element.appendChild(backButton);
    }
}
