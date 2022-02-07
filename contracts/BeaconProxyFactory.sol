pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";
import "contracts/Book.sol";
import "contracts/Provisioner.sol";
import "contracts/Arguments.sol";
import "hardhat/console.sol";

contract BeaconProxyFactory is Ownable {
    event BookProxyCreated(address indexed creator, address proxy);
    event ProvisionerProxyCreated(address indexed creator, address proxy);
    address public bookUpgradeableBeaconAddr;
    address public provisionerUpgradeableBeaconAddr;
    UpgradeableBeacon public bookUpgradeableBeacon;
    UpgradeableBeacon public provisionerUpgradeableBeacon;
    Book exampleBook;
    Provisioner exampleProvisioner;
    address[] public books;

    function getBooks() external view returns (address[] memory) {
      return books;
    }

    constructor(address bookLogic, address provisionerLogic) {
        bookUpgradeableBeacon = new UpgradeableBeacon(bookLogic);
        provisionerUpgradeableBeacon = new UpgradeableBeacon(provisionerLogic);
        bookUpgradeableBeaconAddr = address(bookUpgradeableBeacon);
        provisionerUpgradeableBeaconAddr = address(provisionerUpgradeableBeacon);
        exampleBook = new Book();
        exampleProvisioner = new Provisioner();
    }

    function upgradeBook(address newLogic) onlyOwner public {
        bookUpgradeableBeacon.upgradeTo(newLogic);
    }

    function upgradeProvisioner(address newLogic) onlyOwner public {
        provisionerUpgradeableBeacon.upgradeTo(newLogic);
    }

    function createBookBeaconProxy(Arguments.BookArgs memory a) external returns (address) {
        BeaconProxy proxy = new BeaconProxy(
           bookUpgradeableBeaconAddr,
            abi.encodeWithSelector(exampleBook.initBook.selector, a)
        );
        books.push(address(proxy));
        emit BookProxyCreated(msg.sender, address(proxy));
        return address(proxy);
    }

    function createProvisionerBeaconProxy(address bookAddr_) external returns (address) {
        BeaconProxy proxy = new BeaconProxy(provisionerUpgradeableBeaconAddr,
                                            abi.encodeWithSelector(exampleProvisioner.initProvisioner.selector, bookAddr_));
        emit ProvisionerProxyCreated(msg.sender, address(proxy));
        return address(proxy);
    }
}
