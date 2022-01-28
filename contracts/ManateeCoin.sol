pragma solidity ^0.8.0;

import "hardhat/console.sol";

// import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "contracts/ERC20Dividends.sol";
// import "@openzeppelin/contracts/finance/PaymentSplitter.sol";

contract ManateeToken is ERC20Dividends {
    constructor() { //0xe6b8a5CF854791412c1f6EFC7CAf629f5Df1c747
      ERC20Dividends.initERC20Dividends('Manatee Protocol', 'MANAT', 1000000000, msg.sender);
      // _mint(0x8464135c8F25Da09e49BC8782676a84730C318bC, 10000); //placeholder address for other tokenholders of course
    }
}
