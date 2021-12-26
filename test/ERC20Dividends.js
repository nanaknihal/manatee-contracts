const { expect } = require('chai');
const { ethers } = require('hardhat');

const pu = ethers.utils.parseUnits

//mints full supply to owner
const generateGenericTokenContract = async (fromAddr = null) => {
  const GenericTestERC20 = await ethers.getContractFactory('GenericTestERC20');
  const genericTokenFrom = fromAddr ? GenericTestERC20.connect(fromAddr) : GenericTestERC20;
  const genericToken = await genericTokenFrom.deploy();
  await genericToken.deployed();
  return genericToken;
}

const generateERC20DividendsTokenContract = async (fromAddr = null) => {
  const ERC20Dividends = await ethers.getContractFactory('ERC20Dividends');
  const e2dFrom = fromAddr ? ERC20Dividends.connect(fromAddr) : ERC20Dividends;
  const e2d = await e2dFrom.deploy('Token Name', 'SYMBOL', (await generateGenericTokenContract()).address);
  await e2d.deployed();
  return e2d;
}

describe('Regular ERC20 Tests work', function () {
  it('IMPORTANT TODO: RUN THE STANDARD OPENZEPPELIN TESTS ', async function () {
    expect(true);
  });
});


describe('Initialization', function() {
  before(async function() {
    [owner, addr1, addr2] = await ethers.getSigners();
    e = await generateERC20DividendsTokenContract();
  });
  it('Name and symbol are correctly initialized', async function(){
    console.log('NAME, SYMBOL', await e.name(), await e.symbol());
    expect(await e.name()).to.equal('Token Name');
    expect(await e.symbol()).to.equal('SYMBOL');
  });
});

describe('Pending payment calculation', function() {
  beforeEach(async function() {
    [owner, addr1, addr2] = await ethers.getSigners();
    e = await generateERC20DividendsTokenContract();
    let cf = await ethers.getContractFactory('GenericTestERC20');
    genericToken = cf.attach(e.paymentToken());
    //transfer 25% of shares from the owner (who deployed paymentToken and recieved all its supply) to
    ownerBalance = await e.balanceOf(owner.address);
    console.log(ownerBalance)
    // tokenContract.transfer(addr1.address, ownerBalance.mul(3).div(4));
    await genericToken.transfer(e.address, 100000);
  });

  it('Implement this', async function(){

  });

});


describe('Pulling Dividends', function() {
  beforeEach(async function() {
    [owner, addr1, addr2] = await ethers.getSigners();
    e = await generateERC20DividendsTokenContract();
    let cf = await ethers.getContractFactory('GenericTestERC20');
    genericToken = cf.attach(e.paymentToken());
    //transfer 25% of shares from the owner (who deployed paymentToken and recieved all its supply) to
    // ownerBalance = await e.balanceOf(owner.address);
    // tokenContract.transfer(addr1.address, ownerBalance.mul(3).div(4));
    await genericToken.transfer(e.address, 100000);

  });
  it('Can only pull dividends if has shares', async function(){
    await expect(e.connect(addr2).release(5)).to.be.revertedWith('ERC20Dividends: account has no shares');
    await e.connect(owner).release(5);
  });

  for (const testAmount of [50, 1, 0]) {
    it('Pulling dividends results in the sender being paid the requested amount balance', async function(){
      ownerTokenBalance = await genericToken.balanceOf(owner.address);
      let pending = await e.pendingPayment(owner.address);
      await e.connect(owner).release(testAmount);
      expect(await genericToken.balanceOf(owner.address)).to.equal(ownerTokenBalance.add(testAmount));
      // expect(await e.pendingPayment(owner.address)).to.equal(pending.sub(5));
    });
  }

  it('Can only pull the owed amount of dividends (before transfering)', async function(){
    let pending = await e.pendingPayment(owner.address);
    await expect(e.release(pending.add(1))).to.be.revertedWith('ERC20Dividends: amount requested exceeds amount owed');
    await e.release(pending);
  });

  //transfer these percents of shares and ensure dividends are treated right: (percents are used instead of decimals due to ease of multiplication by a BigNumber)
  for (const testPct of [50, 25, 80, 0, 100]) {
    it('Transferring shares results in dividends from transferred shares being distributed to sender and withheld from receiver', async function(){
      let pending = await e.pendingPayment(owner.address), ownerBalance = await e.balanceOf(owner.address), totalSupply = await e.totalSupply(), shareFrac = ownerBalance.div(totalSupply);
      await e.transfer(addr1.address, ownerBalance.mul(testPct).div(100));
      expect(await e.pendingPayment(owner.address)).to.equal(pending.mul(100 - testPct).div(100));
      expect(await e.pendingPayment(addr1.address)).to.equal(0);
      expect(await e.withheld(owner.address)).to.equal(0);
      expect(await e.withheld(addr1.address)).to.equal(pending.mul(testPct).div(100));
    });
  }

  for (const testPct of [49, 30, 99, 0, 100]) {
    it('Selling shares results in dividends from sold shares being distributed to seller and withheld from buyer, even with intermediary payment to token contract', async function(){
      let pending = await e.pendingPayment(owner.address), ownerBalance = await e.balanceOf(owner.address), totalSupply = await e.totalSupply(), shareFrac = ownerBalance.div(totalSupply);
      await e.transfer(addr1.address, ownerBalance.mul(testPct).div(100));
      let additionToPool = 100000, shareOfAddition = shareFrac.mul(additionToPool);
      await genericToken.transfer(e.address, 100000);
      expect(await e.pendingPayment(owner.address)).to.equal((pending.add(shareOfAddition)).mul(100 - testPct).div(100));
      expect(await e.pendingPayment(addr1.address)).to.equal(shareOfAddition.mul(testPct).div(100));
      expect(await e.withheld(owner.address)).to.equal(0);
      expect(await e.withheld(addr1.address)).to.equal(pending.mul(testPct).div(100));
    });
  }

  it('Selling shares results in dividends from sold shares being distributed to seller and withheld from buyer, even with intermediary payment to token contract and intermediate selling of shares', async function(){

  });


  it('Selling shares results in dividends from sold shares being distributed to seller and withheld from buyer, even with intermediary payment to token contract and intermediate selling of shares', async function(){

  });
});
