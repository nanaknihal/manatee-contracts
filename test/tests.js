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
  const paymentToken = await generateGenericToken();
  console.log('PAYMENT TOKEN SHOULD BE ', paymentToken.address);
  const book = await bookFrom.deploy('Name of A Book', 'BOOKSYMBOL', 1000000, 15000000, paymentToken.address, false, manatAddr);
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

const scientificFormatToString = x => x.toLocaleString('fullwide', {useGrouping:false});

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
    console.log('total supply', await book.totalSupply());

    expect(await book.name()).to.equal('Name of A Book');
    expect(await book.price()).to.equal(15000000);
    expect(await book.totalSupply()).to.equal(scientificFormatToString(1000000000000000000000000));
    expect(await book.balanceOf(owner.address)).to.equal(scientificFormatToString(1000000000000000000000000));

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
      it('changing price', async function() {
        await book.connect(owner).setPrice(16000040);
        expect(await book.price()).to.equal(16000040);

        await expect(book.connect(addr2).setPrice(17000001)).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner'")
        expect(await book.price()).to.equal(16000040);
      });



      it('changing price denomination', async function(){
        await book.connect(owner).setPriceDenomination('0xdAC17F958D2ee523a2206206994597C13D831ec7');
        expect(await book.priceDenomination()).to.equal('0xdAC17F958D2ee523a2206206994597C13D831ec7');

        await expect(book.connect(addr2).setPriceDenomination('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner'")
        expect(await book.priceDenomination()).to.equal('0xdAC17F958D2ee523a2206206994597C13D831ec7');

      });
      // console.log('changing hash')
      // setBookHashTx = await book.connect(owner).setBookHash('asdfasdfasdfasfdasdfasd');
      // await setBookHashTx.wait();
      // expect(await book.bookHash()).to.equal('asdfasdfasdfasfdasdfasd');
      //
      // await expect(book.connect(addr2).setBookHash('aaaaaaaaaaa')).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner'")
      // expect(await book.bookHash()).to.equal('asdfasdfasdfasfdasdfasd');

      it('changing book', async function(){
        await book.connect(owner).setBookVersion('asdfasdfasdfasfdasdfasd', 'http://www.google.com');
        expect(await book.bookVersions('asdfasdfasdfasfdasdfasd')).to.equal('http://www.google.com');

        await book.connect(owner).setBookVersion('good hash very randum', 'weird_custom_url_format :)');
        expect(await book.bookVersions('good hash very randum')).to.equal('weird_custom_url_format :)');

        await book.connect(owner).setBookVersion('asdfasdfasdfasfdasdfasd', 'http://www.yahoo.com');
        expect(await book.bookVersions('asdfasdfasdfasfdasdfasd')).to.equal('http://www.yahoo.com');

        await book.connect(owner).removeBookVersion('asdfasdfasdfasfdasdfasd');
        expect(await book.bookVersions('asdfasdfasdfasfdasdfasd')).to.equal('');

        await expect(book.connect(addr2).setBookVersion('asdfasdfasdfasfdasdfasd', 'xzzxczxczxczxvc')).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner'")

        expect(await book.bookVersions('asdfasdfasdfasfdasdfasd')).to.equal('');
        expect(await book.bookVersions('good hash very randum')).to.equal('weird_custom_url_format :)');
    });

      it('adding and removing rental periods', async function(){
        await book.connect(owner).addRentalPeriod(30, 15000000);
        expect(await book.rentalPeriods(30)).to.equal(15000000);

        await book.connect(owner).addRentalPeriod(365, 42069000);
        expect(await book.rentalPeriods(30)).to.equal(15000000);


        await book.connect(owner).removeRentalPeriod(30);
        expect(await book.rentalPeriods(30)).to.equal(0);

        await expect(book.connect(addr2).addRentalPeriod(30, 15000000)).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner'")
        await expect(book.connect(addr2).removeRentalPeriod(30)).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner'")

        expect(await book.rentalPeriods(30)).to.equal(0);
        expect(await book.rentalPeriods(365)).to.equal(42069000);
      });

      it('enabling and disabling resale', async function(){
        await expect(book.connect(addr2).enableResale()).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner'");
        await expect(book.connect(addr2).disableResale()).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner'");
        // ensure enabling and disabling resale works from any possible state:
        await book.connect(owner).enableResale();
        expect(await book.resaleEnabled()).to.equal(true);
        await book.connect(owner).disableResale();
        expect(await book.resaleEnabled()).to.equal(false);
        await book.connect(owner).enableResale();
        expect(await book.resaleEnabled()).to.equal(true);
      });


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

// describe('Royalty shares reflect ERC20 token holders', function () {
//   it('Ensures PaymentSplitterOverrideShares shares accurately reflect those of ERC20 token holders', async function () {
//     const [owner, addr1, addr2, addrGarbage] = await ethers.getSigners();
//     const genericToken = await generateGenericToken();
//
//     //make sure it works for both owner and non-owner
//     for (const addr of [owner, addr1]) {
//       const manat = await generateManateeToken(fromAddr = addr);
//       const book = await generateBook(manat.address, fromAddr = addr);
//
//       for (const contract of [manat, book]) {
//             await contract.deployed();
//             const contractSigner = await ethers.provider.getSigner(contract.address);
//             const addrSigner = await ethers.provider.getSigner(addr.address);
//             const bookSigner = await ethers.provider.getSigner(book.address);
//
//             //move around some ETH and make sure it works
//
//             expect(await contract.pendingPaymentEth(addr.address)).to.equal(0);
//             await addrSigner.sendTransaction({to: contract.address, value: pu('10.0')});
//             expect(await contract.pendingPaymentEth(addr.address)).to.equal(pu('10.0'));
//             await addr.sendTransaction({to: contract.address, value: pu('25.5')});
//             expect(await contract.pendingPaymentEth(addr.address)).to.equal(pu('35.5'));
//             let curBalance = await ethers.provider.getBalance(addr.address)
//             tx = await contract.connect(addr)['release(address)'](addr.address);
//             // tx.wait();
//             //inaccuries due to gas fees, hence closeTo with slippage of e.g. 0.05 ETH
//             expect(await ethers.provider.getBalance(addr.address)).to.be.closeTo(curBalance.add(pu('35.5')), pu('0.05'));
//             // console.log(contract.pendingPaymentEth(addr.address))
//             // expect(await contract.pendingPaymentEth(addr.address)).to.equal(0);
//             await expect(contract.connect(addr)['release(address)'](addr.address)).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'PaymentSplitter: account is not due payment'");
//
//
//
//
//             // move around some tokens and make sure it works
//
//             expect(await contract.pendingPaymentToken(addr.address, genericToken.address)).to.equal(0);
//
//             await genericToken.transfer(contract.address, pu('10.0'));
//             expect(await contract.pendingPaymentToken(addr.address, genericToken.address)).to.equal(pu('10.0'));
//
//             await genericToken.transfer(contract.address, pu('25.5'));
//             expect(await contract.pendingPaymentToken(addr.address, genericToken.address)).to.equal(pu('35.5'));
//
//
//             // console.log('fuck', await contract.pendingPaymentToken(addr.address, genericToken.address), await contract.balanceOf(addr.address));
//             await contract.connect(addr).transfer(addrGarbage.address, (await contract.balanceOf(addr.address)).div(4));
//             // console.log('fuck1', await contract.pendingPaymentToken(addr.address, genericToken.address), await contract.balanceOf(addr.address));
//             let pendingPaymentToken = (await contract.pendingPaymentToken(addr.address, genericToken.address));
//             expect(pendingPaymentToken).to.equal(pu('26.625'));
//
//             let curTokenBalance = await genericToken.balanceOf(addr.address);
//             await contract.connect(addr)['release(address,address)'](genericToken.address, addr.address);
//
//             expect(await genericToken.balanceOf(addr.address)).to.equal(curTokenBalance.add(pendingPaymentToken));
//             expect(await contract.pendingPaymentToken(addr.address, genericToken.address)).to.equal(0);
//
//             await expect(contract.connect(addr)['release(address)'](addr.address)).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'PaymentSplitter: account is not due payment'");
//       }
//     }
//   })
// })
//
// // let [owner, addr1, addr2, addr3, addr4, addr5, addr6, addrMarketplace] = [null, null, null, null, null, null, null, null];
// // let genericToken = null;
// // let genericToken2 = null;
// // let manat = null;
// // let book = null;
// // let provisioner = null;
// // let price = null;
// // let protocolFee = null;
// // let this.marketplaceFee = null;
//
// for (const bookPrice of [15000000, 0, 1, 10]){
//   describe('Provisioner with price ' + bookPrice, function (){
//     // it('Ensures that Provisioner: charges the exact amount, can accept the same or different tokens for marketplace fee vs. book price, grants access if and only if enough is paid, returns all pending payments atomically if payment fails, can gift books, rents for the appropriate time period, and does not allow gifting to people who already own it', async function () {
//     before(async function(){
//       [this.owner, this.addr1, this.addr2, this.addr3, this.addr4, this.addr5, this.addr6, this.addrMarketplace] = await ethers.getSigners();
//
//       this.genericToken = await generateGenericToken();
//       this.genericToken2 = await generateGenericToken();
//       this.manat = await generateManateeToken();
//       this.book = await generateBook(this.manat.address);
//       await this.book.setPrice(bookPrice)
//       await this.book.setPriceDenomination(this.genericToken.address);
//       const Provisioner = await ethers.getContractFactory('Provisioner');
//       this.provisionerAddr = await this.book.provisioner();
//       this.provisioner = await Provisioner.attach(this.provisionerAddr);
//
//       await this.genericToken.transfer(this.addr2.address, 100000000);
//       await this.genericToken.transfer(this.addr3.address, 100000000);
//       await this.genericToken.transfer(this.addr4.address, 100000000);
//       await this.genericToken.transfer(this.addr5.address, 100000000);
//       await this.genericToken2.transfer(this.addr3.address, 100000000);
//       await this.genericToken2.transfer(this.addr4.address, 100000000);
//       await this.genericToken2.transfer(this.addr5.address, 100000000);
//       // approve the transactions, then do them
//       this.price = await this.book.price();
//       console.log(this.price);
//       this.protocolFee = this.price.div(10);
//       this.marketplaceFee = this.price.div(20); //give a 5% tip to the marketplace
//     });
//     // note: if you approve a small amount after a large amount, the small amount stays. so add all approval amounts for a single token into one approve() call.
//     it('buying a book with price ' + this.price, async function(){
//       await this.genericToken.connect(this.addr2).approve(this.provisioner.address, this.price.add(this.marketplaceFee));
//       expect(await this.provisioner.owners(this.addr2.address)).to.equal(false);
//       await this.provisioner.connect(this.addr2)['buy(address,uint256,address)'](this.addrMarketplace.address, this.marketplaceFee, await this.book.priceDenomination());
//       expect(await this.provisioner.owners(this.addr2.address)).to.equal(true);
//     });
//
//
//     it('ensure buying fails if the user already owns a book, for book price ' + this.price, async function(){
//       await this.genericToken.connect(this.addr2).approve(this.provisioner.address, this.price.add(this.marketplaceFee));
//       await expect(this.provisioner.connect(this.addr2)['buy(address,uint256,address)'](this.addrMarketplace.address, this.marketplaceFee, await this.book.priceDenomination())).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'recipient already owns a copy'");
//     });
//
//     //
//     it('ensure buying the book fails if any smaller price is paid, with book price ' + this.price, async function(){
//     if (this.price > 0) { //can't work for 0 test case because then price would be negative:
//       await this.genericToken.connect(owner).approve(this.provisioner.address, this.price.add(this.marketplaceFee).sub(1));
//       await expect(this.provisioner.connect(owner)['buy(address,uint256,address)'](this.addrMarketplace.address, this.marketplaceFee, await this.book.priceDenomination())).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'ERC20: transfer amount exceeds allowance'");
//     }});
//     //
//     it('ensure the amount charged is exactly what it should be, with book price ' + this.price, async function(){
//       await this.genericToken.connect(owner).approve(this.provisioner.address, this.price.add(this.marketplaceFee).add(1));
//       await this.provisioner.connect(owner)['buy(address,uint256,address)'](this.addrMarketplace.address, this.marketplaceFee, await this.book.priceDenomination());
//       expect(await this.genericToken.allowance(owner.address, this.provisioner.address)).to.equal(1);
//     });
//
//     it('ensure gifting a book to addr1 works (could be more comprehensive but this is unlikely to be a problem, with book price ' + this.price, async function(){
//       expect(await this.provisioner.owners(this.addr1.address)).to.equal(false);
//       await this.provisioner.connect(this.addr2)['buy(address,address,uint256,address)'](this.addr1.address, this.addrMarketplace.address, this.marketplaceFee, this.genericToken.address);
//       expect(await this.provisioner.owners(this.addr1.address)).to.equal(true);
//       // try again and make sure it fails because the recipient owns it
//       await expect(this.provisioner.connect(this.addr2)['buy(address,address,uint256,address)'](this.addr1.address, this.addrMarketplace.address, this.marketplaceFee, this.genericToken.address)).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'recipient already owns a copy'");
//     });
//
//     it('ensure paying the provisioner and exchange in different denominations works, with book price ' + this.price, async function(){
//       this.marketplaceFee = 1000000
//       await this.genericToken.connect(this.addr3).approve(this.provisioner.address, this.price);
//       await this.genericToken2.connect(this.addr3).approve(this.provisioner.address, this.marketplaceFee);
//       expect(await this.provisioner.owners(this.addr3.address)).to.equal(false);
//       await this.provisioner.connect(this.addr3)['buy(address,uint256,address)'](this.addrMarketplace.address, this.marketplaceFee, this.genericToken2.address);
//       expect(await this.provisioner.owners(this.addr3.address)).to.equal(true);
//       // and does not overcharge
//       await this.genericToken.connect(this.addr4).approve(this.provisioner.address, this.price.add(1));
//       await this.genericToken2.connect(this.addr4).approve(this.provisioner.address, this.marketplaceFee + 1);
//       await this.provisioner.connect(this.addr4)['buy(address,uint256,address)'](this.addrMarketplace.address, this.marketplaceFee, this.genericToken2.address);
//       expect(await this.genericToken.allowance(this.addr4.address, this.provisioner.address)).to.equal(1);
//       expect(await this.genericToken2.allowance(this.addr4.address, this.provisioner.address)).to.equal(1);
//       // and fails if too little is allowed in the book's denomination
//       if (this.price > 0) {//can't work for 0 test case because then price would be negative:
//         await this.genericToken.connect(this.addr5).approve(this.provisioner.address, this.price.sub(1));
//         await this.genericToken2.connect(this.addr5).approve(this.provisioner.address, this.marketplaceFee);
//         await expect(this.provisioner.connect(this.addr5)['buy(address,uint256,address)'](this.addrMarketplace.address, this.marketplaceFee, this.genericToken2.address)).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'ERC20: transfer amount exceeds allowance'");
//         // or in the exhange denomination
//         await this.genericToken.connect(this.addr5).approve(this.provisioner.address, this.price);
//         await this.genericToken2.connect(this.addr5).approve(this.provisioner.address, this.marketplaceFee - 1);
//         await expect(this.provisioner.connect(this.addr5)['buy(address,uint256,address)'](this.addrMarketplace.address, this.marketplaceFee, this.genericToken2.address)).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'ERC20: transfer amount exceeds allowance'");
//       }
//     });
//
//     it('transfering books works as expected (i don\'t think book price matters here but haven\'t refactored it so this is still run each iteration with different prices -- no harm in keeping it this way, unless it becomes slow, and keeping it can only be more secure+comprehensive) with book price ' + this.price, async function(){
//       // transfering books works as expected
//       await expect(this.provisioner.connect(owner).transferPurchase(this.addr6.address)).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'owner of book contract has not enabled resale'");
//       await this.book.connect(owner).enableResale();
//       await this.provisioner.connect(this.addr2).transferPurchase(this.addr6.address);
//       expect(await this.provisioner.owners(this.addr2.address)).to.equal(false);
//       expect(await this.provisioner.owners(this.addr6.address)).to.equal(true);
//       await expect(this.provisioner.connect(this.addr1).transferPurchase(this.addr6.address)).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'cannot transfer to a recipient who already owns the book'");
//       await expect(this.provisioner.connect(this.addr2).transferPurchase(this.addr6.address)).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'you must own the book before transferring your ownership'");
//       await this.provisioner.connect(this.addr6).transferPurchase(this.addr2.address);
//       expect(await this.provisioner.owners(this.addr2.address)).to.equal(true);
//       expect(await this.provisioner.owners(this.addr6.address)).to.equal(false);
//     });
//
//     it('you can\'t rent a book if you own it, with book price ' + this.price, async function(){
//       await this.book.connect(owner).addRentalPeriod(30, 15000000);
//       await expect(this.provisioner.connect(this.addr4).rent(30)).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'you already own the book you are trying to rent'");
//     });
//
//     it('only the correct period can be rented for, with book price ' + this.price, async function(){
//       await expect(this.provisioner.connect(this.addr5).rent(31)).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'invalid rental period'");
//     });
//
//     it('rental period ends at the right time and re-renting it extends it by the appropriate amount, with book price ' + this.price, async function(){
//       await this.genericToken.connect(this.addr5).approve(this.provisioner.address, 1000000000);
//       await this.genericToken2.connect(this.addr5).approve(this.provisioner.address, 1000000000);
//       let day = 24*60*60;
//       await this.provisioner.connect(this.addr5).rent(30);
//       var rental = await this.provisioner.renters(this.addr5.address);
//       expect(rental.start).to.equal(rental.expiration.sub(30*day));
//
//       const originalRentalStart = rental.start;
//       await this.provisioner.connect(this.addr5).rent(30);
//
//       rental = await this.provisioner.renters(this.addr5.address);
//       expect(rental.expiration).to.equal(originalRentalStart.add(60*day));
//       // even if time changes before renting again (as long as the time has not gone beyond the current rental period)
//       await ethers.provider.send('evm_increaseTime', [20*day]);
//       await ethers.provider.send('evm_mine');
//
//       await this.provisioner.connect(this.addr5).rent(30);
//       rental = await this.provisioner.renters(this.addr5.address);
//       expect(rental.expiration).to.equal(originalRentalStart.add(90*day));
//
//       // now, try letting the rental expire and ensuring the new rental is still the correct period
//       await ethers.provider.send('evm_increaseTime', [100*day]);
//       await ethers.provider.send('evm_mine');
//       await this.provisioner.connect(this.addr5).rent(30);
//       rental = await this.provisioner.renters(this.addr5.address);
//       expect(rental.expiration).to.equal(rental.start.add(30*day));
//
//       // try with a different time period:
//       if (bookPrice == 0){
//         await expect(this.book.connect(owner).addRentalPeriod(15, bookPrice)).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'cannot have rentals priced at 0'");
//       } else{
//         await this.book.connect(owner).addRentalPeriod(15, bookPrice); //bookPrice is parametized and should be set to 0 sometimes too to make sure it works with price of 0
//         await this.provisioner.connect(this.addr5).rent(15);
//         rental = await this.provisioner.renters(this.addr5.address);
//         expect(rental.expiration).to.equal(rental.start.add(45*day));
//       }
//
//       // test in edge case of 0 days
//       await expect(this.book.connect(owner).addRentalPeriod(0, 40000)).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'cannot have rentals for 0 days'");
//
//     });
//
//     it('transfering rentals works as expected for book price' + this.price, async function(){
//       await expect(this.provisioner.connect(this.addr6).transferRental(this.addr5.address)).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'you must rent the book before transferring your rental'");
//
//       currentRental = await this.provisioner.renters(this.addr5.address);
//       currentTimeToExp = (currentRental.expiration - currentRental.start)
//       await this.provisioner.connect(this.addr5).transferRental(this.addr6.address);
//       rental = await this.provisioner.renters(this.addr6.address);
//       expect(rental.expiration - rental.start).to.be.closeTo(currentTimeToExp, 30); //allow 30 seconds of slippage
//
//       await ethers.provider.send('evm_increaseTime', [20000*day]);
//       await ethers.provider.send('evm_mine');
//       await expect(this.provisioner.connect(this.addr6).transferRental(this.addr5.address)).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'you must rent the book before transferring your rental'");
//       await this.provisioner.connect(this.addr5).rent(30);
//       await ethers.provider.send('evm_increaseTime', [29*day]);
//       await ethers.provider.send('evm_mine');
//       await this.provisioner.connect(this.addr5).transferRental(this.addr6.address);
//       rental = await this.provisioner.renters(this.addr6.address);
//       expect(rental.expiration - rental.start).to.be.closeTo(day, 100); //allow 100 seconds
//       console.log('WHY IS THIS NOT RUNNING ')
//     });
//
//     // await book.connect(owner).enableResale();
//     // await provisioner.connect(addr2).transferPurchase(addr6.address);
//     // expect(await provisioner.owners(addr2.address)).to.equal(false);
//     // expect(await provisioner.owners(addr6.address)).to.equal(true);
//     // await expect(provisioner.connect(addr1).transferPurchase(addr6.address)).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'cannot transfer to a recipient who already owns the book'");
//     // await expect(provisioner.connect(addr2).transferPurchase(addr6.address)).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'you must own the book before transferring your ownership'");
//     // await provisioner.connect(addr6).transferPurchase(addr2.address);
//     // expect(await provisioner.owners(addr2.address)).to.equal(true);
//     // expect(await provisioner.owners(addr6.address)).to.equal(false);
//   });
// }
