pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/WhitelistedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/TimedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol";
//inherits from finalizable
import "openzeppelin-solidity/contracts/crowdsale/distribution/RefundableCrowdsale.sol";

contract PracticalCrowdsale is WhitelistedCrowdsale, CappedCrowdsale, TimedCrowdsale {
  constructor
  (
    uint256 _rate,
    address _wallet,
    ERC20 _token,
    uint256 _cap,
    uint256 _softCap,
    uint256 _openingTime,
    uint256 _closingTime
  )
    Crowdsale(_rate, _wallet, _token)
    CappedCrowdsale(_cap)
    TimedCrowdsale(_openingTime, _closingTime)
    // RefundableCrowdsale(_softCap)
    public
  {}
  //does not need to override checks as that is handled
  //by _preValidatePurchase in the parents
}
