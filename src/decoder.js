import {
  addressFromWord,
  bigIntToString,
  hexToBigInt,
  normalizeHex,
  uintFromWord,
  wordAt
} from "./utils.js";

const SELECTORS = {
  "0xa9059cbb": "transfer(address,uint256)",
  "0x095ea7b3": "approve(address,uint256)",
  "0x23b872dd": "transferFrom(address,address,uint256)",
  "0x38ed1739": "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
  "0x8803dbee": "swapTokensForExactTokens(uint256,uint256,address[],address,uint256)",
  "0x7ff36ab5": "swapExactETHForTokens(uint256,address[],address,uint256)",
  "0x18cbafe5": "swapExactTokensForETH(uint256,uint256,address[],address,uint256)",
  "0x4a25d94a": "swapTokensForExactETH(uint256,uint256,address[],address,uint256)",
  "0xfb3bdb41": "swapETHForExactTokens(uint256,address[],address,uint256)",
  "0x414bf389": "exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))",
  "0xc04b8d59": "exactInput(bytes,address,uint256,uint256)",
  "0xdb3e2198": "exactOutputSingle((address,address,uint24,address,uint256,uint256,uint160))",
  "0xf28c0498": "exactOutput(bytes,address,uint256,uint256)",
  "0x24856bc3": "execute(bytes,bytes[])",
  "0x3593564c": "execute(bytes,bytes[],uint256)",
  "0xd0e30db0": "deposit()",
  "0xb6b55f25": "deposit(uint256)",
  "0x6e553f65": "deposit(uint256,address)",
  "0x2e1a7d4d": "withdraw(uint256)",
  "0xb460af94": "withdraw(uint256,address,address)",
  "0xba087652": "redeem(uint256,address,address)",
  "0xa694fc3a": "stake(uint256)",
  "0x3d18b912": "getReward()",
  "0x4e71d92d": "claim()",
  "0x617ba037": "supply(address,uint256,address,uint16)",
  "0x69328dec": "withdraw(address,uint256,address)",
  "0xa415bcad": "borrow(address,uint256,uint256,uint16,address)",
  "0x573ade81": "repay(address,uint256,uint256,address)"
};

/**
 * @param {import("./types.js").SafeTxRequest} request
 * @returns {import("./types.js").DecodedTransaction}
 */
export function decodeTransaction(request) {
  const value = hexToBigInt(request.value || "0x0");
  const data = normalizeHex(request.calldata || "0x");

  if (data === "0x" || data.length < 10) {
    return {
      kind: value > 0n ? "native_transfer" : "unknown_call",
      selector: "0x",
      functionName: value > 0n ? "native transfer" : "empty calldata",
      args: {
        to: request.to,
        value: bigIntToString(value)
      }
    };
  }

  const selector = data.slice(0, 10);

  if (selector === "0xa9059cbb") {
    return {
      kind: "erc20_transfer",
      selector,
      functionName: "transfer(address,uint256)",
      args: {
        token: request.to,
        recipient: addressFromWord(wordAt(data, 0)),
        amount: bigIntToString(uintFromWord(wordAt(data, 1)))
      }
    };
  }

  if (selector === "0x095ea7b3") {
    return {
      kind: "erc20_approve",
      selector,
      functionName: "approve(address,uint256)",
      args: {
        token: request.to,
        spender: addressFromWord(wordAt(data, 0)),
        amount: bigIntToString(uintFromWord(wordAt(data, 1)))
      }
    };
  }

  if (selector === "0x23b872dd") {
    return {
      kind: "erc20_transfer_from",
      selector,
      functionName: "transferFrom(address,address,uint256)",
      args: {
        token: request.to,
        owner: addressFromWord(wordAt(data, 0)),
        recipient: addressFromWord(wordAt(data, 1)),
        amount: bigIntToString(uintFromWord(wordAt(data, 2)))
      }
    };
  }

  if (SELECTORS[selector]) {
    return {
      kind: "known_call",
      selector,
      functionName: SELECTORS[selector],
      args: {
        contract: request.to,
        value: bigIntToString(value)
      }
    };
  }

  return {
    kind: "unknown_call",
    selector,
    functionName: "unknown",
    args: {
      contract: request.to,
      value: bigIntToString(value)
    }
  };
}
