pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/tokens/ERC721/ERC721BasicToken.sol";

contract Token721 is ERC721BasicToken {

  mapping(uint256 => bytes[]) public tokenData;
  unit256 basePriceOfMinting721;
  ERC20 token; 

  constructor(ERC20 _token) public {
    token = _token;
  }

  function setBasePrice(uint256 newPrice) public {
    basePriceOfMinting721 = newPrice;
  }

  function buyToken() public {
    unit256 valueApproved = token.allowance(msg.sender, "stick sports address");
    require(valueApproved > basePriceOfMinting721, "insufficent erc-20 funds to create new 721");
    token.transferFrom(msg.sender, "stick sports erc-20 wallet", basePriceOfMinting721);
    this._mint();
  }

  function _mint() internal {
    // generate a token ID
    unit256 id = 1; // how to generate the ids? 
    ERC721BasicToken._mint(msg.sender, id);
    tokenData(id) = msg.data;
  }

  function generate() public onlyOwner {
    ERC721BasicToken._mint(msg.sender, id);
  }
}


// contract.sendTrans({ data: "super strong bat"})