class SimpleDemo extends EzHTMLElement {

    EZ_HTML = ({title}) => /*html*/`
        <div>${title}</div>
        <ez-childs></ez-childs>
    `

    connectedCallback() {
        super.connectedCallback();
        // Methods called after component binding
    }
}
$ez.setComponent(SimpleDemo);
