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
const PracticalToken = artifacts.require("./PracticalToken.sol")
const PracticalCrowdsale = artifacts.require("./PracticalCrowdsale.sol")

//neatly, this unpacks the first value in the addresses array past in
//and gives it the name owner. This is cool code.
module.exports = async (deployer, network, [owner]) => {
  const now = Math.floor(Date.now() / 1000)
  const day = 24 * 60 * 60

  const openingTime = new BN(now)
  const closingTime = new BN(now + 2 * day)
  const rate = new BN(1000)
  const decimals = new BN(18)

  //IMPORTANT
  const totalSupplyWholeDigits = new BN(100)

  const totalSupply = totalSupplyWholeDigits.mul(new BN(10).pow(decimals))

  //its 1000 wei per token (see rate above)
  //its 1000 tokens per dollar
  //the $-ETH rate is 280
  //so eth_cap in eth is max_$ / 280
  const doll_conv = 280
  const max_$ = 10000
  const eth_cap = max_$ / doll_conv
  const cap = web3.utils.toWei(new BN(eth_cap), "ether")
  console.log("cap in wei is " + cap)

  //calculate the softCap (value raised to lock in funds)
  const softCap = cap.div(new BN(2)) //half the cap
  console.log("soft cap: " + softCap)
  await deployer.deploy(
    PracticalToken,
    "PracticalToken",
    "PRACT",
    decimals,
    totalSupplyWholeDigits
  )
  const token = await PracticalToken.deployed()
  await deployer.deploy(
    PracticalCrowdsale,
    rate,
    owner,
    token.address,
    cap,
    softCap,
    openingTime,
    closingTime
  )
  const crowdsale = await PracticalCrowdsale.deployed()
  //the crowd sale now owns, and has full control of all the tokens
  await token.transfer(crowdsale.address, totalSupply)
}