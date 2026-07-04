export const CompanyContextPort = null;

export function createCompanyContextAdapter(sharedState) {
  return {
    getCurrent() {
      return sharedState.getState().currentCompany;
    },

    setCurrent(company) {
      sharedState.getState().setCurrentCompany(company);
    },

    getGSTIN() {
      const company = sharedState.getState().currentCompany;
      return company?.gstin || '';
    },

    getStateCode() {
      const company = sharedState.getState().currentCompany;
      return company?.stateCode || '';
    },
  };
}