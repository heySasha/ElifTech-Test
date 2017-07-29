const mongoose = require('mongoose');
const _ = require('lodash');

const tree = require('../lib/tree');

const CompanySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 1
    },
    estimatedEarnings: {
        type: Number,
        required: true,
        default: 0
    }
});

CompanySchema.methods.toJSON = function () {
    const company = this;
    const companyObject = company.toObject();

    return _.pick(companyObject, ['_id', 'path', 'name', 'estimatedEarnings', 'children']);
    // const estimatedEarningsChildCompanies = companyObject.childCompanies
    //     .reduce((sum, company) => sum + company.estimatedEarnings, 0);
    //
    // return Object.assign({},
    //     _.pick(companyObject, ['_id', 'name', 'estimatedEarnings', 'childCompanies']),
    //     {'estimatedEarningsAndEstimatedEarningsChildCompanies':
    //         companyObject.estimatedEarnings + estimatedEarningsChildCompanies }
};

CompanySchema.plugin(tree);




const Company = mongoose.model('Company', CompanySchema);


// const c1 = new Company({
//     name: 'Co 1',
//     estimatedEarnings: 1
// });
//
// const c2 = new Company({
//     name: 'Co 2',
//     estimatedEarnings: 1
// });
//
// const c3 = new Company({
//     name: 'Co 3',
//     estimatedEarnings: 1
// });
//
// c2.parent = c1;
// c3.parent = c2;
//
// c1.save()
//     .then(() => c2.save())
//     .then(() => c3.save());



module.exports = { Company };