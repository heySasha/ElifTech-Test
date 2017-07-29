const router = require('express').Router();
const { ObjectID } = require('mongodb');
const _ = require('lodash');

const { Company } = require('../models/company');

router.get('/', (req, res) => {
    Company.getChildrenTree((err, companies) => {
        if (err) {
            return res.status(404).send();
        }

        res.send({ companies });
    });
});

router.get('/:id', (req, res) => {
    const { id } = req.params;

    if (!ObjectID.isValid(id)) {
        return res.status(404).send();
    }

    Company.findById(id)
        .then(company => {
            if (!company) {
                return res.status(404).send();
            }

            company.getChildrenTree((err, childCompanies) => {
                if (err) {
                    return res.status(404).send();
                }

                const object = _.pick(company, ['_id', 'path', 'name', 'estimatedEarnings']);
                object.children = childCompanies;

                res.send(object);
            });

        })
        .catch(err => res.status(400).send());
});

router.delete('/:id', (req, res) => {
    const {id} = req.params;

    if (!ObjectID.isValid(id)) {
        return res.status(404).send();
    }

    Company.findByIdAndRemove(id)
        .then(company => {
            if (!company) {
                return res.status(404).send();
            }
            res.send({ company });
        })
        .catch(err => res.status(400).send());
});

router.post('/', (req, res) => {
    const body = _.pick(req.body, ['name', 'estimatedEarnings', 'childCompanies', 'parent']);
    const company = new Company(body);

    company.save()
        .then(company => {

            res.send({ company });
        })
        .catch(err => res.status(400).send());
});

router.patch('/:id', (req, res) => {
    const { id } = req.params;
    const body = _.pick(req.body, ['name', 'estimatedEarnings']);

    console.log('server', req.body, id);

    if(!ObjectID.isValid(id)) {
        return res.status(404).send();
    }

    Company.findByIdAndUpdate(id, { $set: body }, { new: true })
        .then(company => {
            if (!company) {
                return res.status(404).send();
            }
            res.send({ company });
        })
        .catch(err => res.status(400).send());
});

module.exports = router;