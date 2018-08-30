// const web3 = require("web3")
const EVMRevert = require("./helpers/EVMRevert")
const chaiAsPromised = require("chai-as-promised")
// const { advanceBlock } = require("./helpers/advanceToBlock")
const { BN } = web3.utils.BN

require("chai")
  .use(chaiAsPromised)
  .should()

const Crowdsale = artifacts.require("GenericWhitelistedCrowdsale")
const Token = artifacts.require("GenericToken")

contract("Generic Whitelisted Crowdsale", async function([creator, payee0, payee1, purchaser, investor]) {
  before(async function() {
    // await advanceBlock()
  })

  beforeEach(async function() {
    const rate = new BN(1000)
    const decimals = new BN(18)
    const totalSupplyWholeDigits = new BN(21000000)

    this.totalSupply = totalSupplyWholeDigits.mul(new BN(10).pow(decimals))
    this.token = await Token.new("GenericWhitelistedToken", "GENWLTOK", decimals, totalSupplyWholeDigits)
    this.crowdsale = await Crowdsale.new(rate, creator, this.token.address)
    await this.token.transfer(this.crowdsale.address, this.totalSupply)
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
      const crowdsaleBalance = await this.token.balanceOf(this.crowdsale.address)
      expect(crowdsaleBalance.eq(this.totalSupply)).to.be.true
    })

    it("no addresses should be whitelisted by default", async function() {
      const isAddressWhitelisted = await this.crowdsale.whitelist(creator)
      isAddressWhitelisted.should.be.false
    })
  })

  describe("whitelisted crowdsale behaviours", async function() {
    it("should reject purchases for non-whitelisted address", async function() {
      const value = web3.utils.toWei(new BN(1), "ether")
      this.crowdsale.sendTransaction({ from: purchaser, value }).should.be.rejectedWith(EVMRevert)
    })

    it("should whitelist an address", async function() {
      const addressToWhitelist = purchaser
      this.crowdsale.addAddressToWhitelist(addressToWhitelist).should.be.fulfilled
      const isWhitelisted = await this.crowdsale.whitelist(addressToWhitelist)
      isWhitelisted.should.be.true
    })
  })

  describe("integration tests", async function() {
    it("should survive a series of calls", async function() {
      // here
    })
  })
})
