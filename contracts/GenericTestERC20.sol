//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract GenericTestERC20 is ERC20 {
  constructor() ERC20('Generic test token that mints 1000 to msg.sender', 'TEST') public {
        _mint(msg.sender, 100000000000000000000);
    }
}
