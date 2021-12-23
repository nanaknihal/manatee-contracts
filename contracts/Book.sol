pragma solidity ^0.8.0;

import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "contracts/Provisioner.sol";
import "contracts/PaymentSplitterOverrideShares.sol";
// import "@openzeppelin/contracts/finance/PaymentSplitter.sol";

contract Book is ERC20, Ownable, PaymentSplitterOverrideShares { //PaymentSplitterOverrideShares
    string public _name;
    uint public price;
    address public priceDenomination;
    mapping(uint256 => uint256) public rentalPeriods; //maps number of days to price, e.g. 30 day rental to 15000000 USDC
    //string public bookHash; //bookHashes are not used on-chain; they are mostly for quasi-IP purposes are stored as strings to allow choice of the hash algorithm.
    mapping (string => string) public bookVersions; //maps hash of a book to link of its content
    bool public resaleEnabled;
    Provisioner public provisioner;

    constructor(string memory name_, string memory symbol_, uint supply_, uint price_, address priceDenomination_, bool resaleEnabled_, address payable manatAddr) PaymentSplitterOverrideShares() Ownable() ERC20(name_, symbol_) {
        _name = name_;
        price = price_;
        priceDenomination = priceDenomination_;
        resaleEnabled = resaleEnabled_;
        provisioner = new Provisioner(payable(address(this)), manatAddr);
        _mint(msg.sender, supply_);
        _transferOwnership(msg.sender);
        //throw;//('please test addRentalPeriod and removeRentalPeriod');
    }

    function setPriceDenomination(address newPriceDenomination) public onlyOwner {
      priceDenomination = newPriceDenomination;
    }

    function setPrice(uint newPrice) public onlyOwner {
      price = newPrice;
    }

    function addRentalPeriod(uint256 numDays, uint256 price_) public onlyOwner {
      require(numDays > 0, "cannot have rentals for 0 days");
      require(price_ > 0, "cannot have rentals priced at 0");
      rentalPeriods[numDays] = price_;
    }

    function removeRentalPeriod(uint256 numDays) public onlyOwner {
      delete rentalPeriods[numDays];
    }

    // adds or updates a version of the book. versions are indexed by the books hash and point to an external resource (such as on IPFS, Filecoin, Storj, or simple web2)
    function setBookVersion(string memory bookHash, string memory bookLink) public onlyOwner {
      bookVersions[bookHash] = bookLink;
    }

    function removeBookVersion(string memory bookHash) public onlyOwner {
      delete bookVersions[bookHash];
    }

    function enableResale() public onlyOwner {
      resaleEnabled = true;
    }

    function disableResale() public onlyOwner {
      resaleEnabled = false;
    }

    // deprecated
    // function setBookHash(string memory newBookHash) public onlyOwner {
    //   bookHash = newBookHash;
    // }

    function getShares(address account) public view override returns (uint256) {
        return balanceOf(account);

      }

    function getTotalShares() public view override returns (uint256) {
        return totalSupply();
      }


}
