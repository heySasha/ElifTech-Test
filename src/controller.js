class Controller {
    constructor(model, view) {
        this.model = model;
        this.view = view;

        view.on('add', this.addTodo.bind(this));
        view.on('edit', this.editCompany.bind(this));
        view.on('remove', this.removeCompany.bind(this));

        model.getItems()
            .then(res => {
                view.render(res.data.companies);
            });
    }

    addTodo(company) {
        this.model.addItem(company)
            .then(res => {
                this.view.addItem(res.data.company);
            });
    }


    editCompany({ id, name, estimatedEarnings }) {
       this.model.updateItem(id, { name, estimatedEarnings })
           .then(res => {
               this.view.editItem(res.data.company);
           });
    }

    removeCompany({ id, path, earningsChildren }) {
        this.model.removeItem(id)
            .then(res => {
               if (res.status === 200) {
                   this.view.removeItem({ id, path, earningsChildren });
               }
            });
    }
}

export default Controller;