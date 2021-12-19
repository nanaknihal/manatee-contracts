This is a hardhat environment but many of the files are gitignored and you'll have to install yourself. You can initialize a local github repo, then initialize a hardhat project using this guide https://hardhat.org/tutorial/creating-a-new-hardhat-project.html. Then run git reset --hard origin/main 
(after setting the origin: git remote add origin https://github.com/nanaknihal/manatee-contracts.git)


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
