// services/registerDomain.service.js
const { registerDomain } = require("go54-domain-reseller-api");

/**
 * Temporary fallback registrant (REMOVE later)
 */
const fallbackRegistrant = {
  firstname: "Mayowa",
  lastname: "Olusori",
  fullname: "Mayowa Olusori",
  companyname: "EasyHostNet",
  email: "admin@easyhostnet.com",
  address1: "Lekki Phase 1",
  city: "Lagos",
  state: "Lagos",
  zipcode: "110001",
  country: "NG",
  phonenumber: "+2348012345678",
};

/**
 * Build contacts object from a single registrant
 */
function buildContacts(registrant) {
  return {
    registrant,
    admin: registrant,
    billing: registrant,
    tech: registrant,
  };
}

const config = {
  endpoint: process.env.GO54_API_ENDPOINT,
  username: 'info@easyhostnet.com',
  apiSecret: 'Uwp5IwrzwxyMaoqGVRQATsjWXr20H9k3',
};

/**
 * Register a domain via Go54 / WhoGoHost
 */
async function registerDomainService({ domain, registrant }) {
  if (!domain) {
    throw new Error("Domain is required");
  }

  const contact = registrant || fallbackRegistrant;

  const payload = {
    domain,
    regperiod: 1,
    nameservers: {
      ns1: process.env.NS1,
      ns2: process.env.NS2,
    },
    contacts: buildContacts(contact),
  };

  return registerDomain(config, payload);
}

module.exports = registerDomainService;

