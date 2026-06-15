import fs from "node:fs";

const requestPath = "{{request_path}}";
const request = JSON.parse(fs.readFileSync(requestPath, "utf8"));

console.log(JSON.stringify({
  type: "pharos-safetx-read",
  chainId: request.chainId,
  from: request.from,
  to: request.to,
  calldata: request.calldata || "0x"
}, null, 2));
