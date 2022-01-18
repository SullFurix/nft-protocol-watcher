const dotenv = require("dotenv");
dotenv.config();
const { ethers } = require("ethers");
const chainInfo = require("./constants/chainInfo.js");

const supportedChainId = chainInfo.supportedChainId;
const allSupportedChainIds = chainInfo.allSupportedChainIds;
const chainData = chainInfo.chainIdInfo;

//import .env options
const { PROVIDER, PROVIDER_KEY, CHAIN } = process.env;

let providers = {};
let contract = {};

function setup() {
  //verify all env data
  if (!CHAIN) throw new Error("CHAIN is required in .env");
  if (!PROVIDER) throw new Error("PROVIDER is required in .env");
  if (!PROVIDER_KEY) throw new Error("PROVIDER_KEY is required in .env");

  if (
    !allSupportedChainIds.includes(parseInt(CHAIN)) &&
    CHAIN.toLowerCase() !== "cross"
  )
    throw new Error("CHAIN is not supported, edit in .env");

  //create all providers
  if (CHAIN.toLowerCase() == "cross") {
    for (chain in chainData) {
      if (!chainData[chain][PROVIDER])
        throw new Error(
          "PROVIDER is not supported for your chain (" +
            chain +
            "), edit in .env"
        );
      providers[chain] = new ethers.providers.JsonRpcProvider(
        chainData[chain][PROVIDER] + PROVIDER_KEY
      );
    }
  } else {
    if (!chainData[CHAIN][PROVIDER])
      throw new Error(
        "PROVIDER is not supported for your chain (" + CHAIN + "), edit in .env"
      );
    providers[CHAIN] = new ethers.providers.JsonRpcProvider(
      chainData[CHAIN][PROVIDER] + PROVIDER_KEY
    );
  }
}

async function main() {
  //convert uint to decimals
  function fromWeiWithDecimals(amount, decimals) {
    return amount / Math.pow(10, decimals);
  }

  //convert decimals to uint
  function toWeiWithDecimals(amount, decimals) {
    return amount * Math.pow(10, decimals);
  }

  await setup();

  for (chain in providers) {
    contract[chain] = new ethers.Contract(
      chainData[chain]["contract"].address,
      chainData[chain]["contract"].abi,
      providers[chain]
    );

    //listen to the events
    contract[chain].on("SwapTaken", (swapId, takerAddress, fee) => {
      console.log(swapId.toNumber(), takerAddress, fee.toNumber());
    });

    /*
    console.log(
      contract
        .queryFilter("SwapTaken", { fromBlock: 0, toBlock: "latest" })
        .then((events) => console.log(events))
    );


    let eventFilter = contract.filters.SwapTaken();
    let events = await contract.queryFilter(eventFilter);

    for (let lock in events) {
      console.log(events[lock]);
    }*/
  }
}

main();
