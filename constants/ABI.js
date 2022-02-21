const dexabi = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_swapId",
        type: "uint256",
      },
    ],
    name: "swap",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "id",
            type: "uint256",
          },
          {
            internalType: "uint8",
            name: "status",
            type: "uint8",
          },
          {
            components: [
              {
                internalType: "uint8",
                name: "assetType",
                type: "uint8",
              },
              {
                internalType: "address",
                name: "tokenAddress",
                type: "address",
              },
              {
                internalType: "uint256[]",
                name: "tokenIds",
                type: "uint256[]",
              },
              {
                internalType: "uint256[]",
                name: "amounts",
                type: "uint256[]",
              },
            ],
            internalType: "struct NFTProtocolDEX.Component[][2]",
            name: "components",
            type: "tuple[][2]",
          },
          {
            internalType: "address",
            name: "makerAddress",
            type: "address",
          },
          {
            internalType: "address",
            name: "takerAddress",
            type: "address",
          },
          {
            internalType: "bool",
            name: "whitelistEnabled",
            type: "bool",
          },
        ],
        internalType: "struct NFTProtocolDEX.Swap",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
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

const erc20abi = [
  {
    constant: true,
    inputs: [],
    name: "name",
    outputs: [
      {
        name: "",
        type: "string",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "totalSupply",
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [
      {
        name: "",
        type: "uint8",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [
      {
        name: "",
        type: "string",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
];

const erc721abi = [
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
];

const erc1155abi = [
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "uri",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
];

exports.nftDex = dexabi;
exports.token = erc20abi;
exports.nft = erc721abi;
exports.snft = erc1155abi;
