const { ethers } = require('hardhat');

const generateGenericToken = async (fromAddr = null) => {
  const GenericTestERC20 = await ethers.getContractFactory('GenericTestERC20');
  const genericTokenFrom = fromAddr ? GenericTestERC20.connect(fromAddr) : GenericTestERC20;
  const genericToken = await genericTokenFrom.deploy();
  await genericToken.deployed();
  return genericToken;
}

const generateWeirdTestERC20 = async (fromAddr = null) => {
  const WeirdTestERC20 = await ethers.getContractFactory('WeirdTestERC20');
  const genericTokenFrom = fromAddr ? WeirdTestERC20.connect(fromAddr) : WeirdTestERC20;
  const genericToken = await genericTokenFrom.deploy();
  await genericToken.deployed();
  return genericToken;
}

const generateManateeToken = async (fromAddr = null) =>{
  const ManateeToken = await ethers.getContractFactory('ManateeToken');
  const manaTFrom = fromAddr ? ManateeToken.connect(fromAddr) : ManateeToken;
  const manaT = await manaTFrom.deploy();
  await manaT.deployed();
  return manaT;
}

const generateBook = async (manatAddr, fromAddr = null) => {
  const Book = await ethers.getContractFactory('Book');
  const bookFrom = fromAddr ? Book.connect(fromAddr) : Book;
  //string memory name_, string memory symbol_, uint supply_, uint price_, address priceToken_, bool resaleEnabled_, address payable manatAddr
  const paymentToken = await generateGenericToken();
  console.log('PAYMENT TOKEN SHOULD BE ', paymentToken.address);
  const book = await bookFrom.deploy('Name of A Book', 'BOOKSYMBOL', 1000000, 15000000, paymentToken.address, false, manatAddr);
  await book.deployed();
  return book;
}

async function main() {
  // const manateeToken = await generateManateeToken();
  // console.log('Manatee Token deployed to:', manateeToken.address);
  // const [fac1, fac2] =
  // const Book = await ethers.getContractFactory('Book');
  // const book = await Book.deploy();
  // await book.deployed();
  // console.log('Book', book.address);
  // const Provisioner = await ethers.getContractFactory('Provisioner');
  // const provisioner = await Provisioner.deploy();
  // await provisioner.deployed();
  // console.log('Provisioner', provisioner.address);
  // // const factoryfactory = await ethers.getContractFactory('BeaconProxyFactory');
  // // const fac1 = await factoryfactory.deploy('0x4D39C84712C9A13f4d348050E82A2Eeb45DB5e29');
  // // await fac1.deployed();
  // // console.log(fac1.address);
  // const bookFactory = await ethers.getContractFactory('Book');
  // const provisionerFactory = await ethers.getContractFactory('Provisioner');
  // const book = bookFactory.attach('0xa8D1419Fd748dAB80BA3E4E13bc98395D967B8b1');
  // const provisioner = provisionerFactory.attach('0xD006A2B4cDa4a49A5a89650fFF690B261b92B02E');
  // // const provisioner = await provisionerFactory.deploy();
  const factoryFactory = await ethers.getContractFactory('BeaconProxyFactory');
  const factory = await factoryFactory.deploy('0x810183c240632c93fc25E56Fe42c65b723A3B883', '0xc779dF3f2140351EfaE3796179CA76e5e16b9C5B');
  console.log('Factory', factory.address);
  // const factory = await factoryFactory.attach('0x8F02dAC5E2FA7ee3f8B40A62e374093A120f90Ae');
  // const upgradeBook = await factory.upgradeBook(book.address);
  // const upgradeProvisioner = await factory.upgradeProvisioner(provisioner.address);
  // const upgradeBook = await factory.upgradeBook(book.address);
  // console.log(upgradeProvisioner);
  // const upgradeBook = await factory.upgradeBook(book.address);
  // console.log(upgradeBook);
  // // const [owner, addr1, addr2] = await ethers.getSigners();
  // // const provider = new ethers.providers.JsonRpcProvider('https://rpc-mumbai.maticvigil.com')
  // // console.log('BOOK: ', await provider.getCode(book.address), 'PROVISIONER: ', await provider.getCode(provisioner.address), 'OWNER: ', await provider.getCode(owner.address));
  // // const factory = await factoryFactory.deploy(book.address, provisioner.address);





  // console.log('FACTORY ADDRESS', factory.address);
  // console.log((await generateWeirdTestERC20()).address, (await generateWeirdTestERC20()).address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
