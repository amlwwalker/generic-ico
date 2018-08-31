// /*
// look into this
// https://medium.com/@vovakuzmenkov/full-stack-crowdfunding-smart-contract-development-15ed139cde06
// */
// /*
// also read
// https://medium.com/blockchannel/walking-through-the-erc721-full-implementation-72ad72735f3c
// */
const config = require("../config")
// const web3 = require("web3")
const BN = web3.utils.BN
const GenericToken = artifacts.require("./GenericToken.sol")
const GenericTimedCrowdsale = artifacts.require("./GenericTimedCrowdsale.sol")

module.exports = async (deployer, network, [owner]) => {
  if (!config.GenericTimedCrowdsale) {
    return
  }

  const block = await web3.eth.getBlock("latest")
  console.log("block time stamp " + block.timestamp)
  const openingTime = new BN(block.timestamp + 20) // 20 secs in the future
  console.log("opening time " + openingTime)
  const closingTime = new BN(openingTime + 86400 * 20) // 20 days
  const rate = new BN(1000)
  const decimals = new BN(18)
  const totalSupplyWholeDigits = new BN(21000000)
  const totalSupply = totalSupplyWholeDigits.mul(new BN(10).pow(decimals))
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
    closingTime
  )
  const crowdsale = await GenericTimedCrowdsale.deployed()
  await token.transfer(crowdsale.address, totalSupply)
}
