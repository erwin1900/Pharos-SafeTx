import { parseIntent } from "./intent.js";
import { decodeTransaction } from "./decoder.js";
import { getRiskSelector } from "./riskSelectors.js";
import { localizeResult } from "./i18n.js";
import { hexToBigInt, includesAddress, isZeroValue, normalizeAddress, UINT256_MAX } from "./utils.js";
import { isSupportedChainId, validateSafeTxRequest } from "./validation.js";

function finding(severity, code, message, score) {
  return { severity, code, message, score };
}

function parseDecimalAmount(amount) {
  if (!amount) return null;
  const value = Number(amount);
  return Number.isFinite(value) ? value : null;
}

function parseDecimalToUnits(amount, decimals) {
  if (!amount || !Number.isInteger(decimals)) return null;
  const text = String(amount);
  if (!/^\d+(\.\d+)?$/.test(text)) return null;
  const [whole, fraction = ""] = text.split(".");
  const padded = fraction.padEnd(decimals, "0").slice(0, decimals);
  return BigInt(whole) * 10n ** BigInt(decimals) + BigInt(padded || "0");
}

function getPrimaryRecipient(decoded) {
  if (decoded.args.recipient) return decoded.args.recipient;
  if (decoded.kind === "native_transfer") return decoded.args.to;
  return null;
}

function getTokenDecimals(request, transaction, intent) {
  const decimals = request.tokenDecimals || {};
  const candidates = [
    intent.token,
    transaction.args.token,
    request.to
  ]
    .filter(Boolean)
    .map((item) => String(item).toLowerCase());

  for (const candidate of candidates) {
    if (Number.isInteger(decimals[candidate])) return decimals[candidate];
  }

  return null;
}

function getPolicyTokenLimit(request, transaction, intent) {
  const limits = request.policy?.maxTokenAmounts || {};
  const candidates = [
    intent.token,
    transaction.args.token,
    request.to
  ]
    .filter(Boolean)
    .map((item) => String(item).toLowerCase());

  for (const candidate of candidates) {
    if (limits[candidate] !== undefined) return limits[candidate];
  }

  return null;
}

function amountLooksExcessive(decodedAmount, intentAmount, decimals = null) {
  const parsedIntentAmount = parseDecimalAmount(intentAmount);
  if (parsedIntentAmount === null || decodedAmount === undefined) return false;

  const txAmount = BigInt(decodedAmount);
  if (Number.isInteger(decimals)) {
    const intentUnits = parseDecimalToUnits(intentAmount, decimals);
    return intentUnits !== null && txAmount > intentUnits;
  }

  if (!Number.isInteger(parsedIntentAmount)) return false;
  return txAmount > BigInt(parsedIntentAmount);
}

function amountExceedsPolicyLimit(decodedAmount, limitAmount, decimals = null) {
  if (!decodedAmount || !limitAmount) return false;
  const txAmount = BigInt(decodedAmount);

  if (Number.isInteger(decimals)) {
    const limitUnits = parseDecimalToUnits(limitAmount, decimals);
    return limitUnits !== null && txAmount > limitUnits;
  }

  if (!/^\d+$/.test(String(limitAmount))) return false;
  return txAmount > BigInt(limitAmount);
}

/**
 * @param {import("./types.js").SafeTxRequest} request
 * @returns {import("./types.js").SafeTxResult}
 */
