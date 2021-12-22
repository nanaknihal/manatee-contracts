pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "contracts/Book.sol"; //book interface


// Should be created upon book initialization by the book
contract Provisioner {
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

    constructor(address payable bookAddr_, address payable manatAddr_) {
        bookAddr = bookAddr_;
        book = Book(bookAddr);
        manatAddr = manatAddr_;
    }

    //will charge the book's price plus token 'tip' to marketplace
    function buy(address marketplaceAddr, uint256 marketplaceTip, address marketplaceTipDenomination) public {
      buy(msg.sender, marketplaceAddr, marketplaceTip, marketplaceTipDenomination);
    }

    //will charge the book's price plus token 'tip' to marketplace, overloaded to buy a book for someone/something else
    // function buy(address recipient, address marketplaceAddr, uint256 marketplaceTip, address marketplaceTipDenomination) public {
    //   _buy(recipient, marketplaceAddr, marketplaceTip, marketplaceTipDenomination);
    // }

    function buy(address recipient, address marketplaceAddr, uint256 marketplaceTip, address marketplaceTipDenomination) public {
      require(!owners[recipient], "recipient already owns a copy");
      IERC20 priceToken = IERC20(book.priceDenomination());
      IERC20 tipToken = IERC20(marketplaceTipDenomination);
      uint256 fee = book.price() / 10; //DON'T HARDCODE?! OR HARDCODE
      require(priceToken.transferFrom(msg.sender, bookAddr, book.price() - fee), 'Need to pay enough for book');
      require(priceToken.transferFrom(msg.sender, manatAddr, fee), 'Need to pay enough for book'); //DON'T HARDCODE?! OR HARDCODE
      require(tipToken.transferFrom(msg.sender, marketplaceAddr, marketplaceTip), 'Need to pay enough to marketplace');

      owners[recipient] = true;
    }

    function rent(uint256 numDays) public {
      uint256 price = book.rentalPeriods(numDays);
      require(price > 0, "invalid rental period");
      require(!owners[msg.sender], "you already own the book you are trying to rent");
      IERC20 token = IERC20(book.priceDenomination());
      require(token.transferFrom(msg.sender, address(this), price));
      _rentIndiscriminantly(msg.sender, numDays * 1 days);
    }

    // function rent(address addr, uint256 numDays) public {
    //   uint256 price = book.rentalPeriods()[numDays];
    //   require(price, "invalid rental period");
    //   IERC20 token = IERC20(book.priceDenomination());
    //   require(token.transferFrom(msg.sender, address(this), price));
    //   _rent(addr, numDays);
    // }

    // internal method to grants access without checking payment was successful
    function _rentIndiscriminantly(address addr, uint256 duration) private {
      //if there's already a rental, extend it:
      if(renters[addr].expiration > block.timestamp) {
        renters[addr].expiration += duration;
      } else {
        renters[addr] = RentalContract({
          start: block.timestamp,
          expiration: block.timestamp + duration
        });
      }

    }

    function transferPurchase(address to) public {
      require(book.resaleEnabled(), "owner of book contract has not enabled resale");
      require(owners[msg.sender], "you must own the book before transferring your ownership");
      require(!(owners[to]), "cannot transfer to a recipient who already owns the book");
      owners[msg.sender] = false;
      owners[to] = true;
    }

    function transferRental(address to) public {
      require(book.resaleEnabled(), "owner of book contract has not enabled resale");
      require(renters[msg.sender].expiration > block.timestamp, "you must rent the book before transferring your rental");

      //transfer the remainder of the rental
      uint256 duration = renters[msg.sender].expiration - block.timestamp;
      _rentIndiscriminantly(to, duration);
    }


}
