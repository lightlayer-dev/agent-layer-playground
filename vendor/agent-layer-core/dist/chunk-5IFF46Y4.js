// src/x402.ts
var X402_VERSION = 1;
var HEADER_PAYMENT_REQUIRED = "payment-required";
var HEADER_PAYMENT_SIGNATURE = "payment-signature";
var HEADER_PAYMENT_RESPONSE = "payment-response";
var HttpFacilitatorClient = class {
  constructor(url) {
    this.url = url;
  }
  async verify(payload, requirements) {
    const res = await fetch(`${this.url}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload, requirements })
    });
    if (!res.ok) {
      throw new Error(`Facilitator verify failed: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }
  async settle(payload, requirements) {
    const res = await fetch(`${this.url}/settle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload, requirements })
    });
    if (!res.ok) {
      throw new Error(`Facilitator settle failed: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }
};
function resolvePrice(price) {
  if (typeof price === "string") {
    const match = price.match(/^\$(\d+(?:\.\d+)?)$/);
    if (!match) throw new Error(`Invalid price string: ${price}. Use "$X.XX" format.`);
    return { amount: match[1], asset: "USDC" };
  }
  return price;
}
function buildRequirements(config) {
  const { amount, asset, extra: priceExtra } = resolvePrice(config.price);
  return {
    scheme: config.scheme ?? "exact",
    network: config.network,
    asset,
    amount,
    payTo: config.payTo,
    maxTimeoutSeconds: config.maxTimeoutSeconds ?? 60,
    extra: { ...config.extra, ...priceExtra }
  };
}
function buildPaymentRequired(url, config, error) {
  return {
    x402Version: X402_VERSION,
    error,
    resource: {
      url,
      description: config.description
    },
    accepts: [buildRequirements(config)]
  };
}
function encodePaymentRequired(pr) {
  return Buffer.from(JSON.stringify(pr)).toString("base64");
}
function decodePaymentPayload(header) {
  try {
    return JSON.parse(Buffer.from(header, "base64").toString("utf-8"));
  } catch {
    throw new Error("Invalid PAYMENT-SIGNATURE header: not valid base64 JSON");
  }
}
function matchRoute(method, path, routes) {
  const key = `${method.toUpperCase()} ${path}`;
  if (routes[key]) return routes[key];
  const upperMethod = method.toUpperCase();
  let bestMatch;
  let bestLen = -1;
  for (const pattern of Object.keys(routes)) {
    if (!pattern.endsWith("/*")) continue;
    const [patternMethod, patternPath] = pattern.split(" ", 2);
    if (patternMethod !== upperMethod) continue;
    const prefix = patternPath.slice(0, -1);
    if (path.startsWith(prefix) && prefix.length > bestLen) {
      bestLen = prefix.length;
      bestMatch = routes[pattern];
    }
  }
  return bestMatch;
}

export {
  X402_VERSION,
  HEADER_PAYMENT_REQUIRED,
  HEADER_PAYMENT_SIGNATURE,
  HEADER_PAYMENT_RESPONSE,
  HttpFacilitatorClient,
  resolvePrice,
  buildRequirements,
  buildPaymentRequired,
  encodePaymentRequired,
  decodePaymentPayload,
  matchRoute
};
//# sourceMappingURL=chunk-5IFF46Y4.js.map