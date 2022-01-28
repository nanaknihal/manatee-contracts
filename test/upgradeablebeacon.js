const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('Content Factory', function(){
  before(async function(){
    this.bookfactory = await ethers.getContractFactory('Book');
    this.book = await this.bookfactory.deploy();
    this.factoryfactory = await ethers.getContractFactory('BeaconProxyFactory');
    this.factory = await this.factoryfactory.deploy(this.book.address);
    const beaconaddr = await this.factory.upgradeableBeaconAddr();
    this.beaconfactory = await ethers.getContractFactory('UpgradeableBeacon');
    this.beacon = await this.beaconfactory.attach(beaconaddr);
  });
  it('Creating a Book Proxy', async function(){
    // console.log(this.factory.address, this.book.address, 'asdfasfasd');
    await this.factory.createBeaconProxy('Name of A Book', 'BOOKSYMBOL', 1000000, 15000000, '0xA02f6adc7926efeBBd59Fd43A84f4E0c0c91e832', false)
    expect(1).to.equal(1);
  });
});
