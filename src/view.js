import { createElement, EventEmitter, createForm, createItem } from './utils';

class View extends EventEmitter {
    constructor() {
        super();

        this.list = document.getElementById('company-list');

        let form = createForm();
        form.addEventListener('submit', this.handleAdd.bind(this));
        this.list.appendChild(form);
    }

    render(companies) {
        const list = this.makeHierarchyList(companies);
        this.list.appendChild(list)
    }


    findListItem(id) {
        return this.list.querySelector(`[data-id="${id}"]`);
    }

    createListItem(company) {
        const item = createItem(company);
        const form = createForm();

        form.addEventListener('submit', this.handleAdd.bind(this));
        item.appendChild(form);

        return this.addEventListeners(item);
    }

    makeHierarchyList(companies) {
        let ul = document.createElement('ul');

        companies.forEach(item => {
            let li = this.createListItem(item);

            ul.appendChild(li);

            if (item.children.length) {
                li.appendChild(this.makeHierarchyList(item.children));
            }
        });

        return ul;
    }

    addEventListeners(item) {
        const editButton = item.querySelector('button.edit');
        const removeButton = item.querySelector('button.remove');

        editButton.addEventListener('click', this.handleEdit.bind(this));
        removeButton.addEventListener('click', this.handleRemove.bind(this));

        return item;
    }

    handleEdit({ target }) {
        const listItem = target.parentNode;
        const id = listItem.getAttribute('data-id');
        const label = listItem.querySelector('.name');
        const input = listItem.querySelector('.textfield');
        const editButton = listItem.querySelector('button.edit');
        const name = input.value;
        const isEditing = listItem.classList.contains('editing');

        if (isEditing) {
            this.emit('edit', { id, name });
        } else {
            input.value = label.textContent;
            editButton.textContent = 'Save';
            listItem.classList.add('editing');
        }
    }

    handleRemove({ target }) {
        const listItem = target.parentNode;

        this.emit('remove', listItem.getAttribute('data-id'));
    }

    handleAdd(event) {
        event.preventDefault();

        const parent = event.target.parentElement.dataset['id'];
        const name = event.target.firstChild.value;

        this.emit('add', { parent, name });

        event.target.firstChild.value = '';
    }

    addItem(company) {
        const listItem = this.createListItem(company);

        let ul, parent;
        let ids = company.path.split('#');

        if (ids.length > 1) {
            parent = this.findListItem(ids[ids.length-2]);
            ul = parent.querySelector('ul');
        } else {
            ul = this.list.querySelector('ul');
            parent = this.list;
        }

        if (ul) {
            ul.appendChild(listItem);
        } else {
            let ul = createElement('ul', undefined, listItem);
            parent.appendChild(ul);
        }
    }

    editItem(company) {
        console.log(company);

        const listItem = this.findListItem(company._id);

        const label = listItem.querySelector('.name');
        const editButton = listItem.querySelector('button.edit');

        label.textContent = company.name;
        editButton.textContent = 'Изменить';
        listItem.classList.remove('editing');
    }

    removeItem(id) {
        const listItem = this.findListItem(id);
        const parent = listItem.parentElement;

        while (listItem.lastChild) {
            listItem.removeChild(listItem.lastChild);
        }

        parent.removeChild(listItem);
    }
}

export default View;