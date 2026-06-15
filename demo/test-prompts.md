# SafeTx Skill Test Prompts

Use these prompts in Codex, Claude Code, or another agent runtime to verify that
Pharos SafeTx behaves like a portable Agent Skill.

## 1. Run the bundled safety report

```text
Use Pharos SafeTx to run the demo safety report.
```

Expected behavior:

- Agent runs `npm run demo:skill`
- Output contains `Pharos SafeTx Safety Scan Report`
- Decision is `BLOCK`
- Report explains the unlimited approval risk

## 2. Analyze a safe transfer

```text
Use Pharos SafeTx to analyze examples/allow-transfer.json and explain whether the agent should sign it.
```

Expected behavior:

- Agent runs `npm run analyze -- examples/allow-transfer.json`
- Decision is `ALLOW`
- Decoded function is `transfer(address,uint256)`

## 3. Analyze a dangerous approval

```text
Use Pharos SafeTx to analyze examples/warn-infinite-approval.json and explain why it is blocked.
```

Expected behavior:

- Agent runs `npm run analyze -- examples/warn-infinite-approval.json`
- Decision is `BLOCK`
- Findings include `INFINITE_APPROVAL` and `UNTRUSTED_SPENDER`

## 4. Analyze a Permit2 selector

```text
Use Pharos SafeTx to analyze examples/warn-permit2-selector.json and explain the Permit2 risk.
```

Expected behavior:

- Agent runs `npm run analyze -- examples/warn-permit2-selector.json`
- Decision is `BLOCK`
- Findings include `PERMIT2_APPROVE_SELECTOR`

## 5. Verify the portable CLI interface

```text
Use Pharos SafeTx to verify its CLI interface.
```

Expected behavior:

- Agent runs a CLI example
- CLI output includes a SafeTx `decision`

## 6. Analyze a pasted transaction object

```text
Use Pharos SafeTx to check this transaction before signing:
{
  "user_intent": "Transfer 100 USDC to 0x2222222222222222222222222222222222222222",
  "chainId": 688689,
  "from": "0x146b605c8b371d5b50c3ea560fd1a2081aee7557",
  "to": "0xcfc8330f4bcab529c625d12781b1c19466a9fc8b",
  "value": "0x0",
  "calldata": "0xa9059cbb00000000000000000000000022222222222222222222222222222222222222220000000000000000000000000000000000000000000000000000000005f5e100",
  "tokenDecimals": {
    "USDC": 6,
    "0xcfc8330f4bcab529c625d12781b1c19466a9fc8b": 6
  }
}
```

Expected behavior:

- Agent passes the JSON through stdin or a temporary request file
- Decision is `ALLOW`
- Agent does not claim to sign or submit anything
