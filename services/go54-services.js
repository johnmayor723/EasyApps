import axios from "axios";
import crypto from "crypto";
import qs from "qs";

const {
  GO54_API_ENDPOINT,
  GO54_USERNAME,
  GO54_API_SECRET
} = process.env;

/**
 * Generate Go54 auth token (valid per hour)
 */
function generateToken() {
  const hour = new Date().toISOString().slice(2, 13).replace("T", " ");
  const payload = `${GO54_USERNAME}:${hour}`;

  const hmac = crypto
    .createHmac("sha256", GO54_API_SECRET)
    .update(payload)
    .digest("base64");

  return hmac;
}

/**
 * Register a domain via Go54
 */
export async function registerDomain({
  domain,
  regperiod = 1,
  nameservers,
  contacts
}) {
  const token = generateToken();

  const headers = {
    username: GO54_USERNAME,
    token
  };

  const data = {
    domain,
    regperiod,
    nameservers,
    contacts
  };

  const res = await axios.post(
    `${GO54_API_ENDPOINT}/order/domains/register`,
    qs.stringify(data, { encode: true }),
    {
      headers,
      timeout: 20000
    }
  );

  return res.data;
}
