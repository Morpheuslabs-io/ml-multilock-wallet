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
        - `ETHERSCAN_API_KEY`
        - `MAINNET_DEPLOYER`, and `TESTNET_DEPLOYER` 
        - `MAINNET_PROVIDER`, and `GOERLI_PROVIDER`

### Running Tests
- Run a command:
    ```bash
        yarn test
    ```

### Deployment

- `TokenTimeLockedWallet` is created by `TimeLockedWalletFactory` contract -> deploy `TimeLockedWalletFactory` only

- Deployment script is provided. You can either deploy it on testnet (Rinkeby/Mumbai) or Mainnet (Matic)
    - Goerli: run a command
    ```bash
        yarn goerli scripts/1_deploy_factory.js
    ```
    
    - Mainnet: run a command
    ```bash
        yarn ethereum scripts/1_deploy_factory.js
    ```