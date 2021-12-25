pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "hardhat/console.sol";

// NOTE: assumes fixed supply, makes sure nobody can mint more if using this ... or does it not assume this?/

contract ERC20Dividends is ERC20 {
  event PaymentReleased(address to, uint256 amount);
  event ERC20PaymentReleased(IERC20 indexed token, address to, uint256 amount);
  event PaymentReceived(address from, uint256 amount);

  IERC20 public paymentToken;
  uint256 private _totalReleased;
  mapping(address => uint256) private _released;
  mapping(address => uint256) private _withholding;

  constructor(string memory name, string memory symbol, IERC20 paymentToken_) ERC20(name, symbol) public payable {
    paymentToken = paymentToken_;
    _mint(msg.sender, 1000000000 * 10 ** decimals());
  }


  function totalReleased() public view returns (uint256) {
      return _totalReleased;
  }

  function released(address account) public view returns (uint256) {
      return _released[account];
  }

  function _beforeTokenTransfer(address from, address to, uint256 amount) internal override {
    //this is not the most gas-efficient, as it is running this if statement for every transfer when it only needs it upon initializating
    //but it's the easiest way to allow _mint() to be called when totalSupply is 0. totalSupply can only be 0 during initialization (as long as it's initialized with some supply) as this contract does not have public burning functions
    //it's a low overhead though
    if(totalSupply() == 0){
      return;
    }
    uint256 totalReceived = paymentToken.balanceOf(address(this)) + totalReleased();
    uint256 dividendValue = totalReceived * amount / totalSupply();
    _release(from, dividendValue);
    _withholding[to] += dividendValue;
  }

  function release(uint256 amount) public {
      _release(msg.sender, amount);
  }

  function _release(address account, uint256 amount) private {
    require(balanceOf(account) > 0, "ERC20Dividends: account has no shares");
    require(amount <= pendingPayment(account), "ERC20Dividends: amount requested exceeds amount owed");

    _released[account] += amount;
    _totalReleased += amount;

    SafeERC20.safeTransfer(paymentToken, account, amount);
    emit ERC20PaymentReleased(paymentToken, account, amount);
  }

  function pendingPayment(address account) public view returns (uint256) {
      uint256 totalReceived = paymentToken.balanceOf(address(this)) + totalReleased();
      uint256 totalOwed_ = (totalReceived * balanceOf(account)) / totalSupply() - _withholding[account];
      uint256 totalReleased_ = released(account);
      if (totalReleased_ > totalOwed_) {
        return 0;
      } else {
        return totalOwed_ - totalReleased_;
      }

  }
}
