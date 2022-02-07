This is a hardhat environment but many of the files are gitignored and you'll have to install yourself. You can initialize a local github repo, then initialize a hardhat project using this guide https://hardhat.org/tutorial/creating-a-new-hardhat-project.html. Then run git reset --hard origin/main 
(after setting the origin: git remote add origin https://github.com/nanaknihal/manatee-contracts.git)


# Important Addresses (Polygon Mumbai)
### Manatee token
0x87b6e03b0D57771940D7cC9E92531B6217364B3E
### Sample Book (not made with factory)
0x810183c240632c93fc25E56Fe42c65b723A3B883
### Sample Provisioner (not made with factory)
0xc779dF3f2140351EfaE3796179CA76e5e16b9C5B
### Contract Factory
0xb4aF5bdB5E4d5e0b079920A5C83082348DC529e5
### Weird Test Token
0x9996f37F7DdceCD703c3e35c9dd70cB18DB3CE29
### Weird Test Token 2
0x5B559791f4a451348435745F3214AFBfa302B05f



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
