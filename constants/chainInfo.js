const SupportedChainId = {
  MAINNET: 1,
  RINKEBY: 4,
  POLYGON: 137,
};

const ALL_SUPPORTED_CHAIN_IDS = [
  SupportedChainId.MAINNET,
  SupportedChainId.RINKEBY,
  SupportedChainId.POLYGON,
];

const CHAIN_INFO = {
  [SupportedChainId.MAINNET]: {
    name: "Ethereum",
    chainId: 1,
    explorer: "https://etherscan.io/",
    infura: "https://mainnet.infura.io/v3/",
    nativeCoin: { name: "ETH", symbol: "ETH", decimals: 18 },
  },
  [SupportedChainId.RINKEBY]: {
    name: "Rinkeby",
    chainId: 4,
    explorer: "https://rinkeby.etherscan.io/",
    infura: "https://rinkeby.infura.io/v3/",
    nativeCoin: { name: "Rinkeby ETH", symbol: "rinkETH", decimals: 18 },
  },
  [SupportedChainId.POLYGON]: {
    name: "Polygon",
    chainId: 137,
    explorer: "https://polygonscan.com/",
    infura: "https://polygon-mainnet.infura.io/v3/",
    nativeCoin: { name: "MATIC", symbol: "MATIC", decimals: 18 },
  },
};

exports.supportedChainId = SupportedChainId;
exports.allSupportedChainIds = ALL_SUPPORTED_CHAIN_IDS;
exports.chainIdInfo = CHAIN_INFO;
