const dotenv = require("dotenv");
dotenv.config({ path: __dirname + "/.env" });

require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("@atixlabs/hardhat-time-n-mine");
require("hardhat-deploy");
require("hardhat-gas-reporter");
require('@openzeppelin/hardhat-upgrades');

const mnemonic = process.env.MNEMONIC

module.exports = {
    solidity: {
        compilers: [
            {
                version: "0.8.9"
            }
        ]
    },

    gasReporter: {
        enabled: true
    },

    networks: {
        development: {
            url: "http://127.0.0.1:8545",     // Localhost (default: none)
            accounts: {
                mnemonic: mnemonic,
                count: 10
            },
            live: false, 
            saveDeployments: true
        },
        matic: {
            url: process.env.MATIC_POLYGON_PROVIDER,
            accounts: [
                process.env.MAINNET_DEPLOYER,
            ],
            timeout: 900000,
            chainId: 137,
        },
        mumbai: {
            url: process.env.MUMBAI_POLYGON_PROVIDER,
            accounts: [
                process.env.TESTNET_DEPLOYER
            ],
            timeout: 20000,
            chainId: 80001
        },
        rinkeby: {
            url: process.env.RINKEBY_PROVIDER,
            accounts: [
                process.env.TESTNET_DEPLOYER
            ],
            timeout: 20000,
            chainId: 4
        },
    },

    paths: {
        sources: "./contracts",
        tests: "./tests",
        cache: "./build/cache",
        artifacts: "./build/artifacts",
        deployments: "./deployments"
    },

    etherscan: {
        apiKey: process.env.POLYGON_API_KEY,
    }
}