class AlpineDemo extends EzAlpineHTMLElement {

    ALPINE_COMPONENT_KEY = 'initAlpineDemoComponent';

    BUTTONS = ['First', 'Second', 'Defered loading'];

    renderButtonByArray(btnTitle, idx) {
        let num = idx + 1;
        return /*html*/`
            <button @click="showByIndex(${num})"
                x-text="(openIndex === ${num} ? 'Hide' : 'Show') + ' ${btnTitle}'"
            ></button>
        `
    }

    renderDropdownByArray(btnTitle, idx) {
        return /*html*/`
            <div x-show="openIndex === ${idx + 1}">
                <ez-child-${idx}></ez-child-${idx}>
            </div>
        `
    }

    EZ_HTML = ($) => /*html*/`
        <div>
            ${this.BUTTONS.map(this.renderButtonByArray).join('')}
        </div>
        ${this.BUTTONS.map(this.renderDropdownByArray).join('')}
    `

    initAlpineDemoComponent($) {
        return {
            openIndex: 0,
            showByIndex(idx) {
                this.openIndex = this.openIndex === idx ? 0 : idx;
            }
        }
    }

    connectedCallback() {
        super.connectedCallback();
        // Methods called after component binding
    }
}
$ez.setComponent(AlpineDemo);
