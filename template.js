class Template extends HTMLElement {
    constructor(){
        super();
    }

    connectedCallback() {
        const shadow = this.attachShadow({ mode: "open" });
        const style = document.createElement("style");
        style.textContent = ``;
        shadow.appendChild(style);
    }

    render(){
        console.log('render');
    }
}