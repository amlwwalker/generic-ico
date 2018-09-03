// const { ethGetBlock } = require("web3")

// Returns the time of the last mined block in seconds
async function latestTime(web3) {
  const block = await web3.eth.getBlock("latest")
  return block.timestamp
}

module.exports = {
  latestTime
}
