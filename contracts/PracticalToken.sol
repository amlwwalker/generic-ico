pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

//needs to be pausable (does it? or is that just the token sale?)
contract PracticalToken is Ownable, DetailedERC20, StandardToken {
  constructor(
    string _name,
    string _symbol,
    uint8 _decimals,
    uint256 _amount
  )
  //detailed allows us the give it a name and symbol etc
    DetailedERC20(_name, _symbol, _decimals)
    public
  {
    //creating the tokens and assigning them to the deployer (owner)
    require(_amount > 0, "amount has to be greater than 0");
    totalSupply_ = _amount.mul(10 ** uint256(_decimals));
    balances[msg.sender] = totalSupply_;
    emit Transfer(address(0), msg.sender, totalSupply_);
  }
}
