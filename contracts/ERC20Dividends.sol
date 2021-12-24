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

  IERC20 paymentToken;
  uint256 private _totalReleased;
  mapping(address => uint256) private _released;
  mapping(address => uint256) private _withholding;

  constructor(string memory name, string memory symbol, IERC20 paymentToken) ERC20(name, symbol) payable {

  }

  function totalReleased() public view returns (uint256) {
      return _totalReleased;
  }

  function released(address account) public view returns (uint256) {
      return _released[account];
  }

  function _beforeTokenTransfer(address from, address to, uint256 amount) internal override {
    uint256 totalReceived = paymentToken.balanceOf(address(this)) + totalReleased();
    uint256 dividendValue = totalReceived * amount / totalSupply();
    release(from, dividendValue);
    _withholding[to] += dividendValue;
  }

  function release(address account, uint256 amount) public {
      require(balanceOf(account) > 0, "ERC20Dividends: account has no shares");
      require(amount != 0, "ERC20Dividends: account is not due payment");

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
