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
    return decodeKnownCall(selector, request, data, value) || knownCall(selector, request, value);
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

function decodeKnownCall(selector, request, data, value) {
  if (selector === "0x38ed1739") {
    return tryDecode(() =>
      knownCall(selector, request, value, {
        amount: uintString(data, 0),
        minimumReceived: uintString(data, 1),
        ...decodePath(data, 2),
        recipient: addressAt(data, 3),
        deadline: uintString(data, 4)
      })
    );
  }

  if (selector === "0x8803dbee") {
    return tryDecode(() =>
      knownCall(selector, request, value, {
        expectedOutput: uintString(data, 0),
        amount: uintString(data, 1),
        ...decodePath(data, 2),
        recipient: addressAt(data, 3),
        deadline: uintString(data, 4)
      })
    );
  }

  if (selector === "0x7ff36ab5") {
    return tryDecode(() =>
      knownCall(selector, request, value, {
        minimumReceived: uintString(data, 0),
        ...decodePath(data, 1),
        recipient: addressAt(data, 2),
        deadline: uintString(data, 3)
      })
    );
  }

  if (selector === "0x18cbafe5") {
    return tryDecode(() =>
      knownCall(selector, request, value, {
        amount: uintString(data, 0),
        minimumReceived: uintString(data, 1),
        ...decodePath(data, 2),
        recipient: addressAt(data, 3),
        deadline: uintString(data, 4)
      })
    );
  }

  if (selector === "0x4a25d94a") {
    return tryDecode(() =>
      knownCall(selector, request, value, {
        expectedOutput: uintString(data, 0),
        amount: uintString(data, 1),
        ...decodePath(data, 2),
        recipient: addressAt(data, 3),
        deadline: uintString(data, 4)
      })
    );
  }

  if (selector === "0xfb3bdb41") {
    return tryDecode(() =>
      knownCall(selector, request, value, {
        expectedOutput: uintString(data, 0),
        ...decodePath(data, 1),
        recipient: addressAt(data, 2),
        deadline: uintString(data, 3)
      })
    );
  }

  if (selector === "0x414bf389") {
    return tryDecode(() => decodeExactInputSingle(selector, request, data, value));
  }

  if (selector === "0xdb3e2198") {
    return tryDecode(() => decodeExactOutputSingle(selector, request, data, value));
  }

  if (selector === "0xc04b8d59") {
    return tryDecode(() =>
      knownCall(selector, request, value, {
        recipient: addressAt(data, 1),
        deadline: uintString(data, 2),
        amount: uintString(data, 3),
        minimumReceived: uintString(data, 4)
      })
    );
  }

  if (selector === "0xf28c0498") {
    return tryDecode(() =>
      knownCall(selector, request, value, {
        recipient: addressAt(data, 1),
        deadline: uintString(data, 2),
        expectedOutput: uintString(data, 3),
        amount: uintString(data, 4)
      })
    );
  }

  if (selector === "0xb6b55f25") {
    return tryDecode(() => knownCall(selector, request, value, { amount: uintString(data, 0) }));
  }

  if (selector === "0x6e553f65") {
    return tryDecode(() =>
      knownCall(selector, request, value, {
        amount: uintString(data, 0),
        recipient: addressAt(data, 1)
      })
    );
  }

  if (selector === "0x2e1a7d4d") {
    return tryDecode(() => knownCall(selector, request, value, { amount: uintString(data, 0) }));
  }

  if (selector === "0xb460af94") {
    return tryDecode(() =>
      knownCall(selector, request, value, {
        amount: uintString(data, 0),
        recipient: addressAt(data, 1),
        owner: addressAt(data, 2)
      })
    );
  }

  if (selector === "0xba087652") {
    return tryDecode(() =>
      knownCall(selector, request, value, {
        amount: uintString(data, 0),
        recipient: addressAt(data, 1),
        owner: addressAt(data, 2)
      })
    );
  }

  if (selector === "0xa694fc3a") {
    return tryDecode(() => knownCall(selector, request, value, { amount: uintString(data, 0) }));
  }

  if (selector === "0x617ba037") {
    return tryDecode(() =>
      knownCall(selector, request, value, {
        token: addressAt(data, 0),
        amount: uintString(data, 1),
        recipient: addressAt(data, 2),
        referralCode: uintString(data, 3)
      })
    );
  }

  if (selector === "0x69328dec") {
    return tryDecode(() =>
      knownCall(selector, request, value, {
        token: addressAt(data, 0),
        amount: uintString(data, 1),
        recipient: addressAt(data, 2)
      })
    );
  }

  if (selector === "0xa415bcad") {
    return tryDecode(() =>
      knownCall(selector, request, value, {
        token: addressAt(data, 0),
        amount: uintString(data, 1),
        rateMode: uintString(data, 2),
        referralCode: uintString(data, 3),
        recipient: addressAt(data, 4)
      })
    );
  }

  if (selector === "0x573ade81") {
    return tryDecode(() =>
      knownCall(selector, request, value, {
        token: addressAt(data, 0),
        amount: uintString(data, 1),
        rateMode: uintString(data, 2),
        recipient: addressAt(data, 3)
      })
    );
  }

  return null;
}

