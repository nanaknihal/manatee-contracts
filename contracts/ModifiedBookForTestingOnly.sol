pragma solidity ^0.8.0;

import "hardhat/console.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "contracts/Provisioner.sol";
import "contracts/ERC20Dividends.sol";
import "contracts/Arguments.sol";
// import "contracts/PaymentSplitterOverrideShares.sol";
// import "@openzeppelin/contracts/finance/PaymentSplitter.sol";

contract ModifiedBookForTestingOnly is Initializable, ERC20Dividends, OwnableUpgradeable { //PaymentSplitterOverrideShares
    string public _name;
    uint256 public price;
    address public priceToken;
    mapping(uint256 => uint256) public rentalPeriods; //maps number of days to price, e.g. 30 day rental to 15000000 USDC
    //string public bookHash; //bookHashes are not used on-chain; they are mostly for quasi-IP purposes are stored as strings to allow choice of the hash algorithm.
    mapping (string => string) public bookVersions; //maps hash of a book to link of its content
    bool public resaleEnabled;
    address provisionerBeaconProxyFactoryAddress;
    Provisioner public provisioner;

    function initBook(Arguments.BookArgs memory a) public initializer {
      ERC20Dividends.initERC20Dividends(a.name, a.symbol, a.supply, a.priceToken, a.owner);
      __Ownable_init();

      _name = a.name;
      price = a.price;
      require((a.priceToken == 0x35935060E9160a8815312a2c2586109e8C10AD86) || (a.priceToken == 0x07018e3CF542Ac3A97A9b3187DF161450B4E5986), "only USDC and DAI are allowed in V1");
      priceToken = a.priceToken;
      resaleEnabled = a.resaleEnabled;
      // category = a.category;
      // setVersion(a.initialVersionHash, a.initialVersionURI);
      // provisioner = Provisioner(payable(0x6A78dF871291627C5470F7a768745C3ff05741F2));
      // provisioner = new Provisioner(payable(address(this)));
      // create provisioner for this book address from the factory
      provisioner = Provisioner(payable(0x6A78dF871291627C5470F7a768745C3ff05741F2));
      _transferOwnership(a.owner);
      //throw;//('please test addRentalPeriod and removeRentalPeriod');
    }

    function setPriceToken(address newPriceToken) public onlyOwner {
      require((newPriceToken == 0x07018e3CF542Ac3A97A9b3187DF161450B4E5986) || (newPriceToken == 0x35935060E9160a8815312a2c2586109e8C10AD86), "only USDC and DAI are allowed in V1");
      priceToken = newPriceToken;
    }

    function setPrice(uint256 newPrice) public onlyOwner {
      price = newPrice;
    }

    function weirdPrice() public view returns (uint256) {
      return price + 1;
    }

}
