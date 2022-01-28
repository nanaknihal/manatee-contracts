const { ethers } = require('hardhat');

const generateGenericToken = async (fromAddr = null) => {
  const GenericTestERC20 = await ethers.getContractFactory('GenericTestERC20');
  const genericTokenFrom = fromAddr ? GenericTestERC20.connect(fromAddr) : GenericTestERC20;
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
  // const book = await generateBook();
  // const manateeToken = await generateManateeToken();
  // console.log('Manatee Token deployed to:', manateeToken.address);
  // const [fac1, fac2] =
  // const Book = await ethers.getContractFactory('Book');
  // book = await Book.deploy();
  // await book.deployed();
  // console.log(book.address);
  // const Provisioner = await ethers.getContractFactory('BeaconProxyFactory');
  // provisioner = await Provisioner.deploy(ethers.constants.AddressZero);
  // await provisioner.deployed();
  // console.log(provisioner.address);
  // const factoryfactory = await ethers.getContractFactory('BeaconProxyFactory');
  // const fac1 = await factoryfactory.deploy('0x4D39C84712C9A13f4d348050E82A2Eeb45DB5e29');
  // await fac1.deployed();
  // console.log(fac1.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
