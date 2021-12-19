pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract Auditor is Ownable {
    mapping (address => string) public names;

    constructor() Ownable() {}

    function approve(address addr, string memory newName) public onlyOwner {
      names[addr] = newName;
    }

    function revertApproval(address addr) public onlyOwner {
      names[addr] = 'reverted';
    }

}
