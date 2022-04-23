const abi = require("./ABI.js");

const SupportedChainId = {
  MAINNET: 1,
  ROPSTEN: 3,
  POLYGON: 137,
};

const ALL_SUPPORTED_CHAIN_IDS = [
  SupportedChainId.MAINNET,
  SupportedChainId.ROPSTEN,
  SupportedChainId.POLYGON,
];

const CHAIN_INFO = {
  [SupportedChainId.MAINNET]: {
    name: "Ethereum",
    chainId: 1,
    explorer: "https://etherscan.io/",
    infura: "https://mainnet.infura.io/v3/",
    nativeCoin: { name: "ETH", symbol: "ETH", decimals: 18 },
    contract: {
      address: "0xd56E1a69d97A4A0bD0942b7C6AE6eB44dBE371DE",
      abi: abi.nftDex,
      tokenAbi: abi.token,
      nftAbi: abi.nft,
      snftAbi: abi.snft,
    },
  },
  [SupportedChainId.ROPSTEN]: {
    name: "Ropsten",
    chainId: 3,
    explorer: "https://ropsten.etherscan.io/",
    infura: "https://ropsten.infura.io/v3/",
    nativeCoin: { name: "ETH", symbol: "ETH", decimals: 18 },
    contract: {
      address: "0x9ac8763bdbcbed3c04d2cd34916bb6c6537c0411",
      abi: abi.nftDex,
      tokenAbi: abi.token,
      nftAbi: abi.nft,
      snftAbi: abi.snft,
    },
  },
  [SupportedChainId.POLYGON]: {
    name: "Polygon",
    chainId: 137,
    explorer: "https://polygonscan.com/",
    infura: "https://polygon-mainnet.infura.io/v3/",
    nativeCoin: { name: "MATIC", symbol: "MATIC", decimals: 18 },
    contract: {
      address: "0xd56e1a69d97a4a0bd0942b7c6ae6eb44dbe371de",
      abi: abi.nftDex,
      tokenAbi: abi.token,
      nftAbi: abi.nft,
      snftAbi: abi.snft,
    },
  },
};

exports.supportedChainId = SupportedChainId;
exports.allSupportedChainIds = ALL_SUPPORTED_CHAIN_IDS;
exports.chainIdInfo = CHAIN_INFO;
