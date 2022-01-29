const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('CRU(not D) Books and Provisioners from Upgradeable Beacon Proxy Factory', function(){
  before(async function(){
    [this.owner, this.addr1] = await ethers.getSigners();
    this.bookFactory = await ethers.getContractFactory('Book');
    this.provisionerFactory = await ethers.getContractFactory('Provisioner');
    const book = await this.bookFactory.deploy();
    const provisioner = await this.provisionerFactory.deploy();
    this.factoryFactory = await ethers.getContractFactory('BeaconProxyFactory');
    this.factory = await this.factoryFactory.deploy(book.address, provisioner.address);
    // const bookBeaconaddr = await this.factory.bookUpgradeableBeaconAddr();
    // const beaconFactory = await ethers.getContractFactory('UpgradeableBeacon');
    // this.bookBeacon = await beaconFactory.attach(beaconaddr);

    this.createProvisionerProxy = async (bookAddr) => {
      const proxytx = await this.factory.createProvisionerBeaconProxy(bookAddr);
      const proxyrc = await proxytx.wait();
      const [proxyCreatorAddr, proxyAddr] = proxyrc.events.find(event => (event.event === 'ProvisionerProxyCreated' && event.args[0] === this.owner.address)).args;
      return await this.provisionerFactory.attach(proxyAddr);
      }

    this.createBookProxy = async (...bookArgs) => {
      const proxytx = await this.factory.createBookBeaconProxy(...bookArgs);
      const proxyrc = await proxytx.wait();
      const [proxyCreatorAddr, proxyAddr] = proxyrc.events.find(event => (event.event === 'BookProxyCreated' && event.args[0] === this.owner.address)).args;
      return await this.bookFactory.attach(proxyAddr);
      }

  });
  it('Creating Proxies', async function(){
    const bookProxy1 = await this.createBookProxy(this.owner.address, 'Name of a Book', 'BOOKSYMBOL', 1000000, 15000000, '0xA02f6adc7926efeBBd59Fd43A84f4E0c0c91e832', false);
    const bookProxy2 = await this.createBookProxy(this.owner.address, 'Name of Another Book', 'BOOK2SYMBOL', 5500000, 20000000, '0xA02f6adc7926efeBBd59Fd43A84f4E0c0c91e832', false);
    expect(await bookProxy1.price()).to.equal(15000000);
    expect(await bookProxy2.price()).to.equal(20000000);
    const books = await this.factory.getBooks();
    expect(books.includes(bookProxy1.address) && books.includes(bookProxy2.address)).to.equal(true);
  });

  it('Creating Provisioner Proxies (note does not test that their states are independent because that is difficult to test for Provisioners and it probably does not need testing)', async function(){
    const bookProxy1 = await this.createBookProxy(this.owner.address, 'Name of a Book', 'BOOKSYMBOL', 1000000, 0, '0xA02f6adc7926efeBBd59Fd43A84f4E0c0c91e832', false);
    const bookProxy2 = await this.createBookProxy(this.owner.address, 'Name of Another Book', 'BOOK2SYMBOL', 5500000, 20000000, '0xA02f6adc7926efeBBd59Fd43A84f4E0c0c91e832', false);
    const provisionerProxy1 = await this.createProvisionerProxy(bookProxy1.address);
    // expect(await provisionerProxy1.owners(this.addr1.address)).to.equal(false);
    const provisionerProxy2 = await this.createProvisionerProxy(bookProxy2.address);

    // await provisionerProxy1['buy(address,uint256,address)'](ethers.constants.AddressZero, 0, await bookProxy1.priceToken());
    // expect(await provisionerProxy1.owners(this.owner.address)).to.equal(true);
    // expect(await provisionerProxy2.owners(this.owner.address)).to.equal(false);
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
    await this.factory.upgradeBook(this.upgradedBookImplementation.address);
    [proxy1, proxy2] = [await this.newBookFactory.attach(proxy1.address), await this.newBookFactory.attach(proxy2.address)];
    expect(await proxy1.weirdPrice()).to.equal(15000001);
    expect(await proxy2.weirdPrice()).to.equal(20000001);
  });

  it('Modifying Provisioner Logic', async function(){
    const bookProxy1 = await this.createBookProxy(this.owner.address, 'Name of a Book', 'BOOKSYMBOL', 1000000, 0, '0xA02f6adc7926efeBBd59Fd43A84f4E0c0c91e832', false);
    const bookProxy2 = await this.createBookProxy(this.owner.address, 'Name of Another Book', 'BOOK2SYMBOL', 5500000, 20000000, '0xA02f6adc7926efeBBd59Fd43A84f4E0c0c91e832', false);
    var provisionerProxy1 = await this.createProvisionerProxy(bookProxy1.address);
    // expect(await provisionerProxy1.owners(this.addr1.address)).to.equal(false);
    this.newProvisionerFactory = await ethers.getContractFactory('ModifiedProvisionerForTestingOnly');
    this.upgradedProvisionerImplementation = await this.newProvisionerFactory.deploy();
    await this.factory.upgradeProvisioner(this.upgradedProvisionerImplementation.address);
    provisionerProxy1 = await this.newProvisionerFactory.attach(provisionerProxy1.address);
    console.log(await provisionerProxy1.getFavoriteAnimal());
    expect(await provisionerProxy1.getFavoriteAnimal()).to.equal("manatee");
  });
});


// describe('CRU(not D) Provisioners from Upgradeable Beacon Proxy Factory', function(){
//   before(async function(){
//     [this.owner, this.addr1] = await ethers.getSigners();
//     this.provisionerFactory = await ethers.getContractFactory('Provisioner');
//     this.book = await this.provisionerFactory.deploy();
//     this.factoryFactory = await ethers.getContractFactory('BeaconProxyFactory');
//     this.factory = await this.factoryFactory.deploy(this.book.address);
//     const beaconaddr = await this.factory.provisionerUpgradeableBeaconAddr();
//     this.beaconFactory = await ethers.getContractFactory('UpgradeableBeacon');
//     this.beacon = await this.beaconFactory.attach(beaconaddr);
//
//
//
//     const bookProxyTx = await (await ethers.getContractFactory('Book')).createBookBeaconProxy(this.owner.address, 'Name of a Book', 'BOOKSYMBOL', 1000000, 15000000, '0xA02f6adc7926efeBBd59Fd43A84f4E0c0c91e832', false);
//     const bookProxyRc = await bookProxyTx.wait();
//     const [bookCreatorAddr, bookProxyAddr] = bookProxyRc.events.find(event => (event.event === 'BookProxyCreated' && event.args[0] === this.owner.address)).args;
//     this.bookProxy = await this.bookFactory.attach(bookProxyAddr);
//
//
//   });
//   it('Creating Provisioner Proxies', async function(){
//     const proxy1 = await this.createProvisionerProxy(this.bookProxy.address);
//     const proxy2 = await this.createBookProxy(this.owner.address, 'Name of Another Book', 'BOOK2SYMBOL', 5500000, 20000000, '0xA02f6adc7926efeBBd59Fd43A84f4E0c0c91e832', false);
//     expect(await proxy1.price()).to.equal(15000000);
//     expect(await proxy2.price()).to.equal(20000000);
//     const books = await this.factory.getBooks();
//     expect(books.includes(proxy1.address) && books.includes(proxy2.address)).to.equal(true);
//   });
//   it('Modifying Provisioner Proxies', async function(){
//     console.log('WARNING: Modifying Provisioner proxies not tested, but Provisioners can\'t be easily modified, and the logic has already been tested with books')
//   });
//   it('Modifying Provisioner Logic', async function(){
//     var proxy1 = await this.createBookProxy(this.owner.address, 'Name of a Book', 'BOOKSYMBOL', 1000000, 15000000, '0xA02f6adc7926efeBBd59Fd43A84f4E0c0c91e832', false);
//     var proxy2 = await this.createBookProxy(this.owner.address, 'Name of Another Book', 'BOOK2SYMBOL', 5500000, 20000000, '0xA02f6adc7926efeBBd59Fd43A84f4E0c0c91e832', false);
//     this.newBookFactory = await ethers.getContractFactory('ModifiedBookForTestingOnly');
//     this.upgradedBookImplementation = await this.newBookFactory.deploy();
//     await this.factory.upgrade(this.upgradedBookImplementation.address);
//     [proxy1, proxy2] = [await this.newBookFactory.attach(proxy1.address), await this.newBookFactory.attach(proxy2.address)]
//     expect(await proxy1.weirdPrice()).to.equal(15000001);
//     expect(await proxy2.weirdPrice()).to.equal(20000001);
//   });
// });
