pragma solidity ^0.4.24;

import "./GenericToken.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/TimedCrowdsale.sol";
import 'openzeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol';

contract GenericCrowdsale is TimedCrowdsale, MintedCrowdsale {
  constructor
  (
    uint256 _openingTime,
    uint256 _closingTime,
    uint256 _rate,
    address _wallet,
    ERC20 _token
  )
    Crowdsale(_rate, _wallet, _token)
    TimedCrowdsale(_openingTime, _closingTime)
    public
  {}
}
