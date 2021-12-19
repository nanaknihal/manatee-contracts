const { expect } = require('chai');
const { ethers } = require('hardhat');

const pu = ethers.utils.parseUnits

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
  //string memory name_, string memory symbol_, uint supply_, uint price_, address priceDenomination_, bool resaleEnabled_, address payable manatAddr
  const book = await bookFrom.deploy('Name of A Book', 'BOOKSYMBOL', 1000000000000, 15000000, '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', false, manatAddr);
  await book.deployed();
  return book;
}

const generateGenericToken = async (fromAddr = null) => {
  const GenericTestERC20 = await ethers.getContractFactory('GenericTestERC20');
  const genericTokenFrom = fromAddr ? GenericTestERC20.connect(fromAddr) : GenericTestERC20;
  const genericToken = await genericTokenFrom.deploy();
  await genericToken.deployed();
  return genericToken;
}

describe('Book Initialization', function () {
  it('Should mint a specified number of tokens to msg.sender and store the correct metadata', async function () {
    const [owner, addr1, addr2] = await ethers.getSigners();
    //TODO: try with long and empty names; large, negative, and 0 supplies, prices, etc.
    //TODO: make sure price denomination tokens with different numbers of decimals are handled correctly. This is just for the user/display; contract functions d not care
    //0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48 is USDC 5eb63bbbe01eeed093cb22bb8f5acdc3 is MD5 of 'hello world'
    //price is 15.000000 USDC
    //supply is 1T
    //resaleEnabled is false
    const manat = await generateManateeToken();
    const book = await generateBook(manat.address);

    expect(await book.name()).to.equal('Name of A Book');
    expect(await book.price()).to.equal(15000000);
    expect(await book.totalSupply()).to.equal(1000000000000);
    expect(await book.balanceOf(owner.address)).to.equal(1000000000000);

  });
});

