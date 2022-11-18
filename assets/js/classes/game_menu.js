import { getConfig } from "./config";
import { debugMessage } from "../functions/debug_functions";
import { getCanvas, translation } from "../functions/functions";

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
        const langSection = document.createElement('section');

        const titleElement = document.createElement('h3');
        titleElement.innerText = translation("Lang");

        // Generates the setting's buttons.
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

        langSection.appendChild(titleElement);
        langSection.appendChild(langFRButton);
        langSection.appendChild(langENButton);

        this.element.appendChild(langSection);
        this.element.appendChild(backButton);
    }
}
