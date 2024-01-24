class MuicSelect extends HTMLElement {
    static get observedAttributes() {
        return [this.PLACEHOLDER_ATTRIBUTE, this.MULTIPLE_ATTRIBUTE];
    }
    constructor() {
        var _a;
        super();
        this.showingOptions = false;
        this.attrs = new Map();
        this.options = [];
        this.attrs.set(MuicSelect.PLACEHOLDER_ATTRIBUTE, '');
        this.attrs.set(MuicSelect.MULTIPLE_ATTRIBUTE, false);
        this.attrs.set(MuicSelect.SEARCH_ATTRIBUTE, false);
        this.$select = document.createElement('select');
        this.$select.multiple = true;
        this.$select.hidden = true;
        if (this.hasAttribute('id'))
            this.$select.id = this.getAttribute('id');
        if (this.hasAttribute('name'))
            this.$select.name = this.getAttribute('name');
        (_a = this.parentElement) === null || _a === void 0 ? void 0 : _a.insertBefore(this.$select, this);
        this.$selectionTemplate = this.querySelector(MuicSelect.SELECTION_TEMPLATE);
        this.$optionTemplate = this.querySelector(MuicSelect.OPTION_TEMPLATE);
        this.$optionsContainer = document.createElement('div');
        this.$optionsSearch = document.createElement('div');
        this.$optionsSearchInput = document.createElement('input');
        this.$optionsSearchInput.placeholder = 'Search...';
        this.$optionsSearch.appendChild(this.$optionsSearchInput);
        this.$optionsList = document.createElement('div');
        this.$optionsActions = document.createElement('div');
        const $btnClose = document.createElement('button');
        this.$btnSelectAll = document.createElement('button');
        this.$btnDeselectAll = document.createElement('button');
        $btnClose.type = 'button';
        this.$btnSelectAll.type = 'button';
        this.$btnDeselectAll.type = 'button';
        $btnClose.innerText = 'Close';
        this.$btnSelectAll.innerText = 'Select all';
        this.$btnDeselectAll.innerText = 'Deselect all';
        this.$optionsActions.appendChild(this.$btnSelectAll);
        this.$optionsActions.appendChild(this.$btnDeselectAll);
        this.$optionsActions.appendChild($btnClose);
        this.$optionsSearch.classList.add(MuicSelect.OPTIONS_SEARCH_CLASS);
        this.$optionsList.classList.add(MuicSelect.OPTIONS_LIST_CLASS);
        this.$optionsActions.classList.add(MuicSelect.OPTIONS_ACTIONS_CLASS);
        this.$optionsContainer.appendChild(this.$optionsSearch);
        this.$optionsContainer.appendChild(this.$optionsList);
        this.$optionsContainer.appendChild(this.$optionsActions);
        this.$optionsContainer.classList.add(MuicSelect.OPTIONS_CONTAINER_CLASS);
        this.$selectionContainer = document.createElement('div');
        this.$selectionContainer.classList.add(MuicSelect.SELECTION_CLASS);
        this.$selectionContainer.addEventListener('click', (event) => {
            event.stopPropagation();
            this.toggleOptions(!this.showingOptions);
        });
        this.$clearSelection = document.createElement('button');
        this.$clearSelection.type = 'button';
        this.$clearSelection.innerText = 'Clear';
        this.$clearSelection.classList.add(MuicSelect.CLEAR_SELECTION_CLASS);
        this.$selectionContainer.appendChild(this.$clearSelection);
        this.appendChild(this.$optionsContainer);
        this.appendChild(this.$selectionContainer);
        // Observer to selections height
        const selectionSizeObserver = new ResizeObserver((entries) => {
            /*this.$optionsContainer.style.translate
                = `0 ${this.$selectionContainer.offsetHeight + 4}px`;*/
            this.$optionsContainer.style.width = (this.$selectionContainer.offsetWidth - 8) + 'px';
        });
        selectionSizeObserver.observe(this.$selectionContainer);
        // Events
        this.$clearSelection.addEventListener('click', (event) => {
            event.stopPropagation();
            this.deselectAllOptions();
        });
        $btnClose.addEventListener('click', () => this.toggleOptions(false));
        this.$btnSelectAll.addEventListener('click', () => this.selectAllOptions());
        this.$btnDeselectAll.addEventListener('click', () => this.deselectAllOptions());
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (newValue === oldValue)
            return;
        this.attrs.set(name, newValue);
    }
    connectedCallback() {
        var _a, _b;
        this.attrs.set(MuicSelect.MULTIPLE_ATTRIBUTE, (_a = this.hasAttribute(MuicSelect.MULTIPLE_ATTRIBUTE)) !== null && _a !== void 0 ? _a : false);
        this.attrs.set(MuicSelect.PLACEHOLDER_ATTRIBUTE, (_b = this.getAttribute(MuicSelect.PLACEHOLDER_ATTRIBUTE)) !== null && _b !== void 0 ? _b : (this.attrs.get(MuicSelect.MULTIPLE_ATTRIBUTE) ? 'Select one or more' : 'Select one'));
        this.attrs.set(MuicSelect.SEARCH_ATTRIBUTE, this.hasAttribute(MuicSelect.SEARCH_ATTRIBUTE));
        const $options = this.querySelectorAll('option');
        $options.forEach($option => {
            this.options.push({
                value: $option.value,
                label: $option.innerText,
                selected: false,
            });
            this.removeChild($option);
        });
        if (this.attrs.get(MuicSelect.MULTIPLE_ATTRIBUTE) == false) {
            this.$btnSelectAll.setAttribute('hidden', '');
            this.$btnDeselectAll.setAttribute('hidden', '');
        }
        if (this.attrs.get(MuicSelect.SEARCH_ATTRIBUTE) == false) {
            this.$optionsSearch.style.display = 'none';
        }
        this.render();
    }
    /**
     * Renders options list
     */
    renderOptionsContainer() {
        while (this.$optionsList.firstChild) {
            this.$optionsList.removeChild(this.$optionsList.firstChild);
        }
        this.options.forEach(option => {
            const $option = document.createElement('option');
            $option.classList.add(MuicSelect.OPTIONS_CONTAINER_ITEM_CLASS);
            $option.value = option.value;
            $option.innerText = option.label;
            this.$optionsList.appendChild($option);
            option.$element = $option;
            $option.addEventListener('click', (event) => {
                this.selectOption(option, !option.selected);
                if (option.selected
                    && this.attrs.get(MuicSelect.MULTIPLE_ATTRIBUTE) == false) {
                    this.toggleOptions(false);
                }
            });
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
        let selectedOptionsStr = '';
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
            selectedOptionsStr += `<option value=${option.value} selected></option>`;
            // Return if the option already has selection option
            if (option.$selectionElement)
                return;
            // Render only selected options
            option.$selectionElement = this.createSelectionItem(option);
            this.$selectionContainer.appendChild(option.$selectionElement);
        });
        // Update select native element to update form data
        this.$select.innerHTML = selectedOptionsStr;
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
            this.$optionsSearchInput.focus();
            document.addEventListener('click', this.backdropClick);
            MuicSelect.CURRENT_INSTANCE = this;
        }
        else {
            this.$optionsContainer.removeAttribute('open');
            this.$selectionContainer.removeAttribute('active');
            document.removeEventListener('click', this.backdropClick);
        }
    }
    backdropClick(event) {
        var _a, _b;
        const elementUnderMouse = (_a = document.elementFromPoint(event.clientX, event.clientY)) === null || _a === void 0 ? void 0 : _a.closest(MuicSelect.SELECTOR);
        if (elementUnderMouse)
            return;
        (_b = MuicSelect.CURRENT_INSTANCE) === null || _b === void 0 ? void 0 : _b.toggleOptions(false);
    }
    /**
     * Selects an option and updates the selection bar
     * @param option Option to change selection property
     * @param select Value to set
     * @param [render=true] If is false, {@link renderSelectionsContainer} must be called manually
     */
    selectOption(option, select, render = true) {
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
        if (!render)
            return;
        this.renderSelectionsContainer();
    }
    selectAllOptions() {
        this.options.forEach(option => this.selectOption(option, true, false));
        this.renderSelectionsContainer();
    }
    deselectAllOptions() {
        this.options.forEach(option => this.selectOption(option, false, false));
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
            this.selectOption(option, false, false);
        });
        this.renderSelectionsContainer();
    }
}
MuicSelect.SELECTOR = 'muic-select';
MuicSelect.PLACEHOLDER_ATTRIBUTE = 'placeholder';
MuicSelect.MULTIPLE_ATTRIBUTE = 'multiple';
MuicSelect.SEARCH_ATTRIBUTE = 'search';
MuicSelect.SELECTION_TEMPLATE = 'template.muic-selection';
MuicSelect.OPTION_TEMPLATE = 'template.muic-option';
MuicSelect.SELECTION_CLASS = 'muic-select-selection';
MuicSelect.SELECTION_ITEM_CLASS = 'muic-select-selection-item';
MuicSelect.CLEAR_SELECTION_CLASS = 'muic-select-clear-selection';
MuicSelect.OPTIONS_CONTAINER_CLASS = 'muic-select-options-container';
MuicSelect.OPTIONS_CONTAINER_ITEM_CLASS = 'muic-select-options-item';
MuicSelect.OPTIONS_SEARCH_CLASS = 'muic-select-options-search';
MuicSelect.OPTIONS_LIST_CLASS = 'muic-select-options-list';
MuicSelect.OPTIONS_ACTIONS_CLASS = 'muic-select-options-actions';
customElements.define('muic-select', MuicSelect);
//# sourceMappingURL=muic-select.js.map