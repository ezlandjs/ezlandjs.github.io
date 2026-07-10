class DeferDemo extends EzHTMLElement {
    EZ_HTML = /*html*/`
    <section style="margin-top: 2rem;">
        <h2>Deferred loading of initially invisible components</h2>
        <p>Why initially load a component that the user may not even want to see? 😏</p>
        <p>The current component should load only when displayed on the screen.
        Try checking this using the Network tab when debugging.</p>
    </section>
    `
}
$ez.setComponent(DeferDemo);
