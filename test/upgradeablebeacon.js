const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('Content Factory', function(){
  before(async function(){
    [this.owner, this.addr1] = await ethers.getSigners();
    this.bookFactory = await ethers.getContractFactory('Book');
    this.book = await this.bookFactory.deploy();
    this.factoryFactory = await ethers.getContractFactory('BeaconProxyFactory');
    this.factory = await this.factoryFactory.deploy(this.book.address);
    const beaconaddr = await this.factory.upgradeableBeaconAddr();
    this.beaconFactory = await ethers.getContractFactory('UpgradeableBeacon');
    this.beacon = await this.beaconFactory.attach(beaconaddr);

    this.createBookProxy = async (...bookArgs) => {
      const proxytx = await this.factory.createBeaconProxy(...bookArgs);
      const proxyrc = await proxytx.wait();
      const [proxyCreatorAddr, proxyAddr] = proxyrc.events.find(event => (event.event === 'ContentProxyCreated' && event.args[0] === this.owner.address)).args;
      return await this.bookFactory.attach(proxyAddr);
      }

  });
  it('Creating Book Proxies', async function(){
    const proxy1 = await this.createBookProxy(this.owner.address, 'Name of a Book', 'BOOKSYMBOL', 1000000, 15000000, '0xA02f6adc7926efeBBd59Fd43A84f4E0c0c91e832', false);
    const proxy2 = await this.createBookProxy(this.owner.address, 'Name of Another Book', 'BOOK2SYMBOL', 5500000, 20000000, '0xA02f6adc7926efeBBd59Fd43A84f4E0c0c91e832', false);
    expect(await proxy1.price()).to.equal(15000000);
    expect(await proxy2.price()).to.equal(20000000);
  });
  it('Modifying Book Proxies', async function(){
    const proxy1 = await this.createBookProxy(this.owner.address, 'Name of a Book', 'BOOKSYMBOL', 1000000, 15000000, '0xA02f6adc7926efeBBd59Fd43A84f4E0c0c91e832', false);
    const proxy2 = await this.createBookProxy(this.owner.address, 'Name of Another Book', 'BOOK2SYMBOL', 5500000, 20000000, '0xA02f6adc7926efeBBd59Fd43A84f4E0c0c91e832', false);
    expect(await proxy1.price()).to.equal(15000000);
    expect(await proxy2.price()).to.equal(20000000);
    await proxy1.setPrice(6969);
    expect(await proxy1.price()).to.equal(6969);
    expect(await proxy2.price()).to.equal(20000000);
  });
  it('Modifying Book Logic', async function(){
    var proxy1 = await this.createBookProxy(this.owner.address, 'Name of a Book', 'BOOKSYMBOL', 1000000, 15000000, '0xA02f6adc7926efeBBd59Fd43A84f4E0c0c91e832', false);
    var proxy2 = await this.createBookProxy(this.owner.address, 'Name of Another Book', 'BOOK2SYMBOL', 5500000, 20000000, '0xA02f6adc7926efeBBd59Fd43A84f4E0c0c91e832', false);
    this.newBookFactory = await ethers.getContractFactory('ModifiedBookForTestingOnly');
    this.upgradedBookImplementation = await this.newBookFactory.deploy();
    await this.factory.upgrade(this.upgradedBookImplementation.address);
    [proxy1, proxy2] = [await this.newBookFactory.attach(proxy1.address), await this.newBookFactory.attach(proxy2.address)]
    expect(await proxy1.weirdPrice()).to.equal(15000001);
    expect(await proxy2.weirdPrice()).to.equal(20000001);
  });
});
