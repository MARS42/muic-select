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
        this.$clearSelection = document.createElement('button');
        this.$clearSelection.innerText = 'Clear';
        this.$clearSelection.classList.add(MuicSelect.CLEAR_SELECTION_CLASS);
        this.$selectionContainer.appendChild(this.$clearSelection);
        this.appendChild(this.$optionsContainer);
        this.appendChild(this.$selectionContainer);
        // Observer to selections height
        const selectionSizeObserver = new ResizeObserver((entries) => {
            this.$optionsContainer.style.translate
                = `0 ${this.$selectionContainer.offsetHeight + 4}px`;
            this.$optionsContainer.style.width = this.$selectionContainer.offsetWidth + 'px';
        });
        selectionSizeObserver.observe(this.$selectionContainer);
        this.$optionsContainer.addEventListener('focusout', () => {
            console.log('out');
        });
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
        if (!option) {
            empty.classList.add('muic-empty-selection');
            empty.innerHTML = this.attrs.get(MuicSelect.PLACEHOLDER_ATTRIBUTE);
            return empty;
        }
        const $span = document.createElement('span');
        $span.innerText = option.label;
        const $button = document.createElement('button');
        $button.innerText = 'X';
        $button.addEventListener('click', (event) => {
            event.stopPropagation();
            this.selectOption(option, false);
        });
        empty.appendChild($span);
        empty.appendChild($button);
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
        //this.$optionsContainer.style.translate = `0 ${this.$selectionContainer.offsetHeight}px`;
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
        if (show) {
            if (MuicSelect.CURRENT_INSTANCE && MuicSelect.CURRENT_INSTANCE !== this) {
                MuicSelect.CURRENT_INSTANCE.toggleOptions(false);
            }
            this.$optionsContainer.setAttribute('open', '');
            this.$selectionContainer.setAttribute('active', '');
            this.$optionsContainer.focus();
            MuicSelect.CURRENT_INSTANCE = this;
        }
        else {
            this.$optionsContainer.removeAttribute('open');
            this.$selectionContainer.removeAttribute('active');
        }
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
    clearOptions() {
        this.options.forEach(option => {
            this.selectOption(option, false);
        });
    }
}
MuicSelect.SELECTOR = 'muic-select';
MuicSelect.PLACEHOLDER_ATTRIBUTE = 'placeholder';
MuicSelect.MULTIPLE_ATTRIBUTE = 'multiple';
MuicSelect.SELECTION_TEMPLATE = 'template.muic-selection';
MuicSelect.OPTION_TEMPLATE = 'template.muic-option';
MuicSelect.SELECTION_CLASS = 'muic-select-selection';
MuicSelect.SELECTION_ITEM_CLASS = 'muic-select-selection-item';
MuicSelect.CLEAR_SELECTION_CLASS = 'muic-select-clear-selection';
MuicSelect.OPTIONS_CONTAINER_CLASS = 'muic-select-options-container';
MuicSelect.OPTIONS_CONTAINER_ITEM_CLASS = 'muic-select-options-item';
customElements.define('muic-select', MuicSelect);
//# sourceMappingURL=muic-select.js.map