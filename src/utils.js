function createElement(tag, props, ...children) {
    const element = document.createElement(tag);

    if (props) {
        Object.keys(props).forEach(key => {
            if (key.startsWith('data-')) {
                element.setAttribute(key, props[key]);
            } else {
                element[key] = props[key];
            }
        });
    }

    children.forEach(child => {
        if (typeof child === 'string') {
            child = document.createTextNode(child);
        }

        element.appendChild(child);
    });

    return element;
}

function createForm() {
    let inputName = createElement('input', { type: 'text', className: 'form-name' });
    let inputEarnings = createElement('input', { type: 'text', className: 'form-earnings' });
    let addButton = createElement('button', { type: 'submit' }, 'Add');
    return createElement('form', undefined,  inputName, inputEarnings, addButton);
}

function createItem(company) {
    const labelName = createElement('label', { className: 'text name' }, company.name);
    const labelEarnings = createElement('label', { className: 'text earnings' }, String(company.estimatedEarnings));
    const labelEarningsChildren = createElement('label', { className: 'text earnings-children' }, '0');


    const editInputName = createElement('input', { type: 'text', className: 'textfield name-field' });
    const editInputEarnings = createElement('input', { type: 'text', className: 'textfield earnings-field' });

    const editButton = createElement('button', { className: 'edit' }, 'Edit');
    const deleteButton = createElement('button', { className: 'remove' }, 'Delete');


    return createElement('li', {'data-id': company._id, 'data-path': company.path }, labelName, labelEarnings, labelEarningsChildren, editInputName, editInputEarnings, editButton, deleteButton);
}

class EventEmitter {
    constructor() {
        this.events = {};
    }

    on(type, listener) {
        this.events[type] = this.events[type] || [];
        this.events[type].push(listener);
    }

    emit(type, arg) {
        if (this.events[type]) {
            this.events[type].forEach(listener => listener(arg));
        }
    }
}

export { createElement, EventEmitter, createForm, createItem };