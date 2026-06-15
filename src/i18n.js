export const ZH_MESSAGES = {
  UNEXPECTED_CHAIN: "交易链 ID 不在已配置的 Pharos 网络中，请确认目标网络是否正确。",
  BLOCKED_TARGET: "交易目标地址在阻止列表中。",
  POLICY_TARGET_NOT_ALLOWED: "交易目标不在已配置的目标地址白名单中。",
  POLICY_NATIVE_LIMIT_EXCEEDED: "Native token 转账金额超过了单笔策略限额。",
  INTENT_ACTION_MISMATCH: "用户意图和实际交易动作不一致。",
  UNCLEAR_USER_INTENT: "用户意图不够明确，不适合自动签名，请先请求用户澄清。",
  INTENT_ADDRESS_MISMATCH: "交易目标或收款人均未匹配用户意图中提到的地址。",
  POLICY_RECIPIENT_NOT_ALLOWED: "交易收款人不在已配置的收款人白名单中。",
  INFINITE_APPROVAL: "交易授予无限代币授权，可能导致全部代币余额被转走。",
  POLICY_SPENDER_NOT_ALLOWED: "授权 spender 不在已配置的 spender 白名单中。",
  UNTRUSTED_SPENDER: "授权 spender 不在 SafeTx 的可信 spender 列表中。",
  UNEXPECTED_APPROVAL: "用户意图没有明确要求代币授权。",
  UNKNOWN_CALLDATA: "SafeTx 无法识别该函数 selector。",
  ERC20_TRANSFER_SELECTOR: "ERC20 transfer 会移动代币，请确认收款人、token、金额和策略限额。",
  ERC20_APPROVAL_SELECTOR: "ERC20 approve 会改变代币授权额度，请确认 spender 和金额，优先使用有限授权。",
  ERC20_TRANSFER_FROM_SELECTOR: "ERC20 transferFrom 会基于 allowance 转移代币，请确认 owner、recipient、授权来源和金额。",
  ERC2612_PERMIT_SELECTOR: "ERC2612 permit 是离线授权签名，请在签名前确认 owner、spender、value 和 deadline。",
  PERMIT2_APPROVE_SELECTOR: "Permit2 approve 是高关注 selector，请核对 token、spender、金额和过期时间。Permit2 授权经常被钓鱼流程滥用。",
  INCREASE_ALLOWANCE_SELECTOR: "increaseAllowance 会增加现有授权额度，请确认这是用户明确要求的操作。",
  NFT_OPERATOR_APPROVAL_SELECTOR: "setApprovalForAll 可能授予某个 operator 控制整组 NFT 的权限，请确认 collection 和 operator。",
  SWAP_EXACT_TOKENS_FOR_TOKENS_SELECTOR: "DEX swap 会执行 token 兑换，请确认 router、路径、recipient、amountOutMin、滑点和 deadline。",
  SWAP_TOKENS_FOR_EXACT_TOKENS_SELECTOR: "DEX 精确输出 swap 可能消耗最多输入金额，请确认最大输入、路径、recipient、滑点和 deadline。",
  SWAP_EXACT_ETH_FOR_TOKENS_SELECTOR: "Native 到 token 的 swap 会消耗 native value，请确认路径、recipient、amountOutMin、滑点和 deadline。",
  SWAP_EXACT_TOKENS_FOR_ETH_SELECTOR: "Token 到 native 的 swap 会改变资产形态，请确认输入 token、输出路径、recipient、amountOutMin 和 deadline。",
  SWAP_TOKENS_FOR_EXACT_ETH_SELECTOR: "Token 精确换出 native 的 swap 可能消耗最多输入金额，请确认最大输入、recipient、滑点和 deadline。",
  SWAP_ETH_FOR_EXACT_TOKENS_SELECTOR: "Native 精确换出 token 的 swap 会消耗 native value，请确认输出目标、路径、recipient 和 deadline。",
  UNISWAP_V3_EXACT_INPUT_SINGLE_SELECTOR: "Uniswap V3 exactInputSingle 需要确认 tokenIn、tokenOut、fee tier、recipient、amountIn、amountOutMinimum 和价格限制。",
  UNISWAP_V3_EXACT_INPUT_SELECTOR: "Uniswap V3 exactInput 使用 bytes 路径，请先解码路径并确认 route、recipient、amountIn 和 amountOutMinimum。",
  UNISWAP_V3_EXACT_OUTPUT_SINGLE_SELECTOR: "Uniswap V3 exactOutputSingle 需要确认 exact output、最大输入、recipient、fee tier 和价格限制。",
  UNISWAP_V3_EXACT_OUTPUT_SELECTOR: "Uniswap V3 exactOutput 使用 bytes 路径，请先解码路径并确认 exact output、最大输入和 recipient。",
  UNIVERSAL_ROUTER_EXECUTE_SELECTOR: "Universal Router execute 可能打包 swap、transfer、approval 等多步操作，请先解码内部 commands。",
  UNIVERSAL_ROUTER_EXECUTE_DEADLINE_SELECTOR: "Universal Router execute 带 deadline，仍需解码内部 commands 并确认过期时间。",
  NATIVE_DEPOSIT_SELECTOR: "deposit() 通常代表 native 包装或存入，请确认目标合约和 native value。",
  VAULT_DEPOSIT_SELECTOR: "Vault deposit 会把资产存入协议，请确认 vault、token、金额和策略限额。",
  ERC4626_DEPOSIT_SELECTOR: "ERC4626 deposit 会把资产存入 vault 并铸造 shares，请确认 receiver 和预期 shares。",
  VAULT_WITHDRAW_SELECTOR: "Vault withdraw 会取出或解除质押资产，请确认金额、recipient 行为和等待期。",
  ERC4626_WITHDRAW_SELECTOR: "ERC4626 withdraw 会从 vault 取出资产，请确认 assets、receiver、owner 和策略。",
  ERC4626_REDEEM_SELECTOR: "ERC4626 redeem 会用 shares 赎回资产，请确认 shares、receiver、owner 和预期输出。",
  STAKE_SELECTOR: "stake 会锁定或质押资产，请确认 staking 合约、token、金额、锁定期和退出条件。",
  GET_REWARD_SELECTOR: "getReward 应该只是领取奖励，请确认合约可信且没有附带非预期 value 或授权。",
  CLAIM_SELECTOR: "claim 应该只是领取资产或奖励，请确认目标合约可信且没有隐藏的资产移动。",
  LENDING_SUPPLY_SELECTOR: "lending supply 会把资产存入借贷协议，请确认 asset、amount、onBehalfOf 和协议目标。",
  LENDING_WITHDRAW_SELECTOR: "lending withdraw 会从借贷协议取出资产，请确认 asset、amount、recipient 和协议目标。",
  LENDING_BORROW_SELECTOR: "borrow 会创建债务并影响清算风险，请确认资产、金额、利率模式、onBehalfOf 和抵押影响。",
  LENDING_REPAY_SELECTOR: "repay 会偿还债务，请确认还款资产、金额、利率模式和 beneficiary 地址。",
  UNEXPECTED_NATIVE_VALUE: "交易携带 native value，但用户意图没有明确授权该转账。",
  AMOUNT_EXCEEDS_INTENT: "解码出的交易金额超过了用户意图中的金额。",
  POLICY_TOKEN_LIMIT_EXCEEDED: "交易代币金额超过了已配置的单笔策略限额。"
};

