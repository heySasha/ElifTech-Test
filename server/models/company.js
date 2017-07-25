const mongoose = require('mongoose');
const _ = require('lodash');

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
    },
    childCompanies: [{
        name: {
            type: String,
            required: true,
            minlength: 1
        },
        estimatedEarnings: {
            type: Number,
            required: true,
            default: 0
        },
    }]
});


CompanySchema.methods.toJSON = function () {
    const company = this;
    const companyObject = company.toObject();

    const estimatedEarningsChildCompanies = companyObject.childCompanies
        .reduce((sum, company) => sum + company.estimatedEarnings, 0);

    return Object.assign({},
        _.pick(companyObject, ['_id', 'name', 'estimatedEarnings', 'childCompanies']),
        {'estimatedEarningsAndEstimatedEarningsChildCompanies':
            companyObject.estimatedEarnings + estimatedEarningsChildCompanies });
};

const Company = mongoose.model('Company', CompanySchema);

module.exports = { Company };