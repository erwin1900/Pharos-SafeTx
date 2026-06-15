import json
import subprocess
from pathlib import Path

request_path = Path("{{request_path}}")
result = subprocess.run(
    ["npm", "run", "analyze", "--", str(request_path)],
    check=True,
    capture_output=True,
    text=True,
)

print(result.stdout)
decision = json.loads(result.stdout)["decision"]
if decision != "ALLOW":
    raise SystemExit(f"SafeTx refused write handoff: {decision}")

# SafeTx never signs or broadcasts. The integrating agent must still enforce
# its own signer, confirmation, and policy checks.
