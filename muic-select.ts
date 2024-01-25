interface MuiSelectOption {
    value: string,
    label: string,
    // DOM Element in option list
    $element?: HTMLElement,
    // DOM Element in selection list
    $selectionElement?: HTMLElement,
    selected: boolean,
}

class MuicSelect extends HTMLElement {

    static CURRENT_INSTANCE?: MuicSelect;

    static SELECTOR: string = 'muic-select';

    static PLACEHOLDER_ATTRIBUTE: string = 'placeholder';
    static MULTIPLE_ATTRIBUTE: string = 'multiple';
    static SEARCH_ATTRIBUTE: string = 'search';

    static SELECTION_TEMPLATE: string = 'template.muic-selection';
    static OPTION_TEMPLATE: string = 'template.muic-option';

    static SELECTION_CLASS: string = 'muic-select-selection';
    static SELECTION_ITEM_CLASS: string = 'muic-select-selection-item';
    static CLEAR_SELECTION_CLASS: string = 'muic-select-clear-selection';

    static OPTIONS_CONTAINER_CLASS: string = 'muic-select-options-container';
    static OPTIONS_CONTAINER_ITEM_CLASS: string = 'muic-select-options-item';
    static OPTIONS_SEARCH_CLASS: string = 'muic-select-options-search';
    static OPTIONS_LIST_CLASS: string = 'muic-select-options-list';
    static OPTIONS_ACTIONS_CLASS: string = 'muic-select-options-actions';

    private $selectionTemplate: HTMLTemplateElement;
    private $optionTemplate: HTMLTemplateElement;

    private $select: HTMLSelectElement;

    private $optionsContainer: HTMLElement;
    private $optionsSearch: HTMLElement;
    private $optionsList: HTMLElement;
    private $optionsActions: HTMLElement;
    private $btnSelectAll: HTMLButtonElement;
    private $btnDeselectAll: HTMLButtonElement;

    private $selectionContainer: HTMLElement;
    private $clearSelection: HTMLButtonElement;
    private $optionsSearchInput: HTMLInputElement;

    private showingOptions: boolean = false;
    private attrs: Map<string, any> = new Map();
    private options: MuiSelectOption[] = [];

    private filterCriteria: (query: string, option: MuiSelectOption) => boolean;
    private filterCriteriaDefault(query: string, option: MuiSelectOption): boolean {
        return option.label.toLowerCase().includes(query.toLowerCase());
    }

    static get observedAttributes() {
        return [this.PLACEHOLDER_ATTRIBUTE, this.MULTIPLE_ATTRIBUTE];
    }

    constructor() {
        super();

        this.attrs.set(MuicSelect.PLACEHOLDER_ATTRIBUTE, '');
        this.attrs.set(MuicSelect.MULTIPLE_ATTRIBUTE, false);
        this.attrs.set(MuicSelect.SEARCH_ATTRIBUTE, false);

        this.$select = document.createElement('select');
        this.$select.multiple = true;
        //this.$select.style.opacity = '0';
        this.$select.addEventListener('invalid', (event) => {
            this.dispatchEvent(new Event('invalid', event));
        });

        if (this.hasAttribute('name')) this.$select.name = this.getAttribute('name');
        if (this.hasAttribute('required')) this.$select.required = true;
        //this.parentElement?.insertAdjacentElement(this.$select, this);
        //this.insertAdjacentElement('beforeend', this.$select);

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
        this.appendChild(this.$select);

        // Observer to selections height
        const selectionSizeObserver: ResizeObserver = new ResizeObserver((entries) => {
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

        this.filterCriteria = this.filterCriteriaDefault;
        const debounce = (fn: () => void, d = 300) => {
            let timer: number;
            return () => {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    fn();
                }, d);
            };
        };

        const debounced = debounce(() => this.searchAndFilterOptions());

        this.$optionsSearchInput.addEventListener('keyup', debounced);
    }

