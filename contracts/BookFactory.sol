import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";
contract ContentFactory is Ownable {
    // struct Parameters {
    //     string name;
    //     string symbol;
    //     uint supply;
    //     uint price;
    //     address priceToken;
    //     bool resaleEnabled;
    // }


    address immutable upgradeableBeaconAddr;
    UpgradeableBeacon immutable upgradeableBeacon;

    // Parameters public parameters;
    address[] contentsCreated;

    constructor(address _logic) {
        upgradeableBeaconAddr = _logic;
        upgradeableBeacon =  UpgradeableBeacon(_logic);
    }

    function upgrade(address newLogic) onlyOwner public {
        upgradeableBeacon.upgradeTo(newLogic);
    }

    // ======== Deploy contract ========
    function createContent(string calldata name_, string calldata symbol_, uint supply_, uint price_, address priceToken_, bool resaleEnabled_)
        external
        returns (address)
    {
        // parameters = Parameters({name: name_, symbol: symbol_, supply: supply_, price: price_, priceToken: priceToken_, resaleEnabled: resaleEnabled_});
        BeaconProxy proxy = new BeaconProxy(
           upgradeableBeaconAddr,
            msg.data
        );
        // delete parameters;
        contentsCreated.push(address(proxy));
        return address(proxy);
    }
}
