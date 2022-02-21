const dotenv = require("dotenv");
dotenv.config();
const { ethers } = require("ethers");
const fetch = require("node-fetch");
const fs = require("fs");

const chainInfo = require("./constants/chainInfo.js");

const supportedChainId = chainInfo.supportedChainId;
const allSupportedChainIds = chainInfo.allSupportedChainIds;
const chainData = chainInfo.chainIdInfo;

//import .env options
const { PROVIDER, PROVIDER_KEY, CHAIN } = process.env;

let providers = {};
let contract = {};
let swaps = {};

function setup() {
  //verify all env data
  if (!CHAIN) throw new Error("CHAIN is required in .env");
  if (!PROVIDER) throw new Error("PROVIDER is required in .env");
  if (!PROVIDER_KEY) throw new Error("PROVIDER_KEY is required in .env");

  console.log("chain: " + CHAIN);
  console.log("provider: " + PROVIDER);
  console.log("provider key: " + PROVIDER_KEY + "\n");

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

//convert uint to decimals
function fromWeiWithDecimals(amount, decimals) {
  return amount / Math.pow(10, decimals);
}

//convert decimals to uint
function toWeiWithDecimals(amount, decimals) {
  return amount * Math.pow(10, decimals);
}

async function fetcher(...args) {
  let res = undefined;
  try {
    res = await fetch(...args);
    res = res.json();
  } catch (e) {
    const res = undefined;
  }
  return res;
}

async function getSwap(swap, side) {
  let itemData = {};
  for (let item in swap.components[side]) {
    if (swap.components[side][item].assetType == "0") {
      let snftContract = new ethers.Contract(
        swap.components[side][item].tokenAddress,
        chainData[chain]["contract"].snftAbi,
        providers[chain]
      );

      for (let token in swap.components[side][item].tokenIds) {
        itemData[item] = {
          type: swap.components[side][item].assetType,
          tokenAddress: swap.components[side][item].tokenAddress,
          tokenURI: await snftContract.uri(
            swap.components[side][item].tokenIds[token].toString()
          ),
          tokenId: swap.components[side][item].tokenIds[token].toString(),
          amounts: swap.components[side][item].amounts[token].toString(),
          metadata: await fetcher(
            await snftContract.uri(
              swap.components[side][item].tokenIds[token].toString()
            )
          ),
        };
      }
    } else if (swap.components[side][item].assetType == "1") {
      let nftContract = new ethers.Contract(
        swap.components[side][item].tokenAddress,
        chainData[chain]["contract"].nftAbi,
        providers[chain]
      );

      itemData[item] = {
        type: swap.components[side][item].assetType,
        tokenAddress: swap.components[side][item].tokenAddress,
        name: await nftContract.name(),
        symbol: await nftContract.symbol(),
        tokenURI: await nftContract.tokenURI(
          swap.components[side][item].tokenIds[0].toString()
        ),
        tokenId: swap.components[side][item].tokenIds[0].toString(),
        metadata: await fetcher(
          await nftContract.tokenURI(
            swap.components[side][item].tokenIds[0].toString()
          )
        ),
      };
    } else if (swap.components[side][item].assetType == "2") {
      let tokenContract = new ethers.Contract(
        swap.components[side][item].tokenAddress,
        chainData[chain]["contract"].tokenAbi,
        providers[chain]
      );

      itemData[item] = {
        type: swap.components[side][item].assetType,
        tokenAddress: swap.components[side][item].tokenAddress,
        name: await tokenContract.name(),
        symbol: await tokenContract.symbol(),
        amounts: fromWeiWithDecimals(
          swap.components[side][item].amounts[0].toString(),
          await tokenContract.decimals()
        ),
      };
    } else if (swap.components[side][item].assetType == "3") {
      itemData[item] = {
        type: swap.components[side][item].assetType,
        tokenAddress: swap.components[side][item].tokenAddress,
        name: chainData[chain].nativeCoin.name,
        symbol: chainData[chain].nativeCoin.name,
        amounts: fromWeiWithDecimals(
          swap.components[side][item].amounts[0].toString(),
          chainData[chain].nativeCoin.decimals
        ),
      };
    } else {
      console.log(swap.components[side][item].assetType);
      console.log("Unknown asset type");
    }
  }
  return itemData;
}

async function main() {
  await setup();

  for (chain in providers) {
    swaps[chain] = {};
    contract[chain] = new ethers.Contract(
      chainData[chain]["contract"].address,
      chainData[chain]["contract"].abi,
      providers[chain]
    );

    /*if (chain == 3) {
      let swapId = 14;

      let swap = await contract[chain].swap(swapId);

      let take = await getSwap(swap, 0);

      let give = await getSwap(swap, 1);

      swaps[chain][swapId] = {
        id: swapId,
        take: take,
        give: give,
      };

    }*/

    async function newSwap(swapId) {
      let swap = await contract[chain].swap(swapId.toString());

      let take = await getSwap(swap, 0);

      let give = await getSwap(swap, 1);

      swaps[chain][swapId.toString()] = {
        id: swapId.toString(),
        take: take,
        give: give,
      };

      fs.appendFile("./backup/swaps.json", swaps, function (err) {
        if (err) throw err;
        console.log("Update last swap id");
      });
    }

    //listen to the events
    contract[chain].on("SwapTaken", (swapId, takerAddress, fee) => {
      newSwap(swapId.toString());
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
