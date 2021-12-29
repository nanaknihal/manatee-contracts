/*
Original work taken from https://github.com/tapmydata/tap-protocol/blob/main/contracts/VestingVault.sol
Amended by <Ardi> for Manatee's specific usecase.
*/

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/e9e177f53b337b7ed90649debf0a35261ed9f90e/contracts/token/ERC20/ERC20.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/e9e177f53b337b7ed90649debf0a35261ed9f90e/contracts/access/Ownable.sol";

contract VestingVault is Ownable {

    struct Grant {
        uint startTime;
        uint amount;
        uint vestingDuration;
        uint daysClaimed;
        uint totalClaimed;
        address recipient;
    }

    ERC20 public token;
    
    mapping (address => Grant) private tokenGrants;

    constructor(ERC20 _token) {
        require(address(_token) != address(0));
        token = _token;
    }
    
    // Grants recipients can be added with this funciton one by one by the owner. Function inputs are as follows:
    // 1 - Recipient ETH address
    // 2 - Amount of token assigned to this recipient
    // 3 - Required amount of Vesting duration in days (note that this kicks in after the vesting cliff period)
    // 4 - Vesting cliff in days (number of days initally during which NO token will be vested)

    function addTokenGrant(address _recipient, uint _amount, uint _vestingDurationInDays, uint _vestingCliffInDays) external onlyOwner {
        require(tokenGrants[_recipient].amount == 0, "Grant already exists"); // Prevents a double entry for the same recipient
        require(_amount > 0, "Grant amount should be greater than 0");
        require(_vestingCliffInDays <= 10*365, "Cliff greater than 10 years");
        require(_vestingDurationInDays <= 25*365, "Duration greater than 25 years");
        
        uint amountVestedPerDay = _amount / _vestingDurationInDays;
        require(amountVestedPerDay > 0, "amountVestedPerDay > 0");// Amount vested per day should be greater than zero - check for validity

        // Transfer the total grant tokens, for this specific recipient, under the control of the vesting contract
        // We have two way to give the contract the required tokens:
                // 1 - give the contract permission through token.approve() function of the ERC20 to withdraw tokens from the Owner's account,
                // 2 - Just directly deposit the required tokens to the contract address. If this method is chosen the next line can be removed.
        require(token.transferFrom(owner(), address(this), _amount));

        Grant memory grant = Grant({
            startTime: currentTime() + _vestingCliffInDays * 1 days,
            amount: _amount,
            vestingDuration: _vestingDurationInDays,
            daysClaimed: 0,
            totalClaimed: 0,
            recipient: _recipient
        });
        tokenGrants[_recipient] = grant;
    }

    /// @notice Allows a grant recipient to claim their vested tokens. Errors if no tokens have vested
    function claimVestedTokens() external {
        uint daysVested;
        uint amountVested;
        (daysVested, amountVested) = calculateGrantClaim(msg.sender);
        require(amountVested > 0, "Vested is 0");

        Grant storage tokenGrant = tokenGrants[msg.sender];
        tokenGrant.daysClaimed = uint(tokenGrant.daysClaimed + daysVested);
        tokenGrant.totalClaimed = uint(tokenGrant.totalClaimed + amountVested);
        
        require(token.transfer(tokenGrant.recipient, amountVested), "no tokens");
    }

    /// @notice Terminate token grant transferring all vested tokens to the `_recipient`
    /// and returning all non-vested tokens to the contract owner
    /// Secured to the contract owner only
    /// @param _recipient address of the token grant recipient
    function revokeTokenGrant(address _recipient) 
        external 
        onlyOwner
    {
        Grant storage tokenGrant = tokenGrants[_recipient];
        uint daysVested;
        uint amountVested;
        (daysVested, amountVested) = calculateGrantClaim(_recipient);

        uint amountNotVested = (tokenGrant.amount - tokenGrant.totalClaimed - amountVested);

        require(token.transfer(owner(), amountNotVested));
        require(token.transfer(_recipient, amountVested));

        tokenGrant.startTime = 0;
        tokenGrant.amount = 0;
        tokenGrant.vestingDuration = 0;
        tokenGrant.daysClaimed = 0;
        tokenGrant.totalClaimed = 0;
        tokenGrant.recipient = address(0);
    }

    function getGrantStartTime(address _recipient) public view returns(uint) {
        Grant storage tokenGrant = tokenGrants[_recipient];
        return tokenGrant.startTime;
    }

    function getGrantAmount(address _recipient) public view returns(uint) {
        Grant storage tokenGrant = tokenGrants[_recipient];
        return tokenGrant.amount;
    }

    /// @notice Calculate the vested and unclaimed months and tokens available for `_grantId` to claim
    /// Due to rounding errors once grant duration is reached, returns the entire left grant amount
    /// Returns (0, 0) if cliff has not been reached
    function calculateGrantClaim(address _recipient) private view returns (uint, uint) {
        Grant storage tokenGrant = tokenGrants[_recipient];

        require(tokenGrant.totalClaimed < tokenGrant.amount, "Grant fully claimed");

        // For grants created with a future start date, that hasn't been reached, return 0, 0
        if (currentTime() < tokenGrant.startTime) {
            return (0, 0);
        }

        // Calculate the number of elapsed DAYS since Grant's startTime
        uint elapsedDays = (currentTime() - (tokenGrant.startTime - 1 days)) / (1 days);

        // If the vesting period is done, all tokens are fully vested
        if (elapsedDays >= tokenGrant.vestingDuration) {
            uint remainingGrant = tokenGrant.amount - tokenGrant.totalClaimed;
            return (tokenGrant.vestingDuration, remainingGrant);
        } 
        
        // If the vesting period is NOT done yet, calculates the number of days and the amount vested
        else {
            uint daysVested = uint(elapsedDays - tokenGrant.daysClaimed);
            uint amountVestedPerDay = tokenGrant.amount / uint(tokenGrant.vestingDuration);
            uint amountVested = uint(daysVested * amountVestedPerDay);
            return (daysVested, amountVested);
        }
    }

    function currentTime() private view returns(uint) {
        return block.timestamp;
    }
}
