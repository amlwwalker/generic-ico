const config = require("../config")
// const web3 = require("web3")
const EVMRevert = require("./helpers/EVMRevert")
const { EVMThrow } = require("./helpers/EVMThrow")
const { expectThrow } = require("./helpers/expectThrow")
const { advanceToBlock } = require("./helpers/advanceToBlock")
const { increaseTimeTo, duration } = require("./helpers/increaseTime")
const { latestTime } = require("./helpers/latestTime")
const chaiAsPromised = require("chai-as-promised")
const chaiDateTime = require("chai-datetime")
const chaiBigNumber = require("chai-bignumber")

const { BN } = web3.utils.BN

require("chai")
  .use(chaiBigNumber(BN))
  .use(chaiAsPromised)
  .use(chaiDateTime)
  .should()

const CappedRefundableCrowdsale = artifacts.require(
  "GenericCappedRefundableCrowdsale"
)
const CappedToken = artifacts.require("GenericToken")

function ether(n) {
  return new BN(web3.utils.toWei(new BN(n), "ether"))
}

console.log("config ", config)

if (!config.GenericCappedRefundableCrowdsale) {
  return
}
contract("Generic Capped/Refundable Crowdsale", async function([
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

  //set some parameters for the crowdsale
  const RATE = new BN(10)
  const GOAL = web3.utils.toWei(new BN(10), "ether")
  const CAP = web3.utils.toWei(new BN(20), "ether")

  beforeEach(async function() {
    //things that need to be set before each new test is run
    const block = await web3.eth.getBlock("latest")
    this.openingTime = new BN(block.timestamp + 10)
    //need to get this version of opening Time working, so we can test timings properly
    // this.openingTime = latestTime(web3) + duration.weeks(1)
    this.closingTime = this.openingTime.add(new BN(duration.weeks(1)))

    this.openingTime = new BN(this.openingTime)
    this.closingTime = new BN(this.closingTime)
    this.afterClosingTime = this.closingTime.add(new BN(duration.seconds(1)))
    //could be outside of beforeEach
    const decimals = new BN(18)
    const totalSupplyWholeDigits = new BN(21000000)
    this.totalSupply = totalSupplyWholeDigits.mul(new BN(10).pow(decimals))
    console.log(this.totalSupply.toString())

    console.log(
      "rate " +
        RATE +
        " start " +
        this.openingTime +
        " end " +
        this.closingTime +
        " CAP " +
        CAP +
        " GOAL " +
        GOAL
    )
    //configure the token and sale
    this.token = await CappedToken.new(
      "GenericCappedToken",
      "GENCPTOK",
      decimals,
      totalSupplyWholeDigits
    )
    this.crowdsale = await CappedRefundableCrowdsale.new(
      RATE,
      creator,
      this.token.address,
      this.openingTime,
      this.closingTime,
      CAP,
      GOAL
    )
    console.log("adress ", this.token.address)
    //transfer all the tokens to the crowdsale
    await this.token.transfer(this.crowdsale.address, this.totalSupply)
  })

  //do some checks that the initial values are as expected
  describe("simple initialisation", async function() {
    it("should create crowdsale with correct parameters", async function() {
      this.crowdsale.should.exist
      this.token.should.exist

      // //check the start block
      const s = await this.crowdsale.openingTime()
      console.log("start time " + s.toString())
      s.toString().should.be.equal(this.openingTime.toString())
      // //check the end block
      const e = await this.crowdsale.closingTime()
      e.toString().should.be.equal(this.closingTime.toString())

      const r = new BN(await this.crowdsale.rate())
      r.toString().should.be.equal(RATE.toString())

      const g = await this.crowdsale.goal()
      g.toString().should.be.equal(GOAL.toString())
      const c = await this.crowdsale.cap()
      c.toString().should.be.equal(CAP.toString())
    })
  })
  //check that at the moment, while the sale hasn't started
  //its not possible to transfer money
  it("should not accept payments before start", async function() {
    //todo, should this be a revert or a throw?

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

  //forward the block so we are in the crowdsale,
  //and demo that we can send money
  it("should accept payments during the sale", async function() {
    const investmentAmount = ether(1)
    const expectedTokenAmount = RATE.mul(investmentAmount)
    //move the chain to the startblock - 1 (i.e before the start)
    // console.log("block " + this.block)
    await increaseTimeTo(this.openingTime, web3)

    //this is suffering because not moving block forward successfullly yet
    //need this to pass for the following tests to pass
    const buyTokens = await this.crowdsale.buyTokens(investor, {
      value: investmentAmount,
      from: investor
    })
    buyTokens.should.be.fulfilled

    const balanceOf = await this.token.balanceOf(investor)
    balanceOf.toString().should.be.equal(expectedTokenAmount.toString())

    const totalSupply = await this.token.totalSupply()
    totalSupply.toString().should.be.equal(expectedTokenAmount.toString())
  })

  it("should reject payments after end", async function() {
    //hmm is this a block? or a timestamp?
    //not sure this is doing what i think it is...
    await increaseTimeTo(this.afterClosingTime, web3)
    await expectThrow(this.crowdsale.send(ether(1)), EVMRevert)
    await expectThrow(
      this.crowdsale.buyTokens(investor, { value: ether(1), from: investor }),
      EVMRevert
    )
    // await this.crowdsale.send(ether(1)).should.be.rejectedWith(EVMThrow)
    // await this.crowdsale
    //   .buyTokens(investor, { value: ether(1), from: investor })
    //   .should.be.rejectedWith(EVMThrow)
  })

  it("should deny refunds after end if goal was reached", async function() {
    // await advanceBlock(web3)
    await this.crowdsale.sendTransaction({ value: GOAL, from: investor })
    await advanceToBlock(this.endBlock - 10)
    await this.crowdsale
      .claimRefund({ from: investor })
      .should.be.rejectedWith(EVMRevert)
  })
})
