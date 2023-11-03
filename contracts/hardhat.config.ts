import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    ganache: {
      // rpc url, change it according to your ganache configuration
      url: 'http://localhost:8545',
      // the private key of signers, change it according to your ganache user
      accounts: [
        '0xdeecffb4fb2e446ceddf0fe81ec2de4576b871156369753c9412670dfdd1dc49',
        '0x11a8417ffa102768d5382d55fe576f7489d1751c227ba8fc85d2bc711a0d34d7',
        '0xa3d9f4d4c3de0516e2dd2bb7fb18ac2e03ac932370a39c1c2403a651b1fc3ae2',
        '0x4797f73182afac28842debf6368b381e9da091a6b24d77b1a987e982e24a77a9',
        '0x0bc7048ca9366029163617461991e7a3c9a0cf505fa25160261b80c6f92bc1f5'
      ]
    },
  },
};

export default config;
