// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CMToken
 * @dev ChainMind utility and governance token
 * @notice ERC-20 token used for task payments, agent staking, and governance voting
 */
contract CMToken is ERC20, ERC20Burnable, Ownable {
    uint256 public constant INITIAL_SUPPLY = 100_000_000 * 10**18; // 100M tokens

    /**
     * @dev Constructor mints the total supply to the deployer
     */
    constructor() ERC20("ChainMind Token", "CMT") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    /**
     * @dev Allows the owner to mint additional tokens (for testing/rewards pool)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
