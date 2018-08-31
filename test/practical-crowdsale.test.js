const config = require("../config")
// const web3 = require("web3")
const EVMRevert = require("./helpers/EVMRevert")
const chaiAsPromised = require("chai-as-promised")
const { advanceBlock } = require("./helpers/advanceToBlock")
const { BN } = web3.utils.BN

require("chai")
  .use(chaiAsPromised)
  .should()

const PracticalCrowdsale = artifacts.require("PracticalCrowdsale")
const PracticalToken = artifacts.require("PracticalToken")
if (!config.PracticalCrowdsale) {
  return
}
contract("Practical Crowdsale", async function([
  creator,
  payee0,
  payee1,
  purchaser,
  investor,
  ...addresses
]) {
  // this.timeout = 10000

  before(async function() {
    // await advanceBlock()
  })
  //set some general constants
  const rate = new BN(1)
  const doll_conv = 280
  const max_$ = 10000
  const eth_cap = max_$ / doll_conv
  const cap = web3.utils.toWei(new BN(eth_cap), "ether")

  //calculate the softCap (value raised to lock in funds)
  const softCap = cap.div(new BN(2)) //half the cap

  const decimals = new BN(18)
  const totalSupplyWholeDigits = new BN(21000000)

  beforeEach(async function() {
    const block = await web3.eth.getBlock("latest")
    console.log("block time stamp " + block.timestamp)
    const openingTime = new BN(block.timestamp + 20) // 20 secs in the future
    const closingTime = new BN(openingTime + 86400 * 20) // 20 days

    this.totalSupply = totalSupplyWholeDigits.mul(new BN(10).pow(decimals))
    const latestBlock = await web3.eth.getBlock("latest")
    console.log("block timestamp " + latestBlock.timestamp)
    // console.log("opening time " + openingTime)

    this.token = await PracticalToken.new(
      "GenericWhitelistedToken",
      "GENWLTOK",
      decimals,
      totalSupplyWholeDigits
    )

    this.crowdsale = await PracticalCrowdsale.new(
      rate,
      creator,
      this.token.address,
      cap,
      softCap,
      openingTime,
      closingTime
    )
    await this.token.transfer(this.crowdsale.address, this.totalSupply)
    await advanceBlock(web3)
  })

  describe("inheritance", function() {
    it("should inherit from WhitelistedCrowdsale", function() {
      expect(this.crowdsale.addAddressToWhitelist).to.be.a("function")
      expect(this.crowdsale.addAddressesToWhitelist).to.be.a("function")
      expect(this.crowdsale.removeAddressFromWhitelist).to.be.a("function")
      expect(this.crowdsale.removeAddressesFromWhitelist).to.be.a("function")
      expect(this.crowdsale.whitelist).to.be.a("function")
    })
  })

  describe("check defaults", async function() {
    it("should have the total supply assigned to the crowdsale", async function() {
      const crowdsaleBalance = await this.token.balanceOf(
        this.crowdsale.address
      )
      expect(crowdsaleBalance.eq(this.totalSupply)).to.be.true
    })

    it("no addresses should be whitelisted by default", async function() {
      const isAddressWhitelisted = await this.crowdsale.whitelist(creator)
      isAddressWhitelisted.should.be.false
    })
  })

  describe("whitelisted crowdsale behaviors", async function() {
    it("should reject purchases for non-whitelisted address", async function() {
      const value = web3.utils.toWei(new BN(1), "ether")
      this.crowdsale
        .sendTransaction({ from: purchaser, value })
        .should.be.rejectedWith(EVMRevert)
    })

    it("should whitelist an address", async function() {
      const addressToWhitelist = purchaser
      this.crowdsale.addAddressToWhitelist(addressToWhitelist).should.be
        .fulfilled
      const isWhitelisted = await this.crowdsale.whitelist(addressToWhitelist)
      isWhitelisted.should.be.true
    })
  })
  describe("capped crowd sale behaviours", async function() {
    //we want to test that the default is that the cap has not been reached
    //then we want to send a transaction filling the crowdsale
    //then test that you cannot deposit any more funds
    it("should not have reached the cap", async function() {
      const capReached = await this.crowdsale.capReached()
      expect(capReached).to.be.false
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

  describe("Integration tests", async function() {
    const toWhitelist = [payee0, payee1, purchaser, investor]
    const blacklisted = [...addresses]
    const value = web3.utils.toWei(new BN(1), "ether")
    beforeEach(async function() {
      // whitelisted several addresses
      await this.crowdsale.addAddressesToWhitelist(toWhitelist.slice(1))

      // send funds
      console.log("sending transaction from other whitelisted address")
      await this.crowdsale.sendTransaction({ from: toWhitelist[1], value })
        .should.be.fulfilled
      await this.crowdsale.sendTransaction({ from: toWhitelist[2], value })
        .should.be.fulfilled
      await this.crowdsale.sendTransaction({ from: toWhitelist[3], value })
        .should.be.fulfilled
      await advanceBlock(web3)

      const b1 = await this.token.balanceOf(toWhitelist[1])
      const b2 = await this.token.balanceOf(toWhitelist[2])
      const b3 = await this.token.balanceOf(toWhitelist[3])

      expect(b1.eq(value)).to.be.true
      expect(b2.eq(value)).to.be.true
      expect(b3.eq(value)).to.be.true
    })

    it("should survive a series of deposits until cap is reached", async function() {
      // so first do some deposits, as above
      // checking cap has not been reached
      // then do a large deposit filling the crowdsale
      // check the cap has been reached
      // then attempt to do another deposit
      // should fail
      const increase = cap.div(new BN(3))
      const isAddressWhitelisted = await this.crowdsale.whitelist(
        toWhitelist[1]
      )
      isAddressWhitelisted.should.be.true
      const increaseInEth = web3.utils.fromWei(new BN(increase), "ether")
      console.log("investing in eth: " + increaseInEth + " vs wei " + increase)
      await this.crowdsale.sendTransaction({ from: toWhitelist[1], increase })
        .should.be.fulfilled
      await this.crowdsale.sendTransaction({ from: toWhitelist[2], increase })
        .should.be.fulfilled
      const difference = cap.sub(new BN(this.crowdsale.weiRaised()))
      console.log("amount left until raise is capped " + difference)
      await this.crowdsale.sendTransaction({ from: toWhitelist[3], difference })
        .should.be.fulfilled
      const capReached = await this.crowdsale.capReached()
      expect(capReached).to.be.true
    })

    it("should survive a series of calls", async function() {
      // whitelisted several addresses
      await this.crowdsale.addAddressesToWhitelist(toWhitelist.slice(1))

      // send funds
      console.log("sending transaction from other whitelisted address")
      await this.crowdsale.sendTransaction({ from: toWhitelist[1], value })
        .should.be.fulfilled
      await this.crowdsale.sendTransaction({ from: toWhitelist[2], value })
        .should.be.fulfilled
      await this.crowdsale.sendTransaction({ from: toWhitelist[3], value })
        .should.be.fulfilled
      await advanceBlock(web3)

      const b1 = await this.token.balanceOf(toWhitelist[1])
      const b2 = await this.token.balanceOf(toWhitelist[2])
      const b3 = await this.token.balanceOf(toWhitelist[3])

      expect(b1.eq(value)).to.be.true
      expect(b2.eq(value)).to.be.true
      expect(b3.eq(value)).to.be.true
      // someone gets whitelisted
      console.log("Someone gets whitelisted " + toWhitelist[0])
      await this.crowdsale.addAddressToWhitelist(toWhitelist[0])

      // someone else tries to send money when not whitelisted
      console.log("Someone not whitelisted sends money " + blacklisted[0])
      this.crowdsale
        .sendTransaction({ from: blacklisted[0], value })
        .should.be.rejectedWith(EVMRevert)

      // whitelisted address sends funds
      console.log("Someone whitelisted sends funds " + toWhitelist[0])
      const isAddressWhitelisted = await this.crowdsale.whitelist(
        toWhitelist[0]
      )
      isAddressWhitelisted.should.be.true

      await this.crowdsale.sendTransaction({ from: toWhitelist[0], value })
        .should.be.fulfilled

      // check that tokens were issued
      console.log("check whitelisted balance " + toWhitelist[0])
      const whitelistedOneBalance = await this.token.balanceOf(toWhitelist[0])
      await advanceBlock(web3)
      expect(whitelistedOneBalance.eq(value)).to.be.true

      // whitelisted several addresses
      await this.crowdsale.addAddressesToWhitelist(toWhitelist.slice(1))

      // remove someone from the whitelist
      this.crowdsale.removeAddressFromWhitelist(toWhitelist[1])

      // that address sends funds
      this.crowdsale
        .sendTransaction({ from: toWhitelist[1], value })
        .should.be.rejectedWith(EVMRevert)
    })
  })
})
