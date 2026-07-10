/** EzLand.js | v 1.0.1 - simple small lib for page-render by JS components 
 * Creator: Hrynchyk Dzmitryi
*/
class EzHTMLElement extends HTMLElement {
    LEGACY_HTML = null;
    EZ_HTML = '';
    ELEMENT_ATTRIBUTES = [];
    _bindHtml() {
        this.LEGACY_HTML = this.innerHTML ? Array.from(this.children) : [];
        if (!this.EZ_HTML) return;
        this.innerHTML = typeof this.EZ_HTML === 'function' 
            ? this.EZ_HTML(this.$)
            : this.EZ_HTML;
        const container = this.LEGACY_HTML.length ? this.querySelector('ez-childs') : null;
        if (!container) {
            this.LEGACY_HTML.forEach((child, idx) => {
                const checkIdxContainer = this.querySelector('ez-child-' + idx);
                if (!checkIdxContainer) return;
                checkIdxContainer.replaceWith(child);
            });
            return;
        };
        container.replaceWith(...this.LEGACY_HTML);
    }
    connectedCallback() {
        if (this.getAttribute('loading')) return;
        this._bindHtml();
        this.setAttribute('ez-binded', 1);
        this.ELEMENT_ATTRIBUTES.forEach(attrConf => {
            for (let keyCode in attrConf) {
                 this.setAttribute(keyCode, attrConf[keyCode]);
            }
        });
    }
}
class EzAlpineHTMLElement extends EzHTMLElement {
    ALPINE_COMPONENT_KEY = null; 
    DEPS = [];
    DEPS_WAIT_NUM = 0;
    DEPS_LOADED = 0;
    bindAlpineComponent() {
        if (this.DEPS_WAIT_NUM !== this.DEPS_LOADED) return;
        if (this.ALPINE_COMPONENT_KEY) {
            $ez.$bind(this.ALPINE_COMPONENT_KEY, this[this.ALPINE_COMPONENT_KEY].bind(this, this.$attr)); 
            this.setAttribute('x-data', '$ez.' + this.ALPINE_COMPONENT_KEY);
        }
    }
    connectedCallback() {
        super.connectedCallback();
        if (this.getAttribute('loading')) return;
        let waitForResources = false;
        window.fetchedEzDepsScripts = window.fetchedEzDepsScripts
            ? window.fetchedEzDepsScripts : {};
        this.DEPS.forEach(attrConf => {
            for (let keyCode in attrConf) {
                let element = null;
                let srcPath = attrConf[keyCode];
                let srcId = 'ez-dep-' + btoa(srcPath).replace(/[^a-z0-9]/ig, '');
                if (window.fetchedEzDepsScripts[srcId]) return;
                if (keyCode === 'text/css') {
                    element = document.createElement('link');
                    element.href = srcPath;
                    element.rel = 'stylesheet';
                    element.type = keyCode;
                }
                if (keyCode === 'script') {
                    waitForResources = true;
                    this.DEPS_WAIT_NUM = this.DEPS_WAIT_NUM + 1;
                    element = document.createElement('script');
                    element.src = srcPath;
                    element.onload = () => {
                        window.fetchedEzDepsScripts[srcId] = true;
                        this.DEPS_LOADED++;
                        this.bindAlpineComponent();
                    };
                }
                if (!element) return;
                element.id = srcId;
                document.body.appendChild(element);
            }
        });
        if (waitForResources) return;
        this.bindAlpineComponent();
    }
}
$ez = (function() {
    return {
        domObserver: null,
        config: {
            waitForEveryone: false
        },
        registeredTags: '',
        registeredTagsStrict: {},
        tagRegex: null,
        imports: {},
        lazyImports: {},
        deferImports: [],
        deferConfigs: {},
        linksLoaded: 0,
        renderedComponentsNumber: 0,
        fetchedScripts: {},
        $afterMethods: [],
        $interactMethods: [],

        startPending: (() => {
            window.addEventListener('load', () => {
                $ez.initEz();
            });
        })(),
        setComponent: function(comp){
            this.links = { ...this.links, [comp.name]: comp};
            this.linksLoaded++;
            if (!this.config.waitForEveryone) return;
            if (this.linksLoaded === Object.keys(this.fetchedScripts).length) {
                this.renderAllVisibleAtOnce();
                this.afterRender();
                this.config.waitForEveryone = false;
            }
        },
        getClassObjectNameByFileName: function(el) {
            let strName = el.file.split('/');
            return strName[strName.length-1];
        },
        renderAllVisibleAtOnce: function() {
            for (elTag in this.fetchedScripts) {
                const el = this.imports[elTag];
                this.renderComponent(el);
                delete this.fetchedScripts[elTag];
            }
        },
        importSeparate: function(elConfig) {
            elConfig.define = elConfig.define.toLowerCase();
            this.imports[elConfig.define] = elConfig;
        },
        import: function(elConfig) {
            if (Array.isArray(elConfig)) {
                elConfig.forEach(this.importSeparate.bind(this));
                return;
            }
            this.importSeparate(elConfig);
        },
        extendClass: function(classObject) {
            classObject.prototype.$attr = (context, attributeCode) => {
                return context.getAttribute(attributeCode) ?? '';
            }
            Object.defineProperty(classObject.prototype, '$', {
                get: function() {
                    let attrs = {};
                    for (let i = 0; i < this.attributes.length; i++) {
                        const attr = this.attributes[i];
                        attrs[attr.name] = attr.value;
                    }
                    return attrs;
                },
                configurable: true
            });
            return classObject;
        },
        handleIntersectionObserving: function(element, callbackBetween) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;
                    callbackBetween(entry);
                    observer.unobserve(entry.target);
                });
            }, { root: null, rootMargin: '100px', threshold: 0.1});
            observer.observe(element);
        },
        registerLazyload: function(element) {
            this.handleIntersectionObserving(element, (entry) => {
                const tagName = entry.target.tagName.toLowerCase();
                this.handleScriptFetch(this.imports[tagName]);
                entry.target.removeAttribute('loading');
                if (entry.target.connectedCallback) {
                    entry.target.connectedCallback();
                }
            });
        },
        registerDefer: function(element, el) {
            this.deferImports.push(element);
            if (this.deferConfigs[el.define]) return;
            this.deferConfigs[el.define] = el;
        },
        bindComponentClass: function(el, elClassName) {
            const extendedClass = this.extendClass($ez.links[elClassName]);
            customElements.define(el.define, extendedClass);
            this.removeRegisterTag(el.define);
        },
        renderComponent: function(el) {
            let componentConfig = this.imports[el.define];
            if (!componentConfig) {
                return;
            }
            this.bindComponentClass(el, this.getClassObjectNameByFileName(componentConfig));
            this.renderedComponentsNumber++;
            this.handlePostRender();
        },
        handleScriptFetch: function(el) {
            if (!el || this.fetchedScripts[el.define]) return;
            this.fetchedScripts[el.define] = true;
            let newScript = document.createElement('script');
            newScript.setAttribute('type', 'text/javascript');
            newScript.src = el.file+'.js';
            document.head.appendChild(newScript);
            if (this.config.waitForEveryone) return;
            newScript.onload = () => {
                this.renderComponent(el);
            }
        },
        initSingleComponent: function(element, isAfterDefer) {
            const tagName = element.tagName.toLowerCase();
            let el = this.imports[tagName];
            if (!el && !isAfterDefer) return;
            el = el || this.deferConfigs[tagName];
            el.loading = element.getAttribute('loading');
            if (el.loading === 'lazy') {
                this.registerLazyload(element);
                return;
            }
            if (el.loading === 'defer') {
                this.registerDefer(element, el);
                return;
            }
            this.handleScriptFetch(el);
        },
        initEz: function(node = document) {
            for (elTag in this.imports) this.addRegisterTag(elTag);
            if (this.registeredTags) {
                node.querySelectorAll(this.registeredTags).forEach(element => this.initSingleComponent(element));
            }
        },
        handleDOMObserver: function() {
            if (this.domObserver) return;
            this.domObserver = new MutationObserver((mutationsList) => {
                const elementsForNodeMutation = [];
                for (let mutation of mutationsList) {
                    if (mutation.type !== 'childList' || !mutation.addedNodes.length) continue;
                    for (let node of mutation.addedNodes) {
                        if (!node.tagName) continue;
                        let tagName = node.tagName.toLowerCase();
                        if (this.imports[tagName]) {
                            elementsForNodeMutation.push(node);
                            continue;
                        };
                        for (let newNode of node.childNodes) {
                            if (!newNode.tagName) continue;
                            let subTagName = newNode.tagName.toLowerCase();
                            if (!this.imports[subTagName]) continue;
                            elementsForNodeMutation.push(newNode);
                        }
                    }
                }
                elementsForNodeMutation.forEach(element => {
                    this.handleNodeMutation(element, element.tagName.toLowerCase());
                });
            });
            this.domObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
        },
        handleNodeMutation: function(node, tagName) {
            if (!this.imports[tagName]) return;
            this.initSingleComponent(node);
        },
        addRegisterTag(strElTag) {
            if (this.registeredTagsStrict[strElTag]) return;
            this.registeredTags += this.registeredTags ? ', ' + strElTag : strElTag;
            this.registeredTagsStrict[strElTag] = true;
            this.createRegexOfRegisteredTags();
        },
        removeRegisterTag(strElTag) {
            const regex = new RegExp(`, ?${strElTag}|${strElTag}, ?`, 'g');
            this.registeredTags = this.registeredTags.replace(regex, '');
            if (this.imports[strElTag]) delete this.imports[strElTag];
            if (this.registeredTagsStrict[strElTag]) delete this.registeredTagsStrict[strElTag];
            this.createRegexOfRegisteredTags();
        },
        createRegexOfRegisteredTags: function() {
            const cleanTags = this.registeredTags.split(',').map(str => str.trim()).join('|');
            this.tagRegex = new RegExp(cleanTags);
        },
        setConfig: function(config){
            let self = this;
            self.config = { ...self.config, ...config };
        },
        handlePostRender: function() {
            if (this.renderedComponentsNumber !== Object.keys(this.fetchedScripts).length) return;
            this.afterRender();
        },
        afterRender: function() {
            this.deferImports = this.deferImports.filter(element => {
                element.setAttribute('loading', 'lazy');
                this.initSingleComponent(element, true);
                return false;
            });
            this.$afterMethods = this.$afterMethods.filter(callback => {
                callback(); return false;
            });
            if (!this.domObserver) {
                this.handleDOMObserver();
            };
            this.handleInteraction();
        },
        handleInteraction: function (){
            const eventsArray = ['wheel', 'touchstart', 'scroll', 'keydown', 'mouseover'];
            function removeInteractionEvents() {
                eventsArray.forEach((eventType) => {
                    window.removeEventListener(eventType, handleInteractionBehavior);
                });
            }
            const handleInteractionBehavior = () => {
                removeInteractionEvents();
                this.$interactMethods.forEach(callback => callback());
            }
            eventsArray.forEach((eventType) => {
                window.addEventListener(eventType, handleInteractionBehavior)
            });
        },
        $bind: function(componentName, component){
            if (this[componentName] || !component) {
                return;
            }
            this[componentName] = component;
        },
        $after: function(callback){
            if (typeof callback !== 'function') {
                return;
            }
            this.$afterMethods.push(callback);
        },
        $interact: function(callback){
            if (typeof callback !== 'function') {
                return;
            }
            this.$interactMethods.push(callback);
        }
    }
})();