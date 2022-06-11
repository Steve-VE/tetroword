class HtmlUI {
    constructor() {
        this.element = document.createElement('div');
        this.element.id = 'ui_container';
        this.buttons = [
            new HtmlButton(this, "Start Game", 'start'),
            new HtmlButton(this, "Records", 'records'),
            new HtmlButton(this, "Options", 'options'),
        ];
        this.buttons[1].element.disabled = true;
        this.buttons[2].element.disabled = true;
        canvas.parentElement.append(this.element);
    }

    attach(htmlElement) {
        htmlElement.parent = this.parent;
        this.element.append(htmlElement.element);
    }

    close() {
        this.element.style.display = 'none';
    }
}

class HtmlElement {
    constructor(parent) {
        this.parent = parent;
        this.element = document.createElement('div');
        this.setup(...arguments);
        this.bindEvent();
    }

    setup(args) {}

    bindEvent() {
        this.element.addEventListener('click', this.onClick.bind(this));
    }

    onClick(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        debugMessage(`-- Clicked on "${this.text}" button.`);
    }
}

class HtmlButton extends HtmlElement {
    setup(parent, text, func) {
        this.element = document.createElement('button');
        this.text = text;
        this.function = func;
        this.element.innerText = this.text;
        this.parent.element.append(this.element);
    }

    onClick(ev) {
        super.onClick(...arguments);
        if (this.function === 'start') {
            this.parent.close();
            gameContainer.gameStart();
        }
    }
}

class HtmlTextBox extends HtmlElement {
    setup() {
        this.element.classList.add('text-box');
    }
}