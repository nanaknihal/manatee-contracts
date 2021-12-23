pragma solidity ^0.8.0;

import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "contracts/PaymentSplitterOverrideShares.sol";
// import "@openzeppelin/contracts/finance/PaymentSplitter.sol";

contract ManateeToken is ERC20, PaymentSplitterOverrideShares {
    constructor() PaymentSplitterOverrideShares() ERC20('Manatee Protocol', 'MANAT') {
        _mint(msg.sender, 10000);
        // _mint(0x8464135c8F25Da09e49BC8782676a84730C318bC, 10000); //placeholder address for other tokenholders of course
    }

    function getShares(address account) public view override returns (uint256) {
        return balanceOf(account);

      }

    function getTotalShares() public view override returns (uint256) {
        return totalSupply();
      }


}