function knownCall(selector, request, value, args = {}) {
  return {
    kind: "known_call",
    selector,
    functionName: SELECTORS[selector],
    args: {
      contract: request.to,
      value: bigIntToString(value),
      ...args
    }
  };
}

function tryDecode(decode) {
  try {
    return decode();
  } catch {
    return null;
  }
}

function addressAt(data, index) {
  return addressFromWord(wordAt(data, index));
}

function uintString(data, index) {
  return bigIntToString(uintFromWord(wordAt(data, index)));
}

function decodePath(data, offsetWordIndex) {
  const addresses = addressArrayAt(data, offsetWordIndex);
  const result = {
    path: addresses.join(" -> ")
  };
  if (addresses[0]) result.token = addresses[0];
  if (addresses[addresses.length - 1]) result.outputToken = addresses[addresses.length - 1];
  return result;
}

function addressArrayAt(data, offsetWordIndex) {
  const offset = uintFromWord(wordAt(data, offsetWordIndex));
  if (offset % 32n !== 0n) throw new Error("ABI dynamic array offset is not word-aligned");

  const lengthWordIndex = Number(offset / 32n);
  if (!Number.isSafeInteger(lengthWordIndex)) throw new Error("ABI dynamic array offset is too large");

  const length = Number(uintFromWord(wordAt(data, lengthWordIndex)));
  if (!Number.isSafeInteger(length)) throw new Error("ABI dynamic array length is too large");

  const addresses = [];
  for (let index = 0; index < length; index += 1) {
    addresses.push(addressAt(data, lengthWordIndex + 1 + index));
  }
  return addresses;
}

function decodeExactInputSingle(selector, request, data, value) {
  const hasDeadline = wordCount(data) >= 8;
  return knownCall(selector, request, value, {
    token: addressAt(data, 0),
    outputToken: addressAt(data, 1),
    fee: uintString(data, 2),
    recipient: addressAt(data, 3),
    ...(hasDeadline ? { deadline: uintString(data, 4) } : {}),
    amount: uintString(data, hasDeadline ? 5 : 4),
    minimumReceived: uintString(data, hasDeadline ? 6 : 5),
    sqrtPriceLimitX96: uintString(data, hasDeadline ? 7 : 6)
  });
}

function decodeExactOutputSingle(selector, request, data, value) {
  const hasDeadline = wordCount(data) >= 8;
  return knownCall(selector, request, value, {
    token: addressAt(data, 0),
    outputToken: addressAt(data, 1),
    fee: uintString(data, 2),
    recipient: addressAt(data, 3),
    ...(hasDeadline ? { deadline: uintString(data, 4) } : {}),
    expectedOutput: uintString(data, hasDeadline ? 5 : 4),
    amount: uintString(data, hasDeadline ? 6 : 5),
    sqrtPriceLimitX96: uintString(data, hasDeadline ? 7 : 6)
  });
}

function wordCount(data) {
  return Math.floor((data.length - 10) / 64);
}
