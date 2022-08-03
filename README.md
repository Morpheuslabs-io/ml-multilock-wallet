# Time Locked Wallet

The instructions below guide you through deploying and testing smart contracts of Time Locked Wallet project. 

**DISCLAIMER:** The original smart contracts were outdated and also contain some vulnerabilities. These contracts are required to be refactored to completely solve and improve. However, a quick fix version, as requested, is released due to time constraint. Thus, these contracts should be used internally

### Requirements

- Installations:
    - NodeJS: version 16.15.1 or above ([link](https://nodejs.org/en/))
    - yarn: version 1.22.17 or above ([link](https://www.npmjs.com/package/yarn))
- Install dependencies:
    ```bash
        yarn
    ```

### Configurations

- Create your environment file
    - Create a new `.env` file
    - Copy content of `env.example` into `.env` file
    - Provide followings:
        - `POLYGON_API_KEY` and `ETHERSCAN_API_KEY`
        - `TESTNET_DEPLOYER` and `MAINNET_DEPLOYER`
        - `MUMBAI_POLYGON_PROVIDER`, `MATIC_POLYGON_PROVIDER`, and `RINKEBY_PROVIDER`

### Running Tests
- Run a command:
    ```bash
        yarn test
    ```

### Deployment

- `TokenTimeLockedWallet` is created by `TimeLockedWalletFactory` contract -> deploy `TimeLockedWalletFactory` only

- Deployment script is provided. You can either deploy it on testnet (Rinkeby/Mumbai) or Mainnet (Matic)
    - Rinkeby: run a command
    ```bash
        yarn rinkeby scripts/1_deploy_factory.js
    ```

    - Mumbai: run a command
    ```bash
        yarn mumbai scripts/1_deploy_factory.js
    ```
    
    - Mainnet: run a command
    ```bash
        yarn matic scripts/1_deploy_factory.js
    ```