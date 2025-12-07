
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");

module.exports = {
  solidity: "0.8.19",
  paths: {
    artifacts: "./artifacts",
    sources: "./contracts",
    tests: "./test"
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545"
    }
  }
};
