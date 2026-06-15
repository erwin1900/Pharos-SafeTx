/**
 * @typedef {"transfer" | "approve" | "swap" | "stake" | "claim" | "deposit" | "withdraw" | "borrow" | "repay" | "unknown"} IntentAction
 * @typedef {"native_transfer" | "erc20_transfer" | "erc20_approve" | "erc20_transfer_from" | "known_call" | "unknown_call"} DecodedKind
 * @typedef {"ALLOW" | "WARN" | "BLOCK"} Decision
 *
 * @typedef {Object} SafeTxRequest
 * @property {string} user_intent
 * @property {number} chainId
 * @property {string} from
 * @property {string} to
 * @property {string=} value
 * @property {string=} calldata
 * @property {"en" | "zh" | "zh-CN" | "bilingual"=} language
 * @property {Record<string, string>=} addressBook
 * @property {Record<string, number>=} tokenDecimals
 * @property {string[]=} trustedSpenders
 * @property {string[]=} blockedAddresses
 * @property {SafeTxPolicy=} policy
 *
 * @typedef {Object} SafeTxPolicy
 * @property {string[]=} allowedTargets
 * @property {string[]=} allowedRecipients
 * @property {string[]=} allowedSpenders
 * @property {string|null=} maxNativeValue
 * @property {Record<string, string>=} maxTokenAmounts
 *
 * @typedef {Object} ParsedIntent
 * @property {IntentAction} action
 * @property {string|null} amount
 * @property {string|null} token
 * @property {string|null} recipient
 * @property {string[]} addresses
 * @property {string} raw
 *
 * @typedef {Object} DecodedTransaction
 * @property {DecodedKind} kind
 * @property {string} selector
 * @property {string} functionName
 * @property {Record<string, string>} args
 *
 * @typedef {Object} RiskFinding
 * @property {"low" | "medium" | "high" | "critical"} severity
 * @property {string} code
 * @property {string} message
 * @property {number} score
 *
 * @typedef {Object} SafeTxResult
 * @property {Decision} decision
 * @property {number} risk_score
 * @property {ParsedIntent} intent
 * @property {DecodedTransaction} transaction
 * @property {RiskFinding[]} findings
 * @property {string[]} reasons
 * @property {string} agent_action
 * @property {string} safer_alternative
 */

export {};
