/**
 * `caas-loan-calculator`
 * Loan calculator for crowdfunding campaigns
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
class CaasLoanCalculator extends Polymer.Element {
    static get is() {
        return 'caas-loan-calculator';
    }
    static get properties() {
        return {
            loanType: {
                type: String,
                value: 'annuity',
                notify: true
            },
            principle: {
                type: Number,
                value: 100000,
                notify: true
            },
            annuityIntervalInMonths: {
                type: Number,
                value: 12
            },
            loanTermInMonths:{
                type: Number,
                value: (5*12)
            },
            gracePeriod: {
                type: Number,
                value: 24
            },
            interestRate: {
                type: Number,
                value: 10
            },
            repayments: {
                type: Array,
                computed: '_computeRepayments(loanType, principle, terms, gracePeriod, interestRate)',
                notify: true
            },
            terms: {
                type: Number,
                computed: 'computeNumberOfTerms(annuityIntervalInMonths, loanTermInMonths)'
            },
            _principleDebtPercentage: {
                type: Number,
                observer: '_log'
            },
            _remainingDebtPercentage: {
                type: Number,
                // observer: '_log'
            },
            chartColumns: {
                type: Array,
                computed: 'parseChartColumns(repayments)'
            },
            chartRows: {
                type: Array,
                computed: 'parseChartRows(repayments)'

            }
        };
    }

    _log(v) {
        console.log(v);
    }

    computeNumberOfTerms(annuityIntervalInMonths, loanTermInMonths) {
        return (parseInt(loanTermInMonths) / parseInt(annuityIntervalInMonths)) + 1;

    }

    _computeRepayments(loanType, principle, terms, gracePeriod, interestRate) {
        var repayments = [];
        for (var iteration = 0; iteration < terms; iteration++) {
            repayments.push(this._createSinglePayment(
                parseInt(principle),
                parseInt(iteration),
                loanType,
                parseInt(terms),
                parseInt(interestRate),
                parseInt(gracePeriod))
            );
        }
        return repayments;
    }

    _createSinglePayment(principle, iteration, loanType, terms, interestRate, gracePeriod) {
        switch (loanType) {
            case 'linear':
                return this._createSingleLinearLoanPayment(principle, iteration, terms, interestRate, gracePeriod);
            case 'annuity':
                return this._createSingleAnnuityLoanPayment(principle, iteration, terms, interestRate, gracePeriod);
            default:

        }
    }

    _createSingleLinearLoanPayment(principle, iteration, terms, interestRate, gracePeriod){
        var paymentFreeYears = gracePeriod / 12;
        var i = interestRate / 100; // accountants like breaks
        if(iteration == 0) {
            this._principleDebtPercentage = Math.pow((1 + i), paymentFreeYears) * 100; //graceperiod affects this
        }

        var T =  this._principleDebtPercentage;
        var n =  terms;
        var A_k = T / n;
        var R_k = (T - (iteration * A_k)) * i;
        var J = A_k + R_k;

        var interestPercentageCurrentPayment = R_k;
        var principlePercentageCurrentPayent = A_k;

        var principleAmountCurrentPayment = (principle * A_k) / 100;
        var interestAmountCurrentPayment = (principle * R_k) / 100;

        var totalCurrentPayment = J;

        return this._createSinglePaymentObject(interestPercentageCurrentPayment, principlePercentageCurrentPayent, principleAmountCurrentPayment, interestAmountCurrentPayment, iteration);
    }


    _createSingleAnnuityLoanPayment(principle, iteration, terms, interestRate, gracePeriod){
        var paymentFreeYears = gracePeriod / 12;
        var i = interestRate / 100; // accountants like breaks
        if(iteration == 0) {
            this._remainingDebtPercentage = Math.pow((1 + i), paymentFreeYears) * 100;
            this._principleDebtPercentage = Math.pow((1 + i), paymentFreeYears) * 100; // graceperiod affects this
        }

        var T_kmin1 = this._remainingDebtPercentage;
        var J = this.calculatePeriodicPaymentPercentageForAnnuityLoan(terms, interestRate);

        var R_k = i * T_kmin1;
        var A_k = J - R_k;
        var T_k = R_k + A_k;

        this._remainingDebtPercentage = (this._remainingDebtPercentage - A_k);

        var interestPercentageCurrentPayment = R_k;
        var principlePercentageCurrentPayent = A_k;
        var principleAmountCurrentPayment = (principle * A_k) / 100;
        var interestAmountCurrentPayment = (principle * R_k) / 100;

        var totalCurrentPayment = J;

        return this._createSinglePaymentObject(interestPercentageCurrentPayment, principlePercentageCurrentPayent, principleAmountCurrentPayment, interestAmountCurrentPayment, iteration);
    }

    calculatePeriodicPaymentPercentageForAnnuityLoan(terms, interestRate) {
        var i = interestRate / 100; // accountants like breaks
        var n = terms;
        var T = this._principleDebtPercentage;
        // actual formula from https://nl.wikipedia.org/wiki/Annu%C3%AFteit
        var J = (i * Math.pow(1+i, n)) / ( (Math.pow(1+i, n)) - 1) * T;
        // back to reality
        return J;
    }

    _createSinglePaymentObject(interestPercentageCurrentPayment, principlePercentageCurrentPayent, principleAmountCurrentPayment, interestAmountCurrentPayment, iteration) {
        return {
            interestPercentage: Math.round(interestPercentageCurrentPayment),
            principlePercentage: Math.round(principlePercentageCurrentPayent),
            interestAmount: Math.round(interestAmountCurrentPayment),
            principleAmount: Math.round(principleAmountCurrentPayment),
            totalCurrentPayment: Math.round((principleAmountCurrentPayment + interestAmountCurrentPayment)),
            iteration: iteration + 1
        }
    }

    parseChartColumns(repayments) {
        return [{"label":"Terugbetaling", "type":"number"}, {"label":"Rente E", "type":"number"}, {"label":"Deel E", "type":"number"}];
    }

    parseChartRows(repayments) {
        let rows = repayments.map((repayment) => {
            return [repayment.iteration, (repayment.interestAmount + repayment.principleAmount), repayment.principleAmount];
        });
        return rows;
    }
}

window.customElements.define(CaasLoanCalculator.is, CaasLoanCalculator);