describe('Book Updates', function () {
  it('Should allow only the owner to update the book', async function () {

    //initialize the book
    const manat = await generateManateeToken();
    const book = await generateBook(manat.address);

    const [owner, addr1, addr2] = await ethers.getSigners();

    // set of tests to be run with different owners and addresses:
    const updatingTests = async (owner, addr1, addr2) => {
      console.log('changing price')
      setPriceTx = await book.connect(owner).setPrice(16000040);
      await setPriceTx.wait();
      expect(await book.price()).to.equal(16000040);

      await expect(book.connect(addr2).setPrice(17000001)).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner'")
      expect(await book.price()).to.equal(16000040);

      console.log('changing price denomination')
      setPriceDenominationTx = await book.connect(owner).setPriceDenomination('0xdAC17F958D2ee523a2206206994597C13D831ec7');
      await setPriceDenominationTx.wait();
      expect(await book.priceDenomination()).to.equal('0xdAC17F958D2ee523a2206206994597C13D831ec7');

      await expect(book.connect(addr2).setPriceDenomination('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner'")
      expect(await book.priceDenomination()).to.equal('0xdAC17F958D2ee523a2206206994597C13D831ec7');

      // console.log('changing hash')
      // setBookHashTx = await book.connect(owner).setBookHash('asdfasdfasdfasfdasdfasd');
      // await setBookHashTx.wait();
      // expect(await book.bookHash()).to.equal('asdfasdfasdfasfdasdfasd');
      //
      // await expect(book.connect(addr2).setBookHash('aaaaaaaaaaa')).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner'")
      // expect(await book.bookHash()).to.equal('asdfasdfasdfasfdasdfasd');

      console.log('changing book')
      setBookVersionTx = await book.connect(owner).setBookVersion('asdfasdfasdfasfdasdfasd', 'http://www.google.com');
      await setBookVersionTx.wait();
      expect(await book.bookVersions('asdfasdfasdfasfdasdfasd')).to.equal('http://www.google.com');

      setBookVersionTx = await book.connect(owner).setBookVersion('good hash very randum', 'weird_custom_url_format :)');
      await setBookVersionTx.wait();
      expect(await book.bookVersions('good hash very randum')).to.equal('weird_custom_url_format :)');

      setBookVersionTx = await book.connect(owner).setBookVersion('asdfasdfasdfasfdasdfasd', 'http://www.yahoo.com');
      await setBookVersionTx.wait();
      expect(await book.bookVersions('asdfasdfasdfasfdasdfasd')).to.equal('http://www.yahoo.com');

      setBookVersionTx = await book.connect(owner).removeBookVersion('asdfasdfasdfasfdasdfasd');
      await setBookVersionTx.wait();
      expect(await book.bookVersions('asdfasdfasdfasfdasdfasd')).to.equal('');

      await expect(book.connect(addr2).setBookVersion('asdfasdfasdfasfdasdfasd', 'xzzxczxczxczxvc')).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner'")

      expect(await book.bookVersions('asdfasdfasdfasfdasdfasd')).to.equal('');
      expect(await book.bookVersions('good hash very randum')).to.equal('weird_custom_url_format :)');

      console.log('adding and removing rental periods')
      addRentalPeriodTx = await book.connect(owner).addRentalPeriod(30, 15000000);
      await addRentalPeriodTx.wait();
      expect(await book.rentalPeriods(30)).to.equal(15000000);

      addRentalPeriodTx = await book.connect(owner).addRentalPeriod(365, 42069000);
      await addRentalPeriodTx.wait();
      expect(await book.rentalPeriods(30)).to.equal(15000000);

      removeRentalPeriodTx = await book.connect(owner).removeRentalPeriod(30);
      await removeRentalPeriodTx.wait();
      expect(await book.rentalPeriods(30)).to.equal(0);

      await expect(book.connect(addr2).addRentalPeriod(30, 15000000)).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner'")
      await expect(book.connect(addr2).removeRentalPeriod(30)).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner'")

      expect(await book.rentalPeriods(30)).to.equal(0);
      expect(await book.rentalPeriods(365)).to.equal(42069000);
  }


    //run it with various callers and owners

    await updatingTests(owner, addr1, addr2);

    await expect(book.connect(addr1).transferOwnership(addr2.address)).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner'")
    transferOwnershipTx = await book.transferOwnership(addr1.address)
    await transferOwnershipTx.wait()

    await updatingTests(addr1, addr2, owner);
    await updatingTests(addr1, owner, addr2);

    await expect(book.connect(addr2).renounceOwnership()).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner'")
    renounceOwnershipTx = await book.connect(addr1).renounceOwnership()
    await renounceOwnershipTx.wait()

    await expect(book.connect(addr1).transferOwnership(addr2.address)).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner'")
    await expect(book.connect(owner).transferOwnership(addr1.address)).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner'")

  })
})

describe('Royalty shares reflect ERC20 token holders', function () {
  it('MISSING TESTS FOR FRACTIONAL SHARES (NOT FULLY OWNING BOOK OR MANAT): Ensures PaymentSplitterOverrideShares shares accurately reflect those of ERC20 token holders', async function () {
    const [owner, addr1, addr2, addrGarbage] = await ethers.getSigners();
    const genericToken = await generateGenericToken();

    //make sure it works for both owner and non-owner
    for (const addr of [owner, addr1]) {
      const manat = await generateManateeToken(fromAddr = addr);
      const book = await generateBook(manat.address, fromAddr = addr);

      for (const contract of [manat, book]) {
            await contract.deployed();
            const contractSigner = await ethers.provider.getSigner(contract.address);
            const addrSigner = await ethers.provider.getSigner(addr.address);
            const bookSigner = await ethers.provider.getSigner(book.address);

            //move around some ETH and make sure it works

            expect(await contract.pendingPaymentEth(addr.address)).to.equal(0);
            await addrSigner.sendTransaction({to: contract.address, value: pu('10.0')});
            expect(await contract.pendingPaymentEth(addr.address)).to.equal(pu('10.0'));
            await addr.sendTransaction({to: contract.address, value: pu('25.5')});
            expect(await contract.pendingPaymentEth(addr.address)).to.equal(pu('35.5'));
            let curBalance = await ethers.provider.getBalance(addr.address)
            tx = await contract.connect(addr)['release(address)'](addr.address);
            // tx.wait();
            //inaccuries due to gas fees, hence closeTo with slippage of e.g. 0.05 ETH
            expect(await ethers.provider.getBalance(addr.address)).to.be.closeTo(curBalance.add(pu('35.5')), pu('0.05'));
            // console.log(contract.pendingPaymentEth(addr.address))
            // expect(await contract.pendingPaymentEth(addr.address)).to.equal(0);
            await expect(contract.connect(addr)['release(address)'](addr.address)).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'PaymentSplitter: account is not due payment'");




            // move around some tokens and make sure it works

            expect(await contract.pendingPaymentToken(addr.address, genericToken.address)).to.equal(0);

            await genericToken.transfer(contract.address, pu('10.0'));
            expect(await contract.pendingPaymentToken(addr.address, genericToken.address)).to.equal(pu('10.0'));

            await genericToken.transfer(contract.address, pu('25.5'));
            expect(await contract.pendingPaymentToken(addr.address, genericToken.address)).to.equal(pu('35.5'));

            let curTokenBalance = await genericToken.balanceOf(addr.address)
            tx = await contract.connect(addr)['release(address,address)'](genericToken.address, addr.address);

            // tx.wait();
            //inaccuries due to gas fees, hence closeTo with slippage of e.g. 0.05 ETH
            expect(await genericToken.balanceOf(addr.address)).to.equal(curTokenBalance.add(pu('35.5')));
            await expect(contract.connect(addr)['release(address)'](addr.address)).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'PaymentSplitter: account is not due payment'");
      }
    }
  })
})

describe('Payments to Provisioner', function (){
  it('asdfasdfaf', async function () {
    const manat = await generateManateeToken();
    const book = await generateBook(manat.address);
    const Provisioner = await ethers.getContractFactory('Provisioner');
    const provisionerAddr = await book.provisioner();
    const provisioner = await Provisioner.attach(provisionerAddr);
    const genericToken = await generateGenericToken();

    const [owner, addr1, addr2, addrMarketplace] = await ethers.getSigners();
    // approve the transactoins, then do them
    marketplaceTip = (await book.price()) * 0.05 //give a 5% tip to the marketplace
    console.log((await book.price()).add(marketplaceTip))
    book.connect(addr2).approve(provisionerAddr, (await book.price()).add(marketplaceTip));
    // NOT WORKING DUE 2 APPROVING THE WRONG ADDRESS. APPROVE TO RIGHT ADDRESS, BUT THIS ITSELF SHOULD BE A TEST CASE; WHY IS IT NOT FAILING WITH AN ERROR MESSAGE DESPITE THE REQUIRES?
    expect(await provisioner.owners(addr2.address)).to.equal(false);
    provisioner.connect(addr2)['buy(address,uint256,address)'](addrMarketplace.address, marketplaceTip, book.priceDenomination())
    expect(await provisioner.owners(addr2.address)).to.equal(true);
    // gift a book to addr1
    provisioner.connect(addr2)['buy(address,address,uint256,address)'](addr1.address, addrMarketplace.address, marketplaceTip, genericToken.address)
  })
})
