import { extractAddresses } from "./utils.js";

const ACTION_PATTERNS = [
  ["swap", /\b(swap|exchange|trade|兑换|交换)\b/i],
  ["approve", /\b(approve|approval|authorize|allowance|授权)\b/i],
  ["transfer", /\b(transfer|send|pay|发送|转账|付款)\b/i],
  ["stake", /\b(stake|staking|质押)\b/i],
  ["claim", /\b(claim|reward|get reward|领取|申领|奖励)\b/i],
  ["deposit", /\b(deposit|supply|lend|存入|存款|供应|借出)\b/i],
  ["withdraw", /\b(withdraw|redeem|unstake|取出|赎回|提现吗?)\b/i],
  ["borrow", /\b(borrow|loan|借款|借贷)\b/i],
  ["repay", /\b(repay|repayment|还款|偿还)\b/i]
];

const TOKEN_PATTERN = /\b(USDC|USDT|WETH|ETH|PHRS|PROS|DAI|WBTC|BTC|NFT)\b/i;
const AMOUNT_PATTERN = /(?:\b|^)(\d+(?:\.\d+)?)\s*([A-Za-z][A-Za-z0-9]{1,12})?/;

/**
 * @param {string} userIntent
 * @returns {import("./types.js").ParsedIntent}
 */
export function parseIntent(userIntent = "") {
  const raw = String(userIntent || "").trim();
  const addresses = extractAddresses(raw);
  const textWithoutAddresses = raw.replace(/0x[a-fA-F0-9]{40}/g, " ");
  const action = ACTION_PATTERNS.find(([, pattern]) => pattern.test(raw))?.[0] || "unknown";
  const amountMatch = textWithoutAddresses.match(AMOUNT_PATTERN);
  const tokenMatch = raw.match(TOKEN_PATTERN);

  return {
    action,
    amount: amountMatch ? amountMatch[1] : null,
    token: tokenMatch ? tokenMatch[1].toUpperCase() : amountMatch?.[2]?.toUpperCase() || null,
    recipient: addresses[0] || null,
    addresses,
    raw
  };
}
