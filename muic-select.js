class MuicSelect extends HTMLElement {
    static get observedAttributes() {
        return [this.PLACEHOLDER_ATTRIBUTE, this.MULTIPLE_ATTRIBUTE];
    }
    constructor() {
        super();
        this.showingOptions = false;
        this.attrs = new Map();
        this.options = [];
        this.attrs.set(MuicSelect.PLACEHOLDER_ATTRIBUTE, '');
        this.attrs.set(MuicSelect.MULTIPLE_ATTRIBUTE, false);
        this.$selectionTemplate = this.querySelector(MuicSelect.SELECTION_TEMPLATE);
        this.$optionTemplate = this.querySelector(MuicSelect.OPTION_TEMPLATE);
        this.$optionsContainer = document.createElement('div');
        this.$optionsContainer.classList.add(MuicSelect.OPTIONS_CONTAINER_CLASS);
        this.$selectionContainer = document.createElement('div');
        this.$selectionContainer.classList.add(MuicSelect.SELECTION_CLASS);
        this.$selectionContainer.addEventListener('click', (event) => {
            this.toggleOptions(!this.showingOptions);
        });
        this.appendChild(this.$optionsContainer);
        this.appendChild(this.$selectionContainer);
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (newValue === oldValue)
            return;
        this.attrs.set(name, newValue);
    }
    connectedCallback() {
        this.attrs.set(MuicSelect.PLACEHOLDER_ATTRIBUTE, this.getAttribute(MuicSelect.PLACEHOLDER_ATTRIBUTE));
        this.attrs.set(MuicSelect.MULTIPLE_ATTRIBUTE, this.hasAttribute(MuicSelect.MULTIPLE_ATTRIBUTE));
        const $options = this.querySelectorAll('option');
        $options.forEach($option => {
            this.options.push({
                value: $option.value,
                label: $option.innerText,
                selected: false,
            });
            this.removeChild($option);
        });
        this.render();
    }
    /**
     * Renders options list
     */
    renderOptionsContainer() {
        while (this.$optionsContainer.firstChild) {
            this.$optionsContainer.removeChild(this.$optionsContainer.firstChild);
        }
        this.options.forEach(option => {
            const $option = document.createElement('option');
            $option.classList.add(MuicSelect.OPTIONS_CONTAINER_ITEM_CLASS);
            $option.value = option.value;
            $option.innerText = option.label;
            this.$optionsContainer.appendChild($option);
            option.$element = $option;
            $option.addEventListener('click', (event) => this.selectOption(option, !option.selected));
        });
    }
    /**
     * Creates selection bar item given a option
     * @param option Option to create selection item
     * @returns Selection item, if the option is empty, returns placeholder
     */
    createSelectionItem(option) {
        const empty = document.createElement('div');
        empty.classList.add(MuicSelect.SELECTION_ITEM_CLASS);
        if (!option)
            empty.classList.add('muic-empty-selection');
        empty.innerHTML = !option ? this.attrs.get(MuicSelect.PLACEHOLDER_ATTRIBUTE) : option.label;
        return empty;
    }
    /**
     * Renders selection bar
     */
    renderSelectionsContainer() {
        let isEmpty = true;
        this.options.forEach(option => {
            var _a;
            const selected = option.selected;
            // Check if no selected and delete de selection option
            if (!selected) {
                (_a = option.$selectionElement) === null || _a === void 0 ? void 0 : _a.remove();
                option.$selectionElement = undefined;
                return;
            }
            isEmpty = false;
            // Return if the option already has selection option
            if (option.$selectionElement)
                return;
            // Render only selected options
            option.$selectionElement = this.createSelectionItem(option);
            this.$selectionContainer.appendChild(option.$selectionElement);
        });
        const $emptySelection = this.querySelector('.muic-empty-selection');
        // If selections are empty and placeholder not created
        if (isEmpty && !$emptySelection)
            this.$selectionContainer.appendChild(this.createSelectionItem());
        else if (!isEmpty)
            $emptySelection === null || $emptySelection === void 0 ? void 0 : $emptySelection.remove();
    }
    /**
     * Renders selection bar and options list
     */
    render() {
        this.renderSelectionsContainer();
        this.renderOptionsContainer();
    }
    /**
     * Toggle the options list
     * @param show True to show list
     */
    toggleOptions(show) {
        this.showingOptions = show;
        if (show)
            this.$optionsContainer.setAttribute('open', '');
        else
            this.$optionsContainer.removeAttribute('open');
    }
    /**
     * Selects an option and updates the selection bar
     * @param option Option to change selection property
     * @param select Value to set
     */
    selectOption(option, select) {
        const selectedOptions = this.selectedOptions();
        if (option.selected == false
            && this.attrs.get(MuicSelect.MULTIPLE_ATTRIBUTE) == false
            && selectedOptions.length > 0) {
            selectedOptions.forEach(selectedOption => this.selectOption(selectedOption, false));
        }
        option.selected = select;
        if (option.selected)
            option.$element.setAttribute('selected', '');
        else
            option.$element.removeAttribute('selected');
        this.renderSelectionsContainer();
    }
    /**
     * Gets selected options
     * @returns Selected options
     */
    selectedOptions() {
        return this.options.filter(o => o.selected);
    }
}
MuicSelect.SELECTOR = 'muic-select';
MuicSelect.PLACEHOLDER_ATTRIBUTE = 'placeholder';
MuicSelect.MULTIPLE_ATTRIBUTE = 'multiple';
MuicSelect.SELECTION_TEMPLATE = 'template.muic-select-selection';
MuicSelect.OPTION_TEMPLATE = 'template.muic-select-option';
MuicSelect.SELECTION_CLASS = 'muic-select-selection';
MuicSelect.SELECTION_ITEM_CLASS = 'muic-select-selection-item';
MuicSelect.OPTIONS_CONTAINER_CLASS = 'muic-select-options-container';
MuicSelect.OPTIONS_CONTAINER_ITEM_CLASS = 'muic-select-options-item';
customElements.define('muic-select', MuicSelect);
//# sourceMappingURL=muic-select.js.map