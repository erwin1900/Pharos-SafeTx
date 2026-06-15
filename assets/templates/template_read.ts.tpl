import fs from "node:fs";

type SafeTxReadView = {
  type: "pharos-safetx-read";
  chainId: number;
  from: string;
  to: string;
  calldata: string;
};

const requestPath = "{{request_path}}";
const request = JSON.parse(fs.readFileSync(requestPath, "utf8"));

const view: SafeTxReadView = {
  type: "pharos-safetx-read",
  chainId: request.chainId,
  from: request.from,
  to: request.to,
  calldata: request.calldata || "0x"
};

console.log(JSON.stringify(view, null, 2));
