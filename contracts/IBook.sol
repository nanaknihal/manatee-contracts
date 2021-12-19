pragma solidity ^0.8.0;


interface IBook {
    function priceDenomination() view external returns (address);

    function setPriceDenomination(address newPriceDenomination) external;

    function price() view external returns (uint);

    function setPrice(uint newPrice) external;

    // function rentalPeriods() view external returns (mapping(uint256 => uint256) memory);

    //CURRENTLY UNTESTED
    function addRentalPeriod(uint256 numDays, uint256 price_) external;

    //CURRENTLY UNTESTED
    function removeRentalPeriod(uint256 numDays) external;

    function setBookHash(string memory newBookHash) external;

}
