class AlpineDemo extends EzAlpineHTMLElement {

    ALPINE_COMPONENT_KEY = 'initAlpineDemoComponent';

    BUTTONS = ['First', 'Second', 'Defered loading ⌛'];

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
    <section>
        <h2>EzLand.js + Alpine.js Demo</h2>
        <div style="margin: 0.5rem 0 1rem;">
            While EzLand.js assembles your page from various components, 
            <a href="https://alpinejs.dev/" 
                title="Open Alpine.js official web-page" 
                target="_blank">Alpine.js</a> helps add reactivity 🚀
        </div>
        <div>
            ${this.BUTTONS.map(this.renderButtonByArray).join('')}
        </div>
        ${this.BUTTONS.map(this.renderDropdownByArray).join('')}
    </section>
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
