import test from "node:test";
import assert from "node:assert/strict";
import { validateSafeTxRequest, ValidationError } from "../src/validation.js";

const validRequest = {
  user_intent: "Transfer 1 USDC to 0x2222222222222222222222222222222222222222",
  chainId: 688689,
  from: "0x146b605c8b371d5b50c3ea560fd1a2081aee7557",
  to: "0xcfc8330f4bcab529c625d12781b1c19466a9fc8b",
  value: "0x0",
  calldata: "0x"
};

test("normalizes valid SafeTx requests", () => {
  const request = validateSafeTxRequest({
    ...validRequest,
    trustedSpenders: ["0x4444444444444444444444444444444444444444"],
    addressBook: {
      router: "0x5555555555555555555555555555555555555555"
    }
  });

  assert.equal(request.chainId, 688689);
  assert.deepEqual(request.trustedSpenders, ["0x4444444444444444444444444444444444444444"]);
  assert.equal(request.addressBook.router, "0x5555555555555555555555555555555555555555");
});

test("normalizes policy whitelists and limits", () => {
  const request = validateSafeTxRequest({
    ...validRequest,
    policy: {
      allowedTargets: ["0xcfc8330f4bcab529c625d12781b1c19466a9fc8b"],
      allowedRecipients: ["0x2222222222222222222222222222222222222222"],
      allowedSpenders: ["0x5555555555555555555555555555555555555555"],
      maxNativeValue: "0x0",
      maxTokenAmounts: {
        USDC: "100"
      }
    }
  });

  assert.deepEqual(request.policy.allowedTargets, ["0xcfc8330f4bcab529c625d12781b1c19466a9fc8b"]);
  assert.equal(request.policy.maxNativeValue, "0x0");
  assert.equal(request.policy.maxTokenAmounts.usdc, "100");
});

test("normalizes supported output languages", () => {
  const request = validateSafeTxRequest({
    ...validRequest,
    language: "zh-CN"
  });

  assert.equal(request.language, "zh");
});

test("rejects malformed addresses and calldata", () => {
  assert.throws(
    () =>
      validateSafeTxRequest({
        ...validRequest,
        from: "invalid",
        calldata: "0x123"
      }),
    ValidationError
  );

  assert.throws(
    () =>
      validateSafeTxRequest({
        ...validRequest,
        calldata: "0xzz"
      }),
    /calldata must be valid hex: Hex value must contain only hexadecimal characters/
  );
});

test("requires user intent, from, to, and chainId", () => {
  assert.throws(
    () =>
      validateSafeTxRequest({
        user_intent: "",
        from: "",
        to: ""
      }),
    /user_intent.*from.*to.*chainId/
  );
});
