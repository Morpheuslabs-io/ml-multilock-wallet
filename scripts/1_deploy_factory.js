const { ethers } = require("hardhat");

async function main() {
    const [Deployer] = await ethers.getSigners();
  
    console.log("Deployer account:", Deployer.address);
    console.log("Account balance:", (await Deployer.getBalance()).toString());

    //  Deploy TimeLockedWalletFactory contract
    console.log('Deploy TimeLockedWalletFactory Contract .........');
    const Factory = await ethers.getContractFactory('TimeLockedWalletFactory', Deployer);
    const factory = await Factory.deploy();
    await factory.deployed();

    console.log('TimeLockedWalletFactory Contract: ', factory.address);

    console.log('\n ===== DONE =====')
}
  
main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
});