class AlpineDemo extends EzAlpineHTMLElement {

    ALPINE_COMPONENT_KEY = 'initAlpineDemoComponent';

    renderByArray(btnTitle, idx) {
        return /*html*/`
            <button @click="openIndex = (${idx + 1})">${btnTitle}</button>
            <div x-show="openIndex === ${idx + 1}">
                <ez-child-${idx}></ez-child-${idx}>
            </div>
        `
    }

    EZ_HTML = ($) => /*html*/`
        ${['Open first', 'Open second', 'Open third'].map(this.renderByArray).join('')}
    `

    initAlpineDemoComponent($) {
        return {
            openIndex: 0
        }
    }

    connectedCallback() {
        super.connectedCallback();
        // Methods called after component binding
    }
}
$ez.setComponent(AlpineDemo);
