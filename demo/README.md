# Demo Script: Pharos SafeTx

This is a 90-second demo flow for DoraHacks or a short screen recording.

## Scene 1: Hook

AI agents can build transactions and move value, but they need a final safety
check before wallet handoff. SafeTx asks one question:

> Does this exact transaction match what the user asked the agent to do?

## Scene 2: User Intent

Show the scenario:

```text
User: Swap 10 USDC to PHRS on Pharos.
```

Then show the transaction payload an agent is about to hand off:

```bash
npm run demo:skill
```

The report shows the calldata is actually:

```text
approve(address,uint256) with uint256.max
```

## Scene 3: SafeTx Outputs a Safety Report

Point to the result:

```text
Decision: BLOCK
Risk score: 98/100
Decoded function: approve(address,uint256)
```

Explain the reasons:

- The user asked for a swap, not an unlimited approval.
- The spender is not trusted.
- The approval amount exceeds the user intent.

## Scene 4: Safer Alternative

Show the safer alternative:

```text
Do not continue the wallet handoff for this transaction.
Replace unlimited approval with a limited approval close to 10 USDC for a trusted spender.
```

## Scene 5: Skill Test Result

The report ends with:

```text
PASS: SafeTx prevented the agent from handing off a risky transaction.
```

## Scene 6: Cross-Platform Skill

Show that SafeTx is portable:

```bash
npm run analyze -- examples/warn-infinite-approval.json
```

Close with:

> SafeTx is a transaction payload-review firewall for AI agents. It works through
> SKILL.md, JSON Schema, and the local CLI.