const ZH_ACTIONS = {
  ALLOW: "如果当前用户会话允许自动执行，则可以继续签名或执行。",
  WARN: "暂停签名，并在继续前请求用户明确确认。",
  BLOCK: "不要签名或提交这笔交易。"
};

export function normalizeLanguage(language) {
  if (language === "zh" || language === "zh-CN" || language === "cn") return "zh";
  if (language === "bilingual" || language === "both" || language === "zh-en") return "bilingual";
  return "en";
}

export function localizeResult(result, language) {
  const mode = normalizeLanguage(language);
  if (mode === "en") return result;

  const findings = result.findings.map((item) => ({
    ...item,
    message: localizeFinding(item, mode)
  }));

  return {
    ...result,
    findings,
    reasons: findings.map((item) => item.message),
    agent_action: localizeText(result.agent_action, ZH_ACTIONS[result.decision], mode),
    safer_alternative: localizeText(
      result.safer_alternative,
      saferAlternativeZh(result.transaction, result.intent, result.decision),
      mode
    )
  };
}

function localizeFinding(finding, mode) {
  const zh = ZH_MESSAGES[finding.code] || "SafeTx 检测到交易风险，请在签名前人工确认。";
  return localizeText(finding.message, zh, mode);
}

function localizeText(en, zh, mode) {
  if (mode === "zh") return zh;
  if (mode === "bilingual") return `${en} / ${zh}`;
  return en;
}

function saferAlternativeZh(transaction, intent, decision) {
  if (decision === "ALLOW") return "当前请求不需要更安全的替代方案。";
  if (transaction.kind === "erc20_approve") {
    return intent.amount
      ? `将无限授权替换为接近 ${intent.amount} ${intent.token || "tokens"} 的有限授权，并确认 spender 可信。`
      : "使用有限授权金额，并在重试前确认 spender 是否可信。";
  }
  if (transaction.kind === "unknown_call") {
    return "先解码合约 ABI，或通过已验证的 Pharos 协议适配器生成交易后再签名。";
  }
  if (transaction.args?.amount) {
    return "降低交易金额或调整策略限额，然后重新运行 SafeTx。";
  }
  return "根据原始用户意图重新生成交易，并在签名前重新运行 SafeTx。";
}
