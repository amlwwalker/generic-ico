const config = require("../config")
const BN = web3.utils.BN
const GenericToken = artifacts.require("./GenericToken.sol")
const GenericCappedRefundableCrowdsale = artifacts.require("./GenericCappedRefundableCrowdsale.sol")

function ether(n) {
  return new BN(web3.utils.toWei(new BN(n), "ether"))
}

module.exports = async (deployer, network, [owner]) => {
  if (!config.GenericCappedRefundableCrowdsale) {
    return
  }

  const rate = new BN(1000)
  const GOAL = new BN(ether(10))
  const CAP = new BN(ether(20))
  const decimals = new BN(18)
  const totalSupplyWholeDigits = new BN(21000000)
  const totalSupply = totalSupplyWholeDigits.mul(new BN(10).pow(decimals))
  const block = await web3.eth.getBlock("latest")
  const openingTime = new BN(block + 60 * 60 * 24 * 7) // new BN(block.timestamp + 10)
  const closingTime = new BN(openingTime + 60 * 60 * 24 * 7) //new BN(block.timestamp + 200)

  await deployer.deploy(GenericToken, "GenericTimedToken", "GENTTOK", decimals, totalSupplyWholeDigits)
  const token = await GenericToken.deployed()
  await deployer.deploy(
    GenericCappedRefundableCrowdsale,
    rate,
    owner,
    token.address,
    openingTime,
    closingTime,
    CAP,
    GOAL
  )
  const crowdsale = await GenericCappedRefundableCrowdsale.deployed()
  await token.transfer(crowdsale.address, totalSupply)
}
