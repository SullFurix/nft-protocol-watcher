const dotenv = require("dotenv");
dotenv.config();

const chainInfo = require("./constants/chainInfo.js");

const supportedChainId = chainInfo.supportedChainId;
const allSupportedChainIds = chainInfo.allSupportedChainIds;
const chainData = chainInfo.chainIdInfo;

const { ethers } = require("ethers");

const utils = require("ethers").utils;

//import .env options
const { PROVIDER, PROVIDER_KEY, CHAIN } = process.env;

let providers = {};

function setup() {
  //verify all env data
  if (!CHAIN) throw new Error("CHAIN is required in .env");
  if (!PROVIDER) throw new Error("PROVIDER is required in .env");
  if (!PROVIDER_KEY) throw new Error("PROVIDER_KEY is required in .env");

  if (!allSupportedChainIds.includes(parseInt(CHAIN)) && CHAIN.toLowerCase() !== "cross") throw new Error("CHAIN is not supported, edit in .env");

  //create all providers
  if (CHAIN.toLowerCase() == "cross"){
    for(chain in chainData) {
      if (!chainData[chain][PROVIDER])throw new Error("PROVIDER is not supported for your chain ("+chain+"), edit in .env");
      providers[chain] = new ethers.providers.JsonRpcProvider(chainData[chain][PROVIDER]+PROVIDER_KEY);
    }
  } else {
    if (!chainData[CHAIN][PROVIDER])throw new Error("PROVIDER is not supported for your chain ("+CHAIN+"), edit in .env");
    providers[CHAIN] = new ethers.providers.JsonRpcProvider(chainData[CHAIN][PROVIDER]+PROVIDER_KEY);
  }

}

async function main() {

  function normalise(amount, tokenDecimals) {
    var result = utils.formatUnits(amount, tokenDecimals);
    return result;
  }

  await setup();

  for(chain in providers) {
    console.log(await providers[chain].getTransactionCount("0x9BE948033E0430A0747BB38316f8d9173Ba93676"));
  }
}

main();
