class SimpleDemo extends EzHTMLElement {
    /**
     * <ez-childs></ez-childs> - it's default EzLand.js element
     * Use this tag to pass other elements into the current component.
    */
    EZ_HTML = ({subtitle}) => /*html*/`
        <ez-childs></ez-childs>
        <div>${subtitle}</div>
    `
}
$ez.setComponent(SimpleDemo);
