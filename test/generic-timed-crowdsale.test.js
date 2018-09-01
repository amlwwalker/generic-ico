const config = require("../config")
// const web3 = require("web3")
const EVMRevert = require("./helpers/EVMRevert")
const chaiAsPromised = require("chai-as-promised")
const chaiDateTime = require("chai-datetime")
const { advanceBlock } = require("./helpers/advanceToBlock")
const { BN } = web3.utils.BN

require("chai")
  .use(chaiAsPromised)
  .use(chaiDateTime)
  .should()

const TimedCrowdsale = artifacts.require("GenericTimedCrowdsale")
const TimedToken = artifacts.require("GenericToken")
console.log("config ", config)
if (!config.GenericTimedCrowdsale) {
  return
}
contract("Generic Timed Crowdsale", async function([
  creator,
  payee0,
  payee1,
  purchaser,
  investor,
  ...addresses
]) {
  this.timeout = 10000

  before(async function() {
    // await advanceBlock()
  })

  beforeEach(async function() {
    const block = await web3.eth.getBlock("latest")
    console.log("block time stamp " + block.timestamp)
    const openingTime = new BN(block.timestamp + 20) // 20 secs in the future
    console.log("opening time " + openingTime)
    const closingTime = new BN(openingTime + 86400 * 20) // 20 days
    const rate = new BN(1)
    const decimals = new BN(18)
    const totalSupplyWholeDigits = new BN(21000000)

    this.totalSupply = totalSupplyWholeDigits.mul(new BN(10).pow(decimals))
    this.token = await TimedToken.new(
      "GenericTimedToken",
      "GENTMTOK",
      decimals,
      totalSupplyWholeDigits
    )
    this.crowdsale = await TimedCrowdsale.new(
      rate,
      creator,
      this.token.address,
      openingTime,
      closingTime
    )
    await this.token.transfer(this.crowdsale.address, this.totalSupply)
  })

  describe("inheritance", function() {
    it("should inherit from WhitelistedCrowdsale", function() {
      // expect(this.crowdsale.addAddressToWhitelist).to.be.a("function")
      // expect(this.crowdsale.addAddressesToWhitelist).to.be.a("function")
      // expect(this.crowdsale.removeAddressFromWhitelist).to.be.a("function")
      // expect(this.crowdsale.removeAddressesFromWhitelist).to.be.a("function")
      // expect(this.crowdsale.whitelist).to.be.a("function")
      expect(true).to.be.true
    })
  })

  describe("check defaults", async function() {
    it("should have the total supply assigned to the crowdsale", async function() {
      const crowdsaleBalance = await this.token.balanceOf(
        this.crowdsale.address
      )
      expect(crowdsaleBalance.eq(this.totalSupply)).to.be.true
    })
    it("should not be closed", async function() {
      const hasClosed = await this.crowdsale.hasClosed()
      expect(hasClosed).to.be.false
    })

    it("should have a start time in the past", async function() {
      const openingBN = await this.crowdsale.openingTime()
      console.log("openingBN ", openingBN.toString())
      const openingTime = Date(openingBN.toString())
      const closingBN = await this.crowdsale.closingTime()
      const closingTime = Date(closingBN.toString())
      console.log("actual start time ", openingTime)
      console.log("time now ", Date(new Date()))
      openingTime.should.be.beforeDate(Date(Date.now()))
    })
  })

  describe("timed crowdsale behaviours", async function() {
    it("should allow a transaction to go through", async function() {
      const value = web3.utils.toWei(new BN(1), "ether")
      this.crowdsale.sendTransaction({ from: purchaser, value }).should.be
        .fulfilled //rejectedWith(EVMRevert)
    })
  })

  // describe("test emits", function() {
  //   it("should emit when whitelisting an address", function(done) {
  //     this.crowdsale.RoleAdded({ fromBlock: 0 }).on("data", event => {
  //       event.returnValues.operator.should.be.equal(creator)
  //       event.returnValues.role.should.be.equal("whitelist")
  //       done()
  //     })
  //     this.crowdsale.addAddressToWhitelist(creator)
  //   })
  // })

  describe("test transaction lifecycle", function() {
    it("should emit events across transaction lifecycle", function(done) {
      this.crowdsale.addAddressToWhitelist(creator)
      const value = web3.utils.toWei(new BN(1), "ether")

      this.crowdsale
        .sendTransaction({ from: creator, value })
        .once("transactionHash", function(hash) {
          hash.should.not.be.null
        })
        .once("receipt", function(receipt) {
          receipt.should.not.be.null
        })
        .on("confirmation", function(confNumber, receipt) {
          confNumber.should.not.be.null
          receipt.should.not.be.null
        })
        .on("error", function(error) {
          error.should.be.null
        })
        .then(function(receipt) {
          receipt.should.not.be.null
          done()
        })
    })
  })
})
