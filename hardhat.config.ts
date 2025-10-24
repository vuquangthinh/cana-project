import 'dotenv/config';
import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import '@openzeppelin/hardhat-upgrades';
import 'solidity-coverage';

const {
  RPC_URL,
  PRIVATE_KEY
} = process.env as Record<string, string>;

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: false
    },
    ...(RPC_URL && PRIVATE_KEY
      ? {
          custom: {
            url: RPC_URL,
            accounts: [PRIVATE_KEY]
          }
        }
      : {})
  },
  mocha: {
    timeout: 120000
  },
  gasReporter: {
    enabled: false
  }
};

export default config;