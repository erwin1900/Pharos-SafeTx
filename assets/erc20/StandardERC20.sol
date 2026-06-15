// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice ERC20 ABI reference used by SafeTx for calldata reasoning.
/// @dev This file is an interface/reference asset, not a deployment target.
interface StandardERC20 {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}
