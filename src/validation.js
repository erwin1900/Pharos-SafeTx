import { normalizeAddress, normalizeHex } from "./utils.js";

const SUPPORTED_CHAIN_IDS = new Set([1672, 688689]);

export class ValidationError extends Error {
  constructor(errors) {
    super(errors.join("; "));
    this.name = "ValidationError";
    this.errors = errors;
  }
}

export function validateSafeTxRequest(request) {
  const errors = [];

  if (!request || typeof request !== "object" || Array.isArray(request)) {
    throw new ValidationError(["SafeTx request must be a JSON object"]);
  }

  requireString(request, "user_intent", errors);
  requireString(request, "from", errors);
  requireString(request, "to", errors);

  const chainId = validateChainId(request.chainId, errors);
  const from = validateAddressField(request.from, "from", errors);
  const to = validateAddressField(request.to, "to", errors);
  const value = validateHexQuantityField(request.value ?? "0x0", "value", errors);
  const calldata = validateHexField(request.calldata ?? "0x", "calldata", errors);
  const trustedSpenders = validateAddressList(request.trustedSpenders, "trustedSpenders", errors);
  const blockedAddresses = validateAddressList(request.blockedAddresses, "blockedAddresses", errors);
  const addressBook = validateAddressBook(request.addressBook, errors);
  const tokenDecimals = validateTokenDecimals(request.tokenDecimals, errors);
  const policy = validatePolicy(request.policy, errors);
  const language = validateLanguage(request.language, errors);

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  return {
    ...request,
    user_intent: request.user_intent.trim(),
    chainId,
    from,
    to,
    value,
    calldata,
    trustedSpenders,
    blockedAddresses,
    addressBook,
    tokenDecimals,
    policy,
    language
  };
}

export function isSupportedChainId(chainId) {
  return SUPPORTED_CHAIN_IDS.has(Number(chainId));
}

function requireString(request, field, errors) {
  if (typeof request[field] !== "string" || request[field].trim() === "") {
    errors.push(`${field} must be a non-empty string`);
  }
}

function validateChainId(value, errors) {
  const chainId = Number(value);
  if (!Number.isInteger(chainId) || chainId <= 0) {
    errors.push("chainId must be a positive integer");
    return value;
  }
  return chainId;
}

function validateAddressField(value, field, errors) {
  const address = normalizeAddress(value);
  if (!address || address !== String(value).toLowerCase()) {
    errors.push(`${field} must be a valid 0x-prefixed EVM address`);
  }
  return address || value;
}

function validateHexField(value, field, errors) {
  try {
    return normalizeHex(String(value));
  } catch (error) {
    errors.push(`${field} must be valid hex: ${error.message}`);
    return value;
  }
}

function validateHexQuantityField(value, field, errors) {
  const text = String(value);
  if (!/^0x[0-9a-fA-F]+$/.test(text)) {
    errors.push(`${field} must be a 0x-prefixed hex quantity`);
  }
  return text.toLowerCase();
}

function validateAddressList(value, field, errors) {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    errors.push(`${field} must be an array of EVM addresses`);
    return [];
  }

  return value.map((item, index) => {
    const address = normalizeAddress(item);
    if (!address || address !== String(item).toLowerCase()) {
      errors.push(`${field}[${index}] must be a valid 0x-prefixed EVM address`);
    }
    return address || item;
  });
}

function validateAddressBook(value, errors) {
  if (value === undefined) return {};
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    errors.push("addressBook must be an object whose values are EVM addresses");
    return {};
  }

  const normalized = {};
  for (const [label, addressValue] of Object.entries(value)) {
    const address = normalizeAddress(addressValue);
    if (!address || address !== String(addressValue).toLowerCase()) {
      errors.push(`addressBook.${label} must be a valid 0x-prefixed EVM address`);
      continue;
    }
    normalized[label] = address;
  }
  return normalized;
}

function validateTokenDecimals(value, errors) {
  if (value === undefined) return {};
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    errors.push("tokenDecimals must be an object whose values are integer decimals");
    return {};
  }

  const normalized = {};
  for (const [token, decimalsValue] of Object.entries(value)) {
    const decimals = Number(decimalsValue);
    if (!Number.isInteger(decimals) || decimals < 0 || decimals > 36) {
      errors.push(`tokenDecimals.${token} must be an integer between 0 and 36`);
      continue;
    }
    normalized[token.toLowerCase()] = decimals;
  }
  return normalized;
}

function validatePolicy(value, errors) {
  const defaults = {
    allowedTargets: [],
    allowedRecipients: [],
    allowedSpenders: [],
    maxNativeValue: null,
    maxTokenAmounts: {}
  };

  if (value === undefined) return defaults;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    errors.push("policy must be an object");
    return defaults;
  }

  return {
    allowedTargets: validateAddressList(value.allowedTargets, "policy.allowedTargets", errors),
    allowedRecipients: validateAddressList(value.allowedRecipients, "policy.allowedRecipients", errors),
    allowedSpenders: validateAddressList(value.allowedSpenders, "policy.allowedSpenders", errors),
    maxNativeValue:
      value.maxNativeValue === undefined ? null : validateHexQuantityField(value.maxNativeValue, "policy.maxNativeValue", errors),
    maxTokenAmounts: validateMaxTokenAmounts(value.maxTokenAmounts, errors)
  };
}

function validateMaxTokenAmounts(value, errors) {
  if (value === undefined) return {};
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    errors.push("policy.maxTokenAmounts must be an object whose values are decimal amount strings");
    return {};
  }

  const normalized = {};
  for (const [token, amount] of Object.entries(value)) {
    const text = String(amount);
    if (!/^\d+(\.\d+)?$/.test(text)) {
      errors.push(`policy.maxTokenAmounts.${token} must be a non-negative decimal amount string`);
      continue;
    }
    normalized[token.toLowerCase()] = text;
  }
  return normalized;
}

function validateLanguage(value, errors) {
  if (value === undefined) return "en";
  const language = String(value);
  if (!["en", "zh", "zh-CN", "bilingual"].includes(language)) {
    errors.push("language must be one of: en, zh, zh-CN, bilingual");
    return language;
  }
  return language === "zh-CN" ? "zh" : language;
}
