// extend from the splitter and pausal contracts, ownable
pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/payment/SplitPayment.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";

contract EscrowWallet is SplitPayment, Ownable, Pausable {

  event Claim(address indexed payee, unit256 amount);

  constructor(
    address[] _payees, 
    uint256[] _shares
  ) SplitPayment(_payees, _shares) 
  public
  {}

  function claim() public whenNotPaused {
    uint256 amount = totalReceived.mul(
      shares[payee]).div(
        totalShares).sub(
          released[payee]
    );
    SplitPayment.claim();
    
    emit Claim(msg.sender, amount);
  }
}

