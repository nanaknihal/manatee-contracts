pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Context.sol";

import "hardhat/console.sol";

/*MODIFICATION OF PaymentSplitter so that shares is given by an overridable function instead of a private variable. This way, the shares can be retrieved from an external source, e.g. an ERC20 contract such as this:

IERC20 token;
function _shares(address account) public view override returns (uint256) {
    return token.balanceOf(account);
  }
    function _totalShares() public view override returns (uint256) {
        return token.totalShares();
  }

*/


/**
 * @title PaymentSplitter
 * @dev This contract allows to split Ether payments among a group of accounts. The sender does not need to be aware
 * that the Ether will be split in this way, since it is handled transparently by the contract.
 *
 * The split can be in equal parts or in any other arbitrary proportion. The way this is specified is by assigning each
 * account to a number of shares. Of all the Ether that this contract receives, each account will then be able to claim
 * an amount proportional to the percentage of total shares they were assigned.
 *
 * `PaymentSplitter` follows a _pull payment_ model. This means that payments are not automatically forwarded to the
 * accounts but kept in this contract, and the actual transfer is triggered as a separate step by calling the {release}
 * function.
 *
 * NOTE: This contract assumes that ERC20 tokens will behave similarly to native tokens (Ether). Rebasing tokens, and
 * tokens that apply fees during transfers, are likely to not be supported as expected. If in doubt, we encourage you
 * to run tests before sending real value to this contract.
 */
contract PaymentSplitterOverrideShares is Context {
    // event PayeeAdded(address account, uint256 shares);
    event PaymentReleased(address to, uint256 amount);
    event ERC20PaymentReleased(IERC20 indexed token, address to, uint256 amount);
    event PaymentReceived(address from, uint256 amount);

    // uint256 private _totalShares;
    uint256 private _totalReleased;

    // mapping(address => uint256) private _shares;
    mapping(address => uint256) private _released;
    // address[] private _payees;

    mapping(IERC20 => uint256) private _erc20TotalReleased;
    mapping(IERC20 => mapping(address => uint256)) private _erc20Released;

    /**
     * @dev Creates an instance of `PaymentSplitter` where each account in `payees` is assigned the number of shares at
     * the matching position in the `shares` array.
     *
     * All addresses in `payees` must be non-zero. Both arrays must have the same non-zero length, and there must be no
     * duplicates in `payees`.
     */
    constructor() payable {

    }

    /**
     * @dev The Ether received will be logged with {PaymentReceived} events. Note that these events are not fully
     * reliable: it's possible for a contract to receive Ether without triggering this function. This only affects the
     * reliability of the events, and not the actual splitting of Ether.
     *
     * To learn more about this see the Solidity documentation for
     * https://solidity.readthedocs.io/en/latest/contracts.html#fallback-function[fallback
     * functions].
     */
    receive() external payable virtual {
        emit PaymentReceived(_msgSender(), msg.value);
    }

    /**
     * @dev Getter for the total shares held by payees.
     */
    function _totalShares() virtual public view returns (uint256) {
        //return _totalShares;
    }

    /**
     * @dev Getter for the total amount of Ether already released.
     */
    function totalReleased() public view returns (uint256) {
        return _totalReleased;
    }

    /**
     * @dev Getter for the total amount of `token` already released. `token` should be the address of an IERC20
     * contract.
     */
    function totalReleased(IERC20 token) public view returns (uint256) {
        return _erc20TotalReleased[token];
    }

    /**
     * @dev Getter for the amount of shares held by an account.
     */
    function _shares(address account) virtual public view returns (uint256) {
        // return _shares[account];
    }

    /**
     * @dev Getter for the amount of Ether already released to a payee.
     */
    function released(address account) public view returns (uint256) {
        return _released[account];
    }

    /**
     * @dev Getter for the amount of `token` tokens already released to a payee. `token` should be the address of an
     * IERC20 contract.
     */
    function released(IERC20 token, address account) public view returns (uint256) {
        return _erc20Released[token][account];
    }

    function release(address payable account) public {
        require(_shares(account) > 0, "PaymentSplitter: account has no shares");

        uint256 payment = pendingPaymentEth(account);

        require(payment != 0, "PaymentSplitter: account is not due payment");

        _released[account] += payment;
        _totalReleased += payment;

        Address.sendValue(account, payment);
        emit PaymentReleased(account, payment);
    }

    /**
     * @dev Triggers a transfer to `account` of the amount of `token` tokens they are owed, according to their
     * percentage of the total shares and their previous withdrawals. `token` must be the address of an IERC20
     * contract.
     */
    function release(IERC20 token, address account) public {
        console.log('account has shares: ', _shares(account));
        require(_shares(account) > 0, "PaymentSplitter: account has no shares");

        uint256 payment = pendingPaymentToken(account, token);

        console.log('account is owed: ', payment);
        require(payment != 0, "PaymentSplitter: account is not due payment");
        console.log('this ran');
        _erc20Released[token][account] += payment;
        console.log('this ran');
        _erc20TotalReleased[token] += payment;

        console.log('this ran');
        SafeERC20.safeTransfer(token, account, payment);
        emit ERC20PaymentReleased(token, account, payment);
        console.log('this ran');
    }





//DELETE THESE BEFORE PULL REQUESTING; THEY AREN'T NEEDED FOR OpenZeppelin contract and if anything would hurt
    /**
     * @dev IS IT BAD TO MAKE THIS PUBLIC? public function computing the pending payment of an `account` given the token historical balances and
     * already released amounts.
     */
    function pendingPaymentEth(address account) public view returns (uint256) {
        uint256 totalReceived = address(this).balance + totalReleased();
        uint256 totalOwed_ = (totalReceived * _shares(account)) / _totalShares();
        uint256 totalReleased_ = released(account);
        if (totalReleased_ > totalOwed_) {
          return 0;
        } else {
          return totalOwed_ - totalReleased_;
        }
    }

    /**
     * @dev IS IT DANGGEERROUS TO MAKE THIS PUBLIC?!!!!! I don't see why but it was private and i suspect there could be a reason for that...
     * It would be helpful to make this public so people can know how much they can withdraw.
     * public function computing the pending payment of an `account` given the token historical balances and
     * already released amounts.
     */
    function pendingPaymentToken(address account, IERC20 token) public view returns (uint256) {
        uint256 totalReceived = token.balanceOf(address(this)) + totalReleased(token);
        uint256 totalOwed_ = (totalReceived * _shares(account)) / _totalShares();
        uint256 totalReleased_ = released(token, account);
        if (totalReleased_ > totalOwed_) {
          return 0;
        } else {
          return totalOwed_ - totalReleased_;
        }

    }

}
