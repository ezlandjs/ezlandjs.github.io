class DeferDemo extends EzHTMLElement {
    EZ_HTML = /*html*/`
    <section style="margin-top: 2rem;">
        <h2>DeferDemo.js</h2>
        <span>
            The current component should load only when displayed on the screen.
            Verify this via debugging in the Network tab.
        </span>
    </section>
    `
}
$ez.setComponent(DeferDemo);
