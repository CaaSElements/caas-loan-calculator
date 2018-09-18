import {html, PolymerElement} from '@polymer/polymer/polymer-element.js';

/**
 * `caas-loan-calculator`
 * Loan calculator for crowdfunding campaigns
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
class CaasLoanCalculator extends PolymerElement {
  static get template() {
    return html`
      <style>
        :host {
          display: block;
        }
      </style>
    `;
  }
  static get properties() {
    return {
      loanType: {
        type: String,
        value: 'linear',
        notify: true
      },
      principle: {
        type: Number,
        value: 100000,
        notify: true
      },
      annuityIntervalInMonths: {
        type: Number,
        notify: true,
        value: 12
      },
      loanTermInMonths: {
        type: Number,
        notify: true,
        value: (5 * 12)
      },
      gracePeriod: {
        type: Number,
        notify: true,
        value: 12
      },
      interestRate: {
        type: Number,
        notify: true,
        value: 10
      },
      repayments: {
        type: Array,
        computed: '_computeRepayments(loanType, principle, terms, gracePeriod, interestRate)',
        notify: true
      },
      terms: {
        type: Number,
        notify: true,
        computed: 'computeNumberOfTerms(annuityIntervalInMonths, loanTermInMonths)'
      },
      _principleDebtPercentage: {
        type: Number
      },
      _remainingDebtPercentage: {
        type: Number
      },
      chartColumns: {
        type: Array,
        notify: true,
        computed: 'parseChartColumns(repayments)'
      },
      chartRows: {
        type: Array,
        notify: true,
        computed: 'parseChartRows(repayments)'

      }
    };
  }
  computeNumberOfTerms(annuityIntervalInMonths, loanTermInMonths) {
    return (parseInt(loanTermInMonths) / parseInt(annuityIntervalInMonths));

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

  _createSingleLinearLoanPayment(principle, iteration, terms, interestRate, gracePeriod) {
    var paymentFreeYears = gracePeriod / 12;
    var i = interestRate / 100; // accountants like breaks

    if (iteration == 0) {
      // this._principleDebtPercentage = Math.pow((1+i), paymentFreeYears) * 100; //graceperiod affects this
      this._principleDebtPercentage = Math.pow((1 + i), (paymentFreeYears)) * 100; //graceperiod affects this
      // this._remainingDebtPercentage = Math.pow((1+i), paymentFreeYears) * 100; //graceperiod affects this
      this._remainingDebtPercentage = Math.pow((1 + i), (paymentFreeYears)) * 100; //graceperiod affects this
    }
    console.log(i, paymentFreeYears, this._remainingDebtPercentage);

    var T = this._principleDebtPercentage;
    var n = terms;
    var A_k = T / n;
    var R_k = (T - (iteration * A_k)) * i;
    var J = A_k + R_k;

    this._remainingDebtPercentage = (this._remainingDebtPercentage - A_k);

    var interestPercentageCurrentPayment = R_k;
    var principlePercentageCurrentPayent = A_k;

    var principleAmountCurrentPayment = (principle * A_k) / 100;
    var interestAmountCurrentPayment = (principle * R_k) / 100;

    var totalCurrentPayment = J;

    return this._createSinglePaymentObject(interestPercentageCurrentPayment, principlePercentageCurrentPayent, principleAmountCurrentPayment, interestAmountCurrentPayment, iteration);
  }


  _createSingleAnnuityLoanPayment(principle, iteration, terms, interestRate, gracePeriod) {
    var paymentFreeYears = gracePeriod / 12;
    var i = interestRate / 100; // accountants like breaks
    if (iteration == 0) {
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
    var J = (i * Math.pow(1 + i, n)) / ((Math.pow(1 + i, n)) - 1) * T;
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
    return [{ "label": "Terugbetaling", "type": "number" }, { "label": "Rente E", "type": "number" }, { "label": "Deel E", "type": "number" }];
  }

  parseChartRows(repayments) {
    let rows = repayments.map((repayment) => {
      return [repayment.iteration, (repayment.interestAmount + repayment.principleAmount), repayment.principleAmount];
    });
    return rows;
  }
}

window.customElements.define('caas-loan-calculator', CaasLoanCalculator);
