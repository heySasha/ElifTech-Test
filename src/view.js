import { createElement, EventEmitter, createForm, createItem } from './utils';

class View extends EventEmitter {
    constructor() {
        super();

        this.list = document.getElementById('company-list');

        let form = createForm();
        form.addEventListener('submit', this.handleAdd.bind(this));
        this.list.appendChild(form);

        this.on('reduce-earnings', this.reduceEarnings.bind(this));
    }

    render(companies) {
        const list = this.makeHierarchyList(companies);
        this.list.appendChild(list);

        const allLi = this.list.querySelectorAll('li');
        allLi.forEach(li => {
                let path = li.dataset['path'];
                let earnings = Number(li.querySelector('.earnings').textContent);

                this.emit('reduce-earnings', { path, earnings });
            }
        );
    }

    reduceEarnings({ path, earnings }) {
        const parents = path.split('#');
        parents.forEach(id => {
            let parent = this.findListItem(id);
            let earningsChildren = parent.querySelector('.earnings-children');

            earningsChildren.textContent = Number(earningsChildren.textContent) + earnings;
        })
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

        const labelName = listItem.querySelector('.name');
        const labelEarnings = listItem.querySelector('.earnings');

        const inputName = listItem.querySelector('.name-field');
        const inputEarnings = listItem.querySelector('.earnings-field');

        const editButton = listItem.querySelector('button.edit');

        const name = inputName.value;
        const estimatedEarnings = inputEarnings.value;

        const isEditing = listItem.classList.contains('editing');

        if (isEditing) {
            this.emit('edit', { id, name, estimatedEarnings });
        } else {
            inputName.value = labelName.textContent;
            inputEarnings.value = labelEarnings.textContent;
            editButton.textContent = 'Save';
            listItem.classList.add('editing');
        }
    }

    handleRemove({ target }) {
        const listItem = target.parentNode;
        const earningsChildren = Number(listItem.querySelector('.earnings-children').textContent);

        this.emit('remove', { id: listItem.getAttribute('data-id'), path: listItem.getAttribute('data-path'), earningsChildren });
    }

    handleAdd(event) {
        event.preventDefault();

        const parent = event.target.parentElement.dataset['id'];
        const name = event.target.querySelector('.form-name');
        const estimatedEarnings = event.target.querySelector('.form-earnings');

        //console.log(earnings)
        if (estimatedEarnings.value.trim() === '') {
            estimatedEarnings.value = 0;
        }

        if ( Number.isNaN( Number(estimatedEarnings.value) ) ) {
            alert('earnings is not a number');
        } else {
            this.emit('add', { parent, name : name.value, estimatedEarnings: estimatedEarnings.value });

            name.value = '';
            estimatedEarnings.value = '';
        }
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

        this.emit('reduce-earnings', { path: company.path, earnings: company.estimatedEarnings });
    }

    editItem(company) {
        const listItem = this.findListItem(company._id);

        const labelName = listItem.querySelector('.name');
        const labelEarnings = listItem.querySelector('.earnings');
        const editButton = listItem.querySelector('button.edit');

        this.emit('reduce-earnings', {
            path: company.path,
            earnings: company.estimatedEarnings - Number(labelEarnings.textContent)
        });

        labelName.textContent = company.name;
        labelEarnings.textContent = company.estimatedEarnings;

        editButton.textContent = 'Edit';
        listItem.classList.remove('editing');
    }

    removeItem({ id, path, earningsChildren }) {
        this.emit('reduce-earnings', { path, earnings: -earningsChildren });

        const listItem = this.findListItem(id);
        const parent = listItem.parentElement;

        while (listItem.lastChild) {
            listItem.removeChild(listItem.lastChild);
        }

        parent.removeChild(listItem);
    }
}

export default View;