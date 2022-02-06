pragma solidity ^0.8.0;

import "hardhat/console.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "contracts/Provisioner.sol";
import "contracts/BeaconProxyFactory.sol";
import "contracts/ERC20Dividends.sol";

// import "contracts/PaymentSplitterOverrideShares.sol";
// import "@openzeppelin/contracts/finance/PaymentSplitter.sol";

contract Book is Initializable, ERC20Dividends, OwnableUpgradeable { //PaymentSplitterOverrideShares
    string public _name;
    uint public price;
    address public priceToken;
    mapping(uint256 => uint256) public rentalPeriods; //maps number of days to price, e.g. 30 day rental to 15000000 USDC
    //string public bookHash; //bookHashes are not used on-chain; they are mostly for quasi-IP purposes are stored as strings to allow choice of the hash algorithm.
    mapping (string => string) public versions; //maps hash of a book to link of its content
    bool public resaleEnabled;
    address provisionerBeaconProxyFactoryAddress;
    Provisioner public provisioner;

    string public category;
    string public description;
    string[] public versionHashes;
    string public mostRecentVersion; //this variable is useless but an artifact that's not wise to delete for an already-existing proxy logic; any new variable here would override it (see https://blog.openzeppelin.com/proxy-patterns/)

    function initBook(address owner_, string memory name_, string memory symbol_, uint supply_, uint price_, address priceToken_, bool resaleEnabled_, string memory category_, string memory description_) public initializer {
      ERC20Dividends.initERC20Dividends(name_, symbol_, supply_, priceToken_, owner_);
      __Ownable_init();

      _name = name_;
      price = price_;
      require((priceToken_ == 0x35935060E9160a8815312a2c2586109e8C10AD86) || (priceToken_ == 0x07018e3CF542Ac3A97A9b3187DF161450B4E5986), "only USDC and DAI are allowed in V1");
      priceToken = priceToken_;
      resaleEnabled = resaleEnabled_;
      category = category_;
      description = description_;
      // provisioner = Provisioner(payable(0x6A78dF871291627C5470F7a768745C3ff05741F2));
      // provisioner = new Provisioner(payable(address(this)));
      // create provisioner for this book address from the factory
      provisioner = Provisioner(BeaconProxyFactory(0x8F02dAC5E2FA7ee3f8B40A62e374093A120f90Ae).createProvisionerBeaconProxy(address(this)));
      _transferOwnership(owner_);
      //throw;//('please test addRentalPeriod and removeRentalPeriod');
    }

    function setPriceToken(address newPriceToken) public onlyOwner {
      require((newPriceToken == 0x35935060E9160a8815312a2c2586109e8C10AD86) || (newPriceToken == 0x07018e3CF542Ac3A97A9b3187DF161450B4E5986), "only USDC and DAI are allowed in V1");
      priceToken = newPriceToken;
    }

    function setPrice(uint newPrice) public onlyOwner {
      price = newPrice;
    }

    function addRentalPeriod(uint256 numDays, uint256 price_) public onlyOwner {
      require(numDays > 0, "cannot have rentals for 0 days");
      require(price_ > 0, "cannot have rentals priced at 0");
      console.log(rentalPeriods[numDays]);
      rentalPeriods[numDays] = price_;
    }

    function removeRentalPeriod(uint256 numDays) public onlyOwner {
      delete rentalPeriods[numDays];
    }

    // adds or updates a version of the book. versions are indexed by the books hash and point to an external resource (such as on IPFS, Filecoin, Storj, or simple web2)
    function setVersion(string memory bookHash, string memory bookLink) public onlyOwner {
      if(bytes(versions[bookHash]).length == 0){
        versionHashes.push(bookHash);
      }
      versions[bookHash] = bookLink;
    }

    function removeVersion(string memory bookHash) public onlyOwner {
      // it's ok if the bookHash still exists in versions; its bookLink will just be empty
      delete versions[bookHash];
    }

    function getVersionHashes() public view returns (string[] memory) {
      return versionHashes;
    }

    function enableResale() public onlyOwner {
      resaleEnabled = true;
    }

    function disableResale() public onlyOwner {
      resaleEnabled = false;
    }

    function setCategory(string memory newCategory) public onlyOwner {
      category = newCategory;
    }

    function setDescription(string memory newDescription) public onlyOwner {
      description = newDescription;
    }

    // deprecated
    // function setBookHash(string memory newBookHash) public onlyOwner {
    //   bookHash = newBookHash;
    // }

    // function getShares(address account) public view override returns (uint256) {
    //     return balanceOf(account);
    //
    //   }
    //
    // function getTotalShares() public view override returns (uint256) {
    //     return totalSupply();
    //   }


}
