import axios from 'axios';

class Model {
    constructor() {
    }

    getItems() {
        return axios.get('/companies');
    }

    getItem(id) {
        return axios.get(`/companies/${id}`);
    }

    addItem(item) {
        return axios.post('companies', item);
    }

    updateItem(id, data) {
        return axios.patch(`/companies/${id}`, data);
    }

    removeItem(id) {
        return axios.delete(`/companies/${id}`);
    }
}

export default Model;