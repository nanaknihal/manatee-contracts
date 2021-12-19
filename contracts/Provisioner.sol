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
      _buy(msg.sender, marketplaceAddr, marketplaceTip, marketplaceTipDenomination);
    }

    //will charge the book's price plus token 'tip' to marketplace, overloaded to buy a book for someone/something else
    function buy(address recipient, address marketplaceAddr, uint256 marketplaceTip, address marketplaceTipDenomination) public {
      _buy(recipient, marketplaceAddr, marketplaceTip, marketplaceTipDenomination);
    }

    function _buy(address addr, address marketplaceAddr, uint256 marketplaceTip, address marketplaceTipDenomination) private {
      console.log('starting');
      IERC20 priceToken = IERC20(book.priceDenomination());
      IERC20 tipToken = IERC20(marketplaceTipDenomination);
      uint256 fee = book.price() / 10; //DON'T HARDCODE?! OR HARDCODE
      console.log('will continue for ', book.price(), book.priceDenomination());
      require(priceToken.transferFrom(msg.sender, bookAddr, book.price() - fee), 'Need to pay enough for book');
      console.log('made it here');
      require(priceToken.transferFrom(msg.sender, manatAddr, fee), 'Need to pay enough for book'); //DON'T HARDCODE?! OR HARDCODE

      console.log('will continue for ', marketplaceTip, marketplaceTipDenomination);
      require(tipToken.transferFrom(msg.sender, marketplaceAddr, marketplaceTip), 'Need to pay enough to marketplace');
      console.log('and here');

      owners[addr] = true;
      console.log('and here also');
      console.log('address is ', addr);
    }

    function rent(uint256 numDays) public {
      uint256 price = book.rentalPeriods(numDays);
      require(price > 0, "invalid rental period");
      IERC20 token = IERC20(book.priceDenomination());
      require(token.transferFrom(msg.sender, address(this), price));
      _rent(msg.sender, numDays);
    }

    // function rent(address addr, uint256 numDays) public {
    //   uint256 price = book.rentalPeriods()[numDays];
    //   require(price, "invalid rental period");
    //   IERC20 token = IERC20(book.priceDenomination());
    //   require(token.transferFrom(msg.sender, address(this), price));
    //   _rent(addr, numDays);
    // }

    // internal method to grants access without checking payment was successful
    function _rent(address addr, uint256 numDays) private {
      //if there's already a rental, extend it:
      if(renters[addr].expiration > block.timestamp) {
        renters[addr].expiration += numDays * 1 days;
      } else {
        renters[addr] = RentalContract({
          start: block.timestamp,
          expiration: block.timestamp + numDays * 1 days
        });
      }

    }


}
