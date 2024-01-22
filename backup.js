class MuicSelectOption extends HTMLElement {

    static SELECTOR = 'muic-select-option';

    constructor(){
        super();
        this.label = '';
        this.icon = '';
    }

    connectedCallback() {
        const shadow = this.attachShadow({ mode: "open" });
        const style = document.createElement("style");
        style.textContent = ``;
        shadow.appendChild(style);
    }

    render(){
        this.innerHTML = `
            <option value="1">Option 1</option>
            <option value="2">Option 2</option>
        `;
        console.log('render');
    }
}

class MuicSelect extends HTMLElement {

    static SELECTOR = 'muic-select';

    static PLACEHOLDER_ATTRIBUTE = 'placeholder';
    static MULTIPLE_ATTRIBUTE = 'multiple';

    static SELECTION_TEMPLATE = 'template.muic-select-selection';
    static OPTION_TEMPLATE = 'template.muic-select-option';

    static STYLE = `
    muic-select-options-container{
    }
    
    muic-select-selection{
    
    }
    `;

    static get observedAttributes() {
        return [this.PLACEHOLDER_ATTRIBUTE, this.MULTIPLE_ATTRIBUTE];
    }

    constructor(){
        super();
        this.placeholder = '';
        this.multiple = false;
        this.options = [];

        this.shadow = this.attachShadow({ mode: "open" });
        this.sstyle = document.createElement("style");
        this.sstyle.textContent = MuicSelect.STYLE;
        this.shadow.appendChild(this.sstyle);

        this.$selectionTemplate = this.querySelector(MuicSelect.SELECTION_TEMPLATE);
        this.$optionTemplate = this.querySelector(MuicSelect.OPTION_TEMPLATE);

        this.$optionsContainer = document.createElement('div');
        this.$optionsContainer.classList.add('muic-select-options-container');

        this.$selection = document.createElement('div');
        this.$selection.classList.add('muic-select-selection');

        this.shadow.appendChild(this.$optionsContainer);
        this.shadow.appendChild(this.$selection);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        this[name] = newValue;
    }

    connectedCallback() {

        this.placeholder = this.getAttribute(MuicSelect.PLACEHOLDER_ATTRIBUTE);
        this.multiple = this.hasAttribute(MuicSelect.MULTIPLE_ATTRIBUTE);

        const $options = this.querySelectorAll('option');

        $options.forEach($option => {
            this.options.push({
                value: $option.value,
                label: $option.innerText,
                $element: $option
            });
        });

        this.render();
    }

    renderSelection(option = undefined){
        this.$selection.innerHTML = !option ? this.placeholder : option.label;
    }

    generateOptions(){
        const $optionsHolder = document.createElement('div');
        this.options.forEach(option => {
            const $option = document.createElement('option');
            $option.value = option.value;
            $option.innerText = option.label;
            this.$optionsContainer.appendChild($option);
        });
        return $optionsHolder;
    }

    render(){
        this.renderSelection();
    }

    onChange(e){
        console.log(e.target.value);
    }

    /**** API Methods ****/
    addOption(option){
        this.options.push(option);
    }
    removeOption(option){
        this.options = this.options.filter(o => o.value !== option.value);
    }
    clearOptions(){
        this.options = [];
    }
    getOptions(){
        return this.options;
    }
    setOptions(options){
        this.options = options;
    }
}

customElements.define(MuicSelectOption.SELECTOR, MuicSelectOption);
customElements.define(MuicSelect.SELECTOR, MuicSelect);