export function analyzeTransaction(request) {
  request = validateSafeTxRequest(request);
  const intent = parseIntent(request.user_intent);
  const transaction = decodeTransaction(request);
  const findings = [];

  if (!isSupportedChainId(request.chainId)) {
    findings.push(
      finding(
        "medium",
        "UNEXPECTED_CHAIN",
        `Transaction is for chain ${request.chainId}; verify this is the intended Pharos network.`,
        16
      )
    );
  }

  const normalizedTo = normalizeAddress(request.to);
  if (includesAddress(request.blockedAddresses, normalizedTo)) {
    findings.push(finding("critical", "BLOCKED_TARGET", "Transaction target is explicitly blocked.", 100));
  }

  const policy = request.policy || {};
  if (policy.allowedTargets?.length > 0 && !includesAddress(policy.allowedTargets, normalizedTo)) {
    findings.push(
      finding(
        "critical",
        "POLICY_TARGET_NOT_ALLOWED",
        "Transaction target is not in the configured allowed target whitelist.",
        80
      )
    );
  }

  if (policy.maxNativeValue && hexToBigInt(request.value || "0x0") > hexToBigInt(policy.maxNativeValue)) {
    findings.push(
      finding(
        "critical",
        "POLICY_NATIVE_LIMIT_EXCEEDED",
        "Native value exceeds the configured per-transaction policy limit.",
        80
      )
    );
  }

  if (intent.action !== "unknown") {
    const expectedKinds = {
      transfer: ["native_transfer", "erc20_transfer", "erc20_transfer_from"],
      approve: ["erc20_approve"],
      swap: ["known_call", "erc20_approve"],
      stake: ["known_call"],
      claim: ["known_call"],
      deposit: ["known_call"],
      withdraw: ["known_call"],
      borrow: ["known_call"],
      repay: ["known_call"]
    }[intent.action];

    if (expectedKinds && !expectedKinds.includes(transaction.kind)) {
      findings.push(
        finding(
          "high",
          "INTENT_ACTION_MISMATCH",
          `User intent looks like ${intent.action}, but transaction decodes as ${transaction.functionName}.`,
          32
        )
      );
    }
  } else {
    findings.push(
      finding(
        "medium",
        "UNCLEAR_USER_INTENT",
        "User intent is too vague for autonomous wallet handoff; request clarification before continuing.",
        18
      )
    );
  }

  if (intent.addresses.length > 0) {
    const primaryRecipient = normalizeAddress(getPrimaryRecipient(transaction));
    const transactionTarget = normalizeAddress(request.to);
    const mentioned = intent.addresses.map(normalizeAddress).filter(Boolean);
    const matchesMentionedAddress = [primaryRecipient, transactionTarget].some((addr) => addr && mentioned.includes(addr));
    if (!matchesMentionedAddress) {
      findings.push(
        finding(
          "critical",
          "INTENT_ADDRESS_MISMATCH",
          "Neither transaction target nor recipient matches the address mentioned in user intent.",
          70
        )
      );
    }
  }

  const primaryRecipientForPolicy = normalizeAddress(getPrimaryRecipient(transaction));
  if (
    policy.allowedRecipients?.length > 0 &&
    primaryRecipientForPolicy &&
    !includesAddress(policy.allowedRecipients, primaryRecipientForPolicy)
  ) {
    findings.push(
      finding(
        "critical",
        "POLICY_RECIPIENT_NOT_ALLOWED",
        "Transaction recipient is not in the configured recipient whitelist.",
        80
      )
    );
  }

  if (transaction.kind === "erc20_approve") {
    const amount = BigInt(transaction.args.amount);
    const spender = normalizeAddress(transaction.args.spender);
    if (amount === UINT256_MAX) {
      findings.push(
        finding(
          "critical",
          "INFINITE_APPROVAL",
          "Transaction grants unlimited token approval, which can drain the full token balance.",
          46
        )
      );
    }

    if (policy.allowedSpenders?.length > 0 && !includesAddress(policy.allowedSpenders, spender)) {
      findings.push(
        finding(
          "critical",
          "POLICY_SPENDER_NOT_ALLOWED",
          "Approval spender is not in the configured spender whitelist.",
          80
        )
      );
    } else if (!includesAddress([...request.trustedSpenders, ...(policy.allowedSpenders || [])], spender)) {
      findings.push(
        finding(
          "high",
          "UNTRUSTED_SPENDER",
          "Approval spender is not in the trusted spender list provided to SafeTx.",
          30
        )
      );
    }

    if (intent.action !== "approve" && intent.action !== "swap") {
      findings.push(
        finding(
          "high",
          "UNEXPECTED_APPROVAL",
          "User intent did not explicitly ask for token approval.",
          32
        )
      );
    }
  }

  if (transaction.kind === "unknown_call") {
    findings.push(
      finding(
        "high",
        "UNKNOWN_CALLDATA",
        `SafeTx does not recognize function selector ${transaction.selector}.`,
        34
      )
    );
  }

  const riskySelector = getRiskSelector(transaction.selector);
  if (riskySelector && riskySelector.selector !== "0x095ea7b3") {
    findings.push(
      finding(
        riskySelector.severity,
        riskySelector.code,
        `${riskySelector.name} is a high-attention selector. ${riskySelector.recommendation}`,
        riskySelector.score
      )
    );
  }

  if (!isZeroValue(request.value || "0x0") && intent.action !== "transfer" && intent.action !== "swap") {
    findings.push(
      finding(
        "high",
        "UNEXPECTED_NATIVE_VALUE",
        "Transaction sends native value although the user intent did not clearly authorize a value transfer.",
        30
      )
    );
  }

  if (transaction.args.amount && amountLooksExcessive(transaction.args.amount, intent.amount, getTokenDecimals(request, transaction, intent))) {
    findings.push(
      finding(
        "medium",
        "AMOUNT_EXCEEDS_INTENT",
        "Decoded transaction amount is greater than the amount expressed in user intent.",
        22
      )
    );
  }

  const policyTokenLimit = getPolicyTokenLimit(request, transaction, intent);
  if (
    transaction.args.amount &&
    amountExceedsPolicyLimit(transaction.args.amount, policyTokenLimit, getTokenDecimals(request, transaction, intent))
  ) {
    findings.push(
      finding(
        "critical",
        "POLICY_TOKEN_LIMIT_EXCEEDED",
        "Transaction token amount exceeds the configured per-transaction policy limit.",
        80
      )
    );
  }

  const riskScore = Math.min(100, findings.reduce((sum, item) => sum + item.score, 0));
  const decision = decide(riskScore, findings);

  const result = {
    decision,
    risk_score: riskScore,
    intent,
    transaction,
    findings,
    reasons: findings.map((item) => item.message),
    agent_action: agentAction(decision),
    safer_alternative: saferAlternative(transaction, intent, decision)
  };

  return localizeResult(result, request.language);
}

function decide(riskScore, findings) {
  if (findings.some((item) => item.severity === "critical") || riskScore >= 70) return "BLOCK";
  if (riskScore >= 25) return "WARN";
  return "ALLOW";
}

function agentAction(decision) {
  if (decision === "ALLOW") return "Proceed with wallet handoff if the user session permits autonomous actions.";
  if (decision === "WARN") return "Pause and ask the user for explicit confirmation before wallet handoff.";
  return "Do not continue the wallet handoff for this transaction.";
}

function saferAlternative(transaction, intent, decision) {
  if (decision === "ALLOW") return "No safer alternative required for the current request.";
  if (transaction.kind === "erc20_approve") {
    return intent.amount
      ? `Replace unlimited approval with a limited approval close to ${intent.amount} ${intent.token || "tokens"} for a trusted spender.`
      : "Use a limited approval amount and verify the spender before retrying.";
  }
  if (transaction.kind === "unknown_call") {
    return "Decode the contract ABI or route the action through a verified Pharos protocol adapter before wallet handoff.";
  }
  return "Regenerate the transaction from the original user intent and re-run SafeTx before wallet handoff.";
}
