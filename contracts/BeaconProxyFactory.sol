pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";

import "contracts/Book.sol";


import "hardhat/console.sol";

contract BeaconProxyFactory is Ownable {
    // struct Parameters {
    //     string name;
    //     string symbol;
    //     uint supply;
    //     uint price;
    //     address priceToken;
    //     bool resaleEnabled;
    // }


    address public upgradeableBeaconAddr;
    UpgradeableBeacon public upgradeableBeacon;
    Book exampleBook;
    // Parameters public parameters;
    address[] public mySpawn;

    constructor(address _logic) {
        upgradeableBeacon = new UpgradeableBeacon(_logic);
        upgradeableBeaconAddr = address(upgradeableBeacon);
        exampleBook = new Book();
    }

    function upgrade(address newLogic) onlyOwner public {
        upgradeableBeacon.upgradeTo(newLogic);
    }

    // string memory name_, string memory symbol_, uint supply_, uint price_, address priceToken_, bool resaleEnabled_
    function createBeaconProxy(string memory name_, string memory symbol_, uint256 supply_, uint256 price_, address priceToken_, bool resaleEnabled_)
        external
        returns (address)
    {
        // parameters = Parameters({name: name_, symbol: symbol_, supply: supply_, price: price_, priceToken: priceToken_, resaleEnabled: resaleEnabled_});
        // bytes[] memory asdfasdf = abi.encodeWithSelector(exampleBook.initialize.selector, name_, symbol_, supply_, price_, priceToken_, resaleEnabled_);
        // console.log(asdfasdf);
        BeaconProxy proxy = new BeaconProxy(
           upgradeableBeaconAddr,
            abi.encodeWithSelector(exampleBook.initBook.selector, name_, symbol_, supply_, price_, priceToken_, resaleEnabled_)
        );
        // delete parameters;
        mySpawn.push(address(proxy));
        return address(proxy);
    }
}
