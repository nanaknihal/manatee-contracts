pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "contracts/Book.sol"; //book interface


// Should be created upon book initialization by the book
contract Provisioner is Initializable {
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

    //will charge the book's price plus token 'tip' to marketplace
    function buy(address marketplaceAddr, uint256 marketplaceTip, address marketplaceTipToken) public {
      buy(msg.sender, marketplaceAddr, marketplaceTip, marketplaceTipToken);
    }

    //will charge the book's price plus token 'tip' to marketplace, overloaded to be able to gift a book to custom recipient
    function buy(address recipient, address marketplaceAddr, uint256 marketplaceTip, address marketplaceTipToken) public {
      require(!owners[recipient], "recipient already owns a copy");
      require(_processPayment(book.price(), marketplaceAddr, marketplaceTip, marketplaceTipToken), "payment processing failed");
      owners[recipient] = true;
    }

    function buyNoMarketplace() public {
      buyNoMarketplace(msg.sender);
    }

    // cucstom recipient enables gifts
    function buyNoMarketplace(address recipient) public {
      require(!owners[recipient], "recipient already owns a copy");
      require(_processPaymentNoMarketplace(book.price()), "payment processing failed");
      owners[recipient] = true;
    }



    function rent(uint256 numDays, address marketplaceAddr, uint256 marketplaceTip, address marketplaceTipToken) public {
      uint256 price = book.rentalPeriods(numDays);
      require(price > 0, "invalid rental period");
      require(!owners[msg.sender], "you already own the book you are trying to rent");
      require(_processPayment(price, marketplaceAddr, marketplaceTip, marketplaceTipToken), "payment processing failed");
      _rentIndiscriminantly(msg.sender, numDays * 1 days);
    }

    function rentNoMarketplace(uint256 numDays) public {
      uint256 price = book.rentalPeriods(numDays);
      require(price > 0, "invalid rental period");
      require(!owners[msg.sender], "you already own the book you are trying to rent");
      require(_processPaymentNoMarketplace(price), "payment processing failed");
      _rentIndiscriminantly(msg.sender, numDays * 1 days);
    }

    function _processPayment(uint256 price, address marketplaceAddr, uint256 marketplaceTip, address marketplaceTipToken) private   returns (bool) {
      IERC20 priceToken_ = IERC20(book.priceToken());
      IERC20 tipToken_ = IERC20(marketplaceTipToken);
      uint256 fee = price / 10; //book.price() / manateeToken.feeDivisor();
      require(priceToken_.transferFrom(msg.sender, bookAddr, price - fee), "Need to pay enough for book");
      require(priceToken_.transferFrom(msg.sender, manatAddr, fee), "Need to pay enough for book");
      require(tipToken_.transferFrom(msg.sender, marketplaceAddr, marketplaceTip), "Need to pay enough to marketplace");

      return true;

    }

    function hasAccess(address addr) public view returns (bool) {
      return (owners[addr] || (renters[addr].expiration > block.timestamp));
    }

    function _processPaymentNoMarketplace(uint256 price) private   returns (bool) {
      IERC20 priceToken_ = IERC20(book.priceToken());
      uint256 fee = price / 10; //book.price() / manateeToken.feeDivisor();
      require(priceToken_.transferFrom(msg.sender, bookAddr, price - fee), "Need to pay enough for book");
      require(priceToken_.transferFrom(msg.sender, manatAddr, fee), "Need to pay enough for book");
      return true;
    }


    // private method to grants access without checking payment was successful
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
