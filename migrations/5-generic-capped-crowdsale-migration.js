const config = require("../config")
const BN = web3.utils.BN
const GenericToken = artifacts.require("./GenericToken.sol")
const GenericTimedCrowdsale = artifacts.require("./GenericCappedCrowdsale.sol")

module.exports = async (deployer, network, [owner]) => {
  if (!config.GenericTimedCrowdsale) {
    return
  }

  const rate = new BN(1000)
  const GOAL = ether(10)
  const CAP = ether(20)
  const decimals = new BN(18)
  const totalSupplyWholeDigits = new BN(21000000)
  const totalSupply = totalSupplyWholeDigits.mul(new BN(10).pow(decimals))
  const block = await web3.eth.getBlock("latest")
  const openingTime = block + 10
  const closingTime = block + 20

  await deployer.deploy(
    GenericToken,
    "GenericTimedToken",
    "GENTTOK",
    decimals,
    totalSupplyWholeDigits
  )
  const token = await GenericToken.deployed()
  await deployer.deploy(
    GenericTimedCrowdsale,
    rate,
    owner,
    token.address,
    openingTime,
    closingTime,
    CAP,
    GOAL
  )
  const crowdsale = await GenericTimedCrowdsale.deployed()
  await token.transfer(crowdsale.address, totalSupply)
}
