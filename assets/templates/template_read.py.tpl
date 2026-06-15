import json
from pathlib import Path

request_path = Path("{{request_path}}")
request = json.loads(request_path.read_text())

print(json.dumps({
    "type": "pharos-safetx-read",
    "chainId": request["chainId"],
    "from": request["from"],
    "to": request["to"],
    "calldata": request.get("calldata", "0x"),
}, indent=2))
