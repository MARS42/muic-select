var MuicSelectAttribute;
(function (MuicSelectAttribute) {
    MuicSelectAttribute["MULTIPLE"] = "multiple";
    MuicSelectAttribute["PLACEHOLDER"] = "placeholder";
    MuicSelectAttribute["SEARCH"] = "search";
})(MuicSelectAttribute || (MuicSelectAttribute = {}));
class MuicSelect extends HTMLElement {
    filterCriteriaDefault(query, option) {
        return option.label.toLowerCase().includes(query.toLowerCase());
    }
    static get observedAttributes() {
        return [MuicSelectAttribute.PLACEHOLDER, MuicSelectAttribute.MULTIPLE, MuicSelectAttribute.SEARCH];
    }
    constructor(config) {
        super();
        this.showingOptions = false;
        this.options = [];
        this.filteredOptions = [];
        this.config = config !== null && config !== void 0 ? config : {
            multiple: false,
            placeholder: 'Select one',
            search: false,
        };
        this.$select = document.createElement('select');
        this.$select.multiple = true;
        this.$select.addEventListener('invalid', (event) => {
            this.dispatchEvent(new Event('invalid', event));
        });
        if (this.hasAttribute('name'))
            this.$select.name = this.getAttribute('name');
        if (this.hasAttribute('required'))
            this.$select.required = true;
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
        this.$emptyOptions = document.createElement('span');
        this.$emptyOptions.innerText = 'No options';
        this.$emptyOptions.classList.add(MuicSelect.EMPTY_OPTIONS_CONTAINER_ITEM_CLASS);
        this.appendChild(this.$optionsContainer);
        this.appendChild(this.$selectionContainer);
        this.appendChild(this.$select);
        this.selectionSizeObserver = new ResizeObserver((entries) => {
            this.$optionsContainer.style.width = (this.$selectionContainer.offsetWidth - 8) + 'px';
        });
        this.selectionSizeObserver.observe(this.$selectionContainer);
        // Event to clear selection
        this.$clearSelection.addEventListener('click', (event) => {
            event.stopPropagation();
            this.deselectAllOptions();
        });
        // Events to close, select all and deselect all
        $btnClose.addEventListener('click', () => this.toggleOptions(false));
        this.$emptyOptions.addEventListener('click', () => this.toggleOptions(false));
        this.$btnSelectAll.addEventListener('click', () => this.selectAllOptions());
        this.$btnDeselectAll.addEventListener('click', () => this.deselectAllOptions());
        // Set default filter criteria and debounce
        this.filterCriteria = this.filterCriteriaDefault;
        const debounce = (fn, d = 300) => {
            let timer;
            return () => {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    fn();
                }, d);
            };
        };
        // Debounce search input
        const debounced = debounce(() => this.filterOptions());
        this.$optionsSearchInput.addEventListener('keyup', debounced);
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (newValue === oldValue)
            return;
        switch (name) {
            case MuicSelectAttribute.MULTIPLE:
                this.config.multiple = this.hasAttribute(MuicSelectAttribute.MULTIPLE);
                this.updateAttributes();
                console.log('multiple changed', this.hasAttribute(MuicSelectAttribute.MULTIPLE));
                break;
            case MuicSelectAttribute.PLACEHOLDER:
                this.config.placeholder = newValue;
                console.log('placeholder changed');
                break;
            case MuicSelectAttribute.SEARCH:
                this.config.search = this.hasAttribute(MuicSelectAttribute.SEARCH);
                this.updateAttributes();
                console.log('search changed', this.hasAttribute(MuicSelectAttribute.SEARCH));
                break;
        }
    }
    updateAttributes() {
        if (!this.config.multiple) {
            this.$btnSelectAll.setAttribute('hidden', '');
            this.$btnDeselectAll.setAttribute('hidden', '');
        }
        else {
            this.$btnSelectAll.removeAttribute('hidden');
            this.$btnDeselectAll.removeAttribute('hidden');
        }
        this.$optionsSearch.style.display = !this.config.search ? 'none' : 'flex';
    }
    connectedCallback() {
        const $options = this.querySelectorAll('option');
        // Initialize native options
        $options.forEach($option => {
            const option = {
                value: $option.value,
                label: $option.innerText,
                $element: $option,
                selected: false,
            };
            this.options.push(option);
            // Add click event to option
            $option.addEventListener('click', (event) => {
                this.selectOption(option, !option.selected);
                this.triggerEvent('change');
                if (option.selected
                    && !this.config.multiple) {
                    this.toggleOptions(false);
                }
            });
            $option.classList.add(MuicSelect.OPTIONS_CONTAINER_ITEM_CLASS);
            // Move to options list
            this.$optionsList.appendChild($option);
        });
        this.updateAttributes();
        this.clearSearch();
        this.render();
    }
    disconnectedCallback() {
    }
    filterOptions() {
        const query = this.$optionsSearchInput.value;
        this.filteredOptions = this.options.filter(option => this.filterCriteria(query, option));
        const noOptions = this.filteredOptions.length === 0;
        this.options.forEach(option => {
            if (this.filterCriteria(query, option)) {
                if (!option.$element.parentElement)
                    this.$optionsList.appendChild(option.$element);
            }
            else {
                if (option.$element.parentElement)
                    this.$optionsList.removeChild(option.$element);
            }
        });
        if (noOptions && !this.$emptyOptions.parentElement)
            this.$optionsList.appendChild(this.$emptyOptions);
        else if (!noOptions && this.$emptyOptions.parentElement)
            this.$optionsList.removeChild(this.$emptyOptions);
    }
    /**
     * Renders options list
     */
    renderOptionsContainer(filtered) {
        // For each option, create a option element
        this.options.forEach(option => {
            // Return if the option already has item element in options list
            if (option.$element)
                return;
            const $option = document.createElement('option');
            $option.classList.add(MuicSelect.OPTIONS_CONTAINER_ITEM_CLASS);
            $option.value = option.value;
            $option.innerText = option.label;
            $option.addEventListener('click', (event) => {
                this.selectOption(option, !option.selected);
                this.triggerEvent('change');
                if (option.selected
                    && !this.config.multiple) {
                    this.toggleOptions(false);
                }
            });
            option.$element = $option;
            this.$optionsList.appendChild($option);
        });
        if (this.options.length === 0) {
            this.$optionsList.setAttribute('empty', '');
        }
        else {
            this.$optionsList.removeAttribute('empty');
        }
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
            empty.innerHTML = this.config.placeholder;
            return empty;
        }
        const $span = document.createElement('span');
        $span.innerText = option.label;
        const $button = document.createElement('button');
        $button.innerText = 'X';
        $button.addEventListener('click', (event) => {
            event.stopPropagation();
            this.selectOption(option, false);
            this.triggerEvent('change');
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
            this.triggerEvent('open');
        }
        else {
            this.$optionsContainer.removeAttribute('open');
            this.$selectionContainer.removeAttribute('active');
            this.clearSearch();
            document.removeEventListener('click', this.backdropClick);
            this.triggerEvent('close');
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
     * @param notify If is true dispatches a change event
     */
    selectOption(option, select, render = true) {
        const selectedOptions = this.selectedOptions();
        if (option.selected == false
            && !this.config.multiple
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
        this.filteredOptions.forEach(option => this.selectOption(option, true, false));
        this.renderSelectionsContainer();
        this.triggerEvent('change');
    }
    deselectAllOptions() {
        this.filteredOptions.forEach(option => this.selectOption(option, false, false));
        this.renderSelectionsContainer();
        this.triggerEvent('change');
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
        this.triggerEvent('change');
    }
    clearSearch() {
        this.$optionsSearchInput.value = '';
        this.$optionsSearchInput.dispatchEvent(new Event('keyup'));
    }
    triggerEvent(name) {
        if (name == 'change') {
            const event = new CustomEvent(name, { detail: { selected: this.selectedOptions() } });
            this.dispatchEvent(event);
            return;
        }
        const event = new Event(name);
        this.dispatchEvent(event);
    }
}
MuicSelect.SELECTOR = 'muic-select';
MuicSelect.SELECTION_TEMPLATE = 'template.muic-selection';
MuicSelect.OPTION_TEMPLATE = 'template.muic-option';
MuicSelect.SELECTION_CLASS = 'muic-select-selection';
MuicSelect.SELECTION_ITEM_CLASS = 'muic-select-selection-item';
MuicSelect.CLEAR_SELECTION_CLASS = 'muic-select-clear-selection';
MuicSelect.OPTIONS_CONTAINER_CLASS = 'muic-select-options-container';
MuicSelect.OPTIONS_CONTAINER_ITEM_CLASS = 'muic-select-options-item';
MuicSelect.EMPTY_OPTIONS_CONTAINER_ITEM_CLASS = 'muic-select-empty-options-item';
MuicSelect.OPTIONS_SEARCH_CLASS = 'muic-select-options-search';
MuicSelect.OPTIONS_LIST_CLASS = 'muic-select-options-list';
MuicSelect.OPTIONS_ACTIONS_CLASS = 'muic-select-options-actions';
customElements.define('muic-select', MuicSelect);
//# sourceMappingURL=muic-select.js.map