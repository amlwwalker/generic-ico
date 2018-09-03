const config = require("../config")
// const web3 = require("web3")
const EVMRevert = require("./helpers/EVMRevert")
const EVMThrow = require("./helpers/EVMThrow")
const { advanceToBlock } = require("./helpers/advanceToBlock")

const chaiAsPromised = require("chai-as-promised")
const chaiDateTime = require("chai-datetime")
const chaiBigNumber = require("chai-bignumber")

const { advanceBlock } = require("./helpers/advanceToBlock")
const { BN } = web3.utils.BN

require("chai")
  .use(chaiBigNumber(BN))
  .use(chaiAsPromised)
  .use(chaiDateTime)
  .should()

const CappedCrowdsale = artifacts.require("GenericCappedCrowdsale")
const CappedToken = artifacts.require("GenericToken")

function ether(n) {
  return new BN(web3.utils.toWei(new BN(n), "ether"))
}

console.log("config ", config)
if (!config.GenericCappedCrowdsale) {
  return
}
contract("Generic Capped Crowdsale", async function([
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

  const RATE = new BN(10)
  const GOAL = web3.utils.toWei(new BN(10), "ether")
  const CAP = web3.utils.toWei(new BN(20), "ether")

  beforeEach(async function() {
    const block = await web3.eth.getBlock("latest")
    this.startBlock = new BN(block.timestamp + 10)
    this.endBlock = new BN(block.timestamp + 20)

    const decimals = new BN(18)
    const totalSupplyWholeDigits = new BN(21000000)
    this.totalSupply = totalSupplyWholeDigits.mul(new BN(10).pow(decimals))
    console.log(this.totalSupply.toString())

    console.log(
      "rate " +
        RATE +
        " start " +
        this.startBlock +
        " end " +
        this.endBlock +
        " CAP " +
        CAP +
        " GOAL " +
        GOAL
    )
    this.token = await CappedToken.new(
      "GenericCappedToken",
      "GENCPTOK",
      decimals,
      totalSupplyWholeDigits
    )
    this.crowdsale = await CappedCrowdsale.new(
      RATE,
      creator,
      this.token.address,
      this.startBlock,
      this.endBlock,
      CAP,
      GOAL
    )
    console.log("adress ", this.token.address)
    await this.token.transfer(this.crowdsale.address, this.totalSupply)
  })

  describe("simple initialisation", async function() {
    it("should create crowdsale with correct parameters", async function() {
      this.crowdsale.should.exist
      this.token.should.exist

      // //check the start block
      const s = await this.crowdsale.openingTime()
      console.log("start time " + s.toString())
      s.toString().should.be.equal(this.startBlock.toString())
      // //check the end block
      const e = await this.crowdsale.closingTime()
      e.toString().should.be.equal(this.endBlock.toString())

      const r = new BN(await this.crowdsale.rate())
      r.toString().should.be.equal(RATE.toString())

      const g = await this.crowdsale.goal()
      g.toString().should.be.equal(GOAL.toString())
      const c = await this.crowdsale.cap()
      c.toString().should.be.equal(CAP.toString())
    })
  })
  it("should not accept payments before start", async function() {
    await this.crowdsale
      .send(web3.utils.toWei(new BN(1), "ether"))
      .should.be.rejectedWith(EVMRevert)
    await this.crowdsale
      .buyTokens(investor, {
        from: investor,
        value: web3.utils.toWei(new BN(1), "ether")
      })
      .should.be.rejectedWith(EVMRevert)
  })

  it("should accept payments during the sale", async function() {
    const investmentAmount = ether(1)
    const expectedTokenAmount = RATE.mul(investmentAmount)
    //move the chain to the startblock - 1 (i.e before the start)
    // console.log("block " + this.block)

    this.blockNumber = await web3.eth.getBlockNumber()
    const s = await this.crowdsale.openingTime()
    console.log("start time " + s.toString())

    await advanceToBlock(this.blockNumber + 10)
    const block = await web3.eth.getBlock("latest")
    console.log("timestamp;;;; " + block.timestamp)
    console.log(
      "block time stamp " + block.timestamp + " block number" + this.blockNumber
    )

    // const buyTokens = await this.crowdsale.buyTokens(investor, {
    //   value: investmentAmount,
    //   from: investor
    // })
    // buyTokens.should.be.fulfilled

    // const balanceOf = await this.token.balanceOf(investor)
    // balanceOf.should.be.bignumber.equal(expectedTokenAmount)

    // const totalSupply = await this.token.totalSupply()
    // totalSupply.should.be.bignumber.equal(expectedTokenAmount)
  })
})
