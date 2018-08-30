/*
look into this
https://medium.com/@vovakuzmenkov/full-stack-crowdfunding-smart-contract-development-15ed139cde06
*/
/*
also read
https://medium.com/blockchannel/walking-through-the-erc721-full-implementation-72ad72735f3c
*/
const GenericToken = artifacts.require("./GenericToken.sol")
const GenericCrowdsale = artifacts.require("./GenericCrowdsale.sol")

module.exports = async (deployer, network, [owner]) => {
  const now = Math.floor(Date.now() / 1000)
  const day = 24 * 60 * 60

  const openingTime = now
  const closingTime = now + 2 * day
  const rate = 1000
  console.log("owner: " + owner)
  deployer
    .deploy(GenericToken, "GenericToken", "GENTK", 18, 21000000)
    .then(() =>
      deployer.deploy(
        GenericCrowdsale,
        openingTime,
        closingTime,
        rate,
        owner,
        GenericToken.address
      )
    )
    .then(() => GenericToken.deployed())
    .then(genericToken => {
      console.log("Transfering tokens...")
      console.log("Token address " + GenericToken.address)

      //TODO: BIG NUMBERS! - @tim need help implementing big numbers here apparently
      genericToken.transfer(GenericCrowdsale.address, 100, {
        from: owner
      })
    })
}
