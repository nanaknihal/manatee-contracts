const { expect } = require('chai');
const { ethers } = require('hardhat');

const pu = ethers.utils.parseUnits

const generateTokenContract = async (fromAddr = null) => {
  const ERC20Dividends = await ethers.getContractFactory('ERC20Dividends');
  const e2dFrom = fromAddr ? ERC20Dividends.connect(fromAddr) : ERC20Dividends;
  const e2d = await e2dFrom.deploy();
  await e2d.deployed();
  return e2d;
}

describe('Regular ERC20 Tests work', function () {
  it('IMPORTANT TODO: RUN THE STANDARD OPENZEPPELIN TESTS ', async function () {
    const [owner, addr1, addr2] = await ethers.getSigners();
    const e = await generateTokenContract();

    expect(await book.name()).to.equal('Name of A Book');
    expect(await book.price()).to.equal(15000000);
    expect(await book.totalSupply()).to.equal(1000000000000);
    expect(await book.balanceOf(owner.address)).to.equal(1000000000000);

  });
});