    private attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (newValue === oldValue) return;
        this.attrs.set(name, newValue);
    }

    private connectedCallback() {

        this.attrs.set(MuicSelect.MULTIPLE_ATTRIBUTE, this.hasAttribute(MuicSelect.MULTIPLE_ATTRIBUTE) ?? false);
        this.attrs.set(MuicSelect.PLACEHOLDER_ATTRIBUTE,
            this.getAttribute(MuicSelect.PLACEHOLDER_ATTRIBUTE) ??
            (this.attrs.get(MuicSelect.MULTIPLE_ATTRIBUTE) ? 'Select one or more' : 'Select one'));
        this.attrs.set(MuicSelect.SEARCH_ATTRIBUTE, this.hasAttribute(MuicSelect.SEARCH_ATTRIBUTE));

        const $options: NodeListOf<HTMLOptionElement> = this.querySelectorAll('option');

        // Initialize native options
        $options.forEach($option => {

            const option: MuiSelectOption = {
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
                    && this.attrs.get(MuicSelect.MULTIPLE_ATTRIBUTE) == false) {
                    this.toggleOptions(false);
                }
            });

            $option.classList.add(MuicSelect.OPTIONS_CONTAINER_ITEM_CLASS);

            // Move to options list
            this.$optionsList.appendChild($option);
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

    private searchAndFilterOptions() {
        const query: string = this.$optionsSearchInput.value;
        const filteredOptions: MuiSelectOption[] = this.options.filter(option => this.filterCriteria(query, option));
        console.log(filteredOptions);
    }

    /**
     * Renders options list
     */
    private renderOptionsContainer() {

        // For each option, create a option element
        this.options.forEach(option => {

            // Return if the option already has item element in options list
            if (option.$element) return;

            const $option = document.createElement('option');
            $option.classList.add(MuicSelect.OPTIONS_CONTAINER_ITEM_CLASS);
            $option.value = option.value;
            $option.innerText = option.label;
            $option.addEventListener('click', (event) => {
                this.selectOption(option, !option.selected);
                this.triggerEvent('change');
                if (option.selected
                    && this.attrs.get(MuicSelect.MULTIPLE_ATTRIBUTE) == false) {
                    this.toggleOptions(false);
                }
            });

            option.$element = $option;
            this.$optionsList.appendChild($option);
        });
    }

    /**
     * Creates selection bar item given a option
     * @param option Option to create selection item
     * @returns Selection item, if the option is empty, returns placeholder
     */
    private createSelectionItem(option?: MuiSelectOption): HTMLElement {
        const empty = document.createElement('div');
        empty.classList.add(MuicSelect.SELECTION_ITEM_CLASS);

        if (!option) {
            empty.classList.add('muic-empty-selection');
            empty.innerHTML = this.attrs.get(MuicSelect.PLACEHOLDER_ATTRIBUTE);
            return empty;
        }

        const $span: HTMLSpanElement = document.createElement('span');
        $span.innerText = option.label;
        const $button: HTMLButtonElement = document.createElement('button');
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
    private renderSelectionsContainer() {
        let isEmpty: boolean = true;
        let selectedOptionsStr: string = '';

        this.options.forEach(option => {
            const selected: boolean = option.selected;

            // Check if no selected and delete de selection option
            if (!selected) {
                option.$selectionElement?.remove();
                option.$selectionElement = undefined;
                return;
            }

            isEmpty = false;
            selectedOptionsStr += `<option value=${option.value} selected></option>`;

            // Return if the option already has selection option
            if (option.$selectionElement) return;

            // Render only selected options
            option.$selectionElement = this.createSelectionItem(option);
            this.$selectionContainer.appendChild(option.$selectionElement);
        });

        // Update select native element to update form data
        this.$select.innerHTML = selectedOptionsStr;

        const $emptySelection = this.querySelector('.muic-empty-selection');

        // If selections are empty and placeholder not created
        if (isEmpty && !$emptySelection) this.$selectionContainer.appendChild(this.createSelectionItem());
        else if (!isEmpty) $emptySelection?.remove();

        //this.$optionsContainer.style.translate = `0 ${this.$selectionContainer.offsetHeight}px`;
    }

    /**
     * Renders selection bar and options list
     */
    private render() {
        this.renderSelectionsContainer();
        this.renderOptionsContainer();
    }

    /**
     * Toggle the options list
     * @param show True to show list
     */
    toggleOptions(show: boolean) {
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
        } else {
            this.$optionsContainer.removeAttribute('open');
            this.$selectionContainer.removeAttribute('active');
            document.removeEventListener('click', this.backdropClick);
            this.triggerEvent('close');
        }
    }

    backdropClick(event: MouseEvent) {
        const elementUnderMouse = document.elementFromPoint(event.clientX, event.clientY)
            ?.closest(MuicSelect.SELECTOR);
        if (elementUnderMouse) return;
        MuicSelect.CURRENT_INSTANCE?.toggleOptions(false);
    }

    /**
     * Selects an option and updates the selection bar
     * @param option Option to change selection property
     * @param select Value to set
     * @param [render=true] If is false, {@link renderSelectionsContainer} must be called manually
     * @param notify If is true dispatches a change event
     */
    selectOption(option: MuiSelectOption, select: boolean, render: boolean = true) {

        const selectedOptions: MuiSelectOption[] = this.selectedOptions();
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

        if (!render) return;
        this.renderSelectionsContainer();
    }

    selectAllOptions() {
        this.options.forEach(option => this.selectOption(option, true, false));
        this.renderSelectionsContainer();
        this.triggerEvent('change');
    }

    deselectAllOptions() {
        this.options.forEach(option => this.selectOption(option, false, false));
        this.renderSelectionsContainer();
        this.triggerEvent('change');
    }

    /**
     * Gets selected options
     * @returns Selected options
     */
    selectedOptions(): MuiSelectOption[] {
        return this.options.filter(o => o.selected);
    }

    clearOptions() {
        this.options.forEach(option => {
            this.selectOption(option, false, false);
        });
        this.renderSelectionsContainer();
        this.triggerEvent('change');
    }

    triggerEvent(name: 'change' | 'open' | 'close') {

        if (name == 'change') {
            const event = new CustomEvent(name, { detail: { selected: this.selectedOptions() } });
            this.dispatchEvent(event);
            return;
        }

        const event = new Event(name);
        this.dispatchEvent(event);
    }
}

customElements.define('muic-select', MuicSelect);

