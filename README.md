This is a hardhat environment but many of the files are gitignored and you'll have to install yourself. You can initialize a local github repo, then initialize a hardhat project using this guide https://hardhat.org/tutorial/creating-a-new-hardhat-project.html. Then run git reset --hard origin/main 
(after setting the origin: git remote add origin https://github.com/nanaknihal/manatee-contracts.git)


# Important Addresses (Polygon Mumbai)
### Manatee token
0x87b6e03b0D57771940D7cC9E92531B6217364B3E
### Sample Book (not made with factory) (likely useless)
0x4D39C84712C9A13f4d348050E82A2Eeb45DB5e29
### Sample Provisioner (not made with factory) (likely useless)
0x01ff075517DC7dB43798751f22fEBDDa6EE75b9f
### Book Factory
0xC334b3465790bC77299D42635B25D77E3e46A78b
### Provisioner Factory
0x6A78dF871291627C5470F7a768745C3ff05741F2



# Basic Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, a sample script that deploys that contract, and an example of a task implementation, which simply lists the available accounts.

Try running some of the following tasks:

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
node scripts/sample-script.js
npx hardhat help
```
