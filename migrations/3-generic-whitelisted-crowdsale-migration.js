/*
look into this
https://medium.com/@vovakuzmenkov/full-stack-crowdfunding-smart-contract-development-15ed139cde06
*/
/*
also read
https://medium.com/blockchannel/walking-through-the-erc721-full-implementation-72ad72735f3c
*/
const web3 = require("web3")
const BN = web3.utils.BN
const GenericToken = artifacts.require("./GenericToken.sol")
const GenericWhitelistedCrowdsale = artifacts.require("./GenericWhitelistedCrowdsale.sol")

module.exports = async (deployer, network, [owner]) => {
  const rate = new BN(1000)
  const decimals = new BN(18)
  const totalSupplyWholeDigits = new BN(21000000)
  const totalSupply = totalSupplyWholeDigits.mul(new BN(10).pow(decimals))

  await deployer.deploy(GenericToken, "GenericWhitelistedToken", "GENWLTOK", decimals, totalSupplyWholeDigits)
  const token = await GenericToken.deployed()
  await deployer.deploy(GenericWhitelistedCrowdsale, rate, owner, token.address)
  const crowdsale = await GenericWhitelistedCrowdsale.deployed()
  await token.transfer(crowdsale.address, totalSupply)
}
