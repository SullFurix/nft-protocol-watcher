const SupportedChainId = {
  MAINNET: 1,
  RINKEBY: 4,
  POLYGON: 137,
};

const abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "swapId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "takerAddress",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "fee",
        type: "uint256",
      },
    ],
    name: "SwapTaken",
    type: "event",
  },
];
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
    contract: {
      address: "0x9dBF0a9E6Ee13d1c7263481C7019839222f514e5",
      abi: abi,
    },
  },
  [SupportedChainId.POLYGON]: {
    name: "Polygon",
    chainId: 137,
    explorer: "https://polygonscan.com/",
    infura: "https://polygon-mainnet.infura.io/v3/",
    nativeCoin: { name: "MATIC", symbol: "MATIC", decimals: 18 },
    contract: {
      address: "0x63F43925B13E6502cbcEcBbC942f9f0c7DA35a98",
      abi: abi,
    },
  },
};

exports.supportedChainId = SupportedChainId;
exports.allSupportedChainIds = ALL_SUPPORTED_CHAIN_IDS;
exports.chainIdInfo = CHAIN_INFO;
