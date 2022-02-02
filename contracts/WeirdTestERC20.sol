//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract WeirdTestERC20 is ERC20 {
    uint customTotalSupply;
  constructor() ERC20('Weird test token that mints 1000 to msg.sender and can be reset or changed by anyone', 'TEST') public {
        customTotalSupply = 100000000000000000000;
        _mint(msg.sender, 100000000000000000000);
    }
    // like calling the constructor again, except it doesn't change balances which are stored in the hashmap. This is obviously a huge problem for a real token
    function unsafeReinitialize() public {
      customTotalSupply = 100000000000000000000;
      _mint(msg.sender, 100000000000000000000);
    }
    // anyone can mint :)
    function mintTo(address recipient, uint amount) public {
      customTotalSupply = amount;
      _mint(recipient, amount);
    }
    function burnFrom(address loser, uint amount) public{
      customTotalSupply -= amount;
      _burn(loser, amount);
    }
    function totalSupply() public override view returns (uint) {
      return customTotalSupply;
    }
}
