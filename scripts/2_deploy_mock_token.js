const { ethers } = require("hardhat");

async function main() {
    const [Deployer] = await ethers.getSigners();
  
    console.log("Deployer account:", Deployer.address);
    console.log("Account balance:", (await Deployer.getBalance()).toString());

    //  Deploy Mock ERC-20 contract
    console.log('\nDeploy Mock ERC-20 Token Contract .........');
    const Token = await ethers.getContractFactory('Token', Deployer);
    const name = 'Morpheuslabs Token on testnet';
    const symbol = 'MITx';
    const token = await Token.deploy(name, symbol);
    await token.deployed();

    console.log('Mock ERC-20 Token Contract: ', token.address);

    console.log('\n ===== DONE =====')
}
  
main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
});