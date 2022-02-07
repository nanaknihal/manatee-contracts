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

  this.createSampleBookProxies = async () => {
    const [owner, addr1] = await ethers.getSigners();
    let bookProxy1 = await this.createBookProxy({
      owner : owner.address,
      name : 'Name of a Book',
      symbol : 'BOOKSYMBOL',
      supply : 1000000,
      price : 15000000,
      priceToken : '0x07018e3CF542Ac3A97A9b3187DF161450B4E5986',
      resaleEnabled : false,
      category : 'nonfiction',
      description : 'this book is a good bok who is about charicters which are friendly',
      initialVersionHash : 'example_hash',
      initialVersionURI : 'example_uri'
    });
    let bookProxy2 = await this.createBookProxy({
      owner : owner.address,
      name : 'Name of Another Book',
      symbol : 'BOOK2SYMBOL',
      supply : 700000,
      price : 65000000,
      priceToken : '0x07018e3CF542Ac3A97A9b3187DF161450B4E5986',
      resaleEnabled : false,
      category : 'nonfiction',
      description : 'this book is a good bok who is about charicters which are friendly',
      initialVersionHash : 'example_hash',
      initialVersionURI : 'example_uri'
    });
    return [bookProxy1, bookProxy2]
  }
  });
  it('Creating Proxies', async function(){
    let [bookProxy1, bookProxy2] = await this.createSampleBookProxies();
    expect(await bookProxy1.price()).to.equal(15000000);
    expect(await bookProxy2.price()).to.equal(65000000);
    const books = await this.factory.getBooks();
    expect(books.includes(bookProxy1.address) && books.includes(bookProxy2.address)).to.equal(true);
  });

  it('Creating Provisioner Proxies (note does not test that their states are independent because that is difficult to test for Provisioners and it probably does not need testing)', async function(){
    let [bookProxy1, bookProxy2] = await this.createSampleBookProxies();
    const provisionerProxy1 = await this.createProvisionerProxy(bookProxy1.address);
    // expect(await provisionerProxy1.owners(this.addr1.address)).to.equal(false);
    const provisionerProxy2 = await this.createProvisionerProxy(bookProxy2.address);

    // await provisionerProxy1['buy(address,uint256,address)'](ethers.constants.AddressZero, 0, await bookProxy1.priceToken());
    // expect(await provisionerProxy1.owners(this.owner.address)).to.equal(true);
    // expect(await provisionerProxy2.owners(this.owner.address)).to.equal(false);
  });

  it('Modifying Book Proxies', async function(){
    let [bookProxy1, bookProxy2] = await this.createSampleBookProxies();
    expect(await bookProxy1.price()).to.equal(15000000);
    expect(await bookProxy2.price()).to.equal(65000000);
    await bookProxy1.setPrice(6969);
    expect(await bookProxy1.price()).to.equal(6969);
    expect(await bookProxy2.price()).to.equal(65000000);
  });
  it('Modifying Book Logic', async function(){
    let [bookProxy1, bookProxy2] = await this.createSampleBookProxies();
    this.newBookFactory = await ethers.getContractFactory('ModifiedBookForTestingOnly');
    this.upgradedBookImplementation = await this.newBookFactory.deploy();
    await this.factory.upgradeBook(this.upgradedBookImplementation.address);
    [bookProxy1, bookProxy2] = [await this.newBookFactory.attach(bookProxy1.address), await this.newBookFactory.attach(bookProxy2.address)];
    expect(await bookProxy1.weirdPrice()).to.equal(15000001);
    expect(await bookProxy2.weirdPrice()).to.equal(65000001);
  });

  it('Modifying Provisioner Logic', async function(){
    let [bookProxy1, bookProxy2] = await this.createSampleBookProxies();
    var provisionerProxy1 = await this.createProvisionerProxy(bookProxy1.address);
    expect(await provisionerProxy1.owners(this.addr1.address)).to.equal(false);
    this.newProvisionerFactory = await ethers.getContractFactory('ModifiedProvisionerForTestingOnly');
    this.upgradedProvisionerImplementation = await this.newProvisionerFactory.deploy();
    await this.factory.upgradeProvisioner(this.upgradedProvisionerImplementation.address);
    provisionerProxy1 = await this.newProvisionerFactory.attach(provisionerProxy1.address);
    expect(await provisionerProxy1.getFavoriteAnimal()).to.equal("manatee");
  });
});
