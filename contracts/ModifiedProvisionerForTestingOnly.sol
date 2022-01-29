pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "contracts/Book.sol"; //book interface


// Should be created upon book initialization by the book
contract ModifiedProvisionerForTestingOnly is Initializable {
    struct RentalContract {
      uint256 start;
      uint256 expiration;
    }
    //note : users should be notified the titles in their ebook libraries are publicly accessible
    //even though this stores more data than needed (an array of all owners can store all the owners), a mapping is far more gas-efficient to search through
    mapping(address => bool) public owners;
    mapping(address => RentalContract) public renters;

    address payable public bookAddr;
    address payable public manatAddr;
    Book private book;

    function initProvisioner(address payable bookAddr_) public initializer {
        bookAddr = bookAddr_;
        book = Book(bookAddr);
        manatAddr = payable(0x87b6e03b0D57771940D7cC9E92531B6217364B3E);
    }

    function getFavoriteAnimal() public view returns (string memory){
      return "manatee";
    }


}
