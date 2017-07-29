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
    let input = createElement('input', { type: 'text' });
    let addButton = createElement('button', { type: 'submit' }, 'Add');
    return createElement('form', undefined,  input, addButton);
}

function createItem(company) {
    const label = createElement('label', { className: 'name' }, company.name);
    const editInput = createElement('input', { type: 'text', className: 'textfield' });
    const editButton = createElement('button', { className: 'edit' }, 'Edit');
    const deleteButton = createElement('button', { className: 'remove' }, 'Delete');
    return createElement('li', {'data-id': company._id }, label, editInput, editButton, deleteButton);
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