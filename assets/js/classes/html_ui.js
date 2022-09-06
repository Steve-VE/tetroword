class HtmlUI {
    constructor(arch) {
        this.element = document.createElement('div');
        this.element.id = 'ui_container';
        this.children = [];
        for (const subElementParams of arch) {
            const htmlButton =  new HtmlButton(this, subElementParams);
            this.children.push(htmlButton);
        }
        this.render();
    }

    attach(htmlElement) {
        htmlElement.parent = this.parent;
        this.element.append(htmlElement.element);
    }

    close() {
        for (const child of this.children) {
            child.close();
        }
    }

    display() {
        this.element.style.display = '';
    }

    render() {
        for (const child of this.children) {
            child.render();
        }
        canvas.parentElement.append(this.element);
    }
}

class HtmlElement {
    constructor(parent, params) {
        this.parent = parent;
        this.element = document.createElement('div');
        this.children = [];
        this.setup(params);
        this.bindEvent();
    }

    setup(args) {}

    bindEvent() {
        this.element.addEventListener('click', this.onClick.bind(this));
    }

    close() {
        this.unbindEvent();
        for (const child of this.children) {
            child.element.remove();
        }
        this.element.remove();
    }

    render(target) {
        target = target ||this.parent;
        target.element.append(this.element);
    }

    unbindEvent() {
        this.element.removeEventListener('click', this.onClick.bind(this));
    }

    onClick(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        debugMessage(`-- Clicked on "${this.text}" button.`);
    }

    get olderParent() {
        let olderParent = this.parent;
        while (olderParent.parent) {
            olderParent = olderParent.parent;
        }
        return olderParent;
    }

    get text() { return this._text; }
    set text(str) {
        this._text = str;
        if (this.element) {
            this.element.innerText = translation(this.text);
        }
    }
}

class HtmlButton extends HtmlElement {
    setup(params) {
        this.element = document.createElement('button');
        this.text = params.text;
        this.function = params.function;
        if (params.subElements) {
            for (const subElementParams of params.subElements) {
                const htmlButton =  new HtmlButton(this, subElementParams);
                this.children.push(htmlButton);
            }
            const goBackButton = new HtmlButton(this, {
                text: "<",
                function: () => {
                    this.close();
                    this.parent.render();
                },
            });
            this.children.push(goBackButton);
        }
    }

    onClick(ev) {
        super.onClick(...arguments);
        if (this.function) { // If the button has a method, call it when clicked.
            this.parent.close();
            this.function();
        } else if (this.children) { // If the button has no method but children, display children.
            this.parent.close();
            for (const child of this.children) {
                child.render(this.olderParent);
            }
        }
    }
}

class HtmlTextBox extends HtmlElement {
    setup() {
        this.element.classList.add('text-box');
    }
}