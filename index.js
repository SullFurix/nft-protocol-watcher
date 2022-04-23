const dotenv = require("dotenv");
dotenv.config();

const { ethers } = require("ethers");

const Telegram = require("node-telegram-bot-api");
const Discord = require("discord.js");

const fetch = require("node-fetch");
const fs = require("fs");

const config = require("./constants/config.js");

let swaps = require("./backup/swaps.json");

const supportedChainId = config.supportedChainId;
const allSupportedChainIds = config.allSupportedChainIds;
const chainData = config.chainIdInfo;

//import .env options
const {
  PROVIDER,
  PROVIDER_KEY,
  CHAIN,
  DISCORD_KEY,
  TELEGRAM_KEY,
  DISCORD_ID,
} = process.env;

let providers = {};
let contract = {};

let discord, telegram, discordChannel;

async function setup() {
  //verify all env data
  if (!CHAIN) throw new Error("CHAIN is required in .env");
  if (!PROVIDER) throw new Error("PROVIDER is required in .env");
  if (!PROVIDER_KEY) throw new Error("PROVIDER_KEY is required in .env");

  if (!DISCORD_KEY) throw new Error("DISCORD_KEY is required in .env");
  if (!DISCORD_ID) throw new Error("DISCORD_ID is required in .env");
  //if (!TELEGRAM_KEY) throw new Error("TELEGRAM_KEY is required in .env");

  console.log("chain: " + CHAIN);
  console.log("provider: " + PROVIDER);
  console.log("provider key: " + PROVIDER_KEY);
  console.log("discord key: " + DISCORD_KEY);
  console.log("discord channel id: " + DISCORD_ID);
  //console.log("telegram key: " + TELEGRAM_KEY + "\n");

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
      if (!swaps[chain]) {
        swaps[chain] = {};
        fs.writeFileSync("./backup/swaps.json", JSON.stringify(swaps, null, 2));
      }
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

  //telegram = new Telegram(DISCORD_KEY, {polling: true});
  discord = new Discord.Client({
    intents: [
      Discord.Intents.FLAGS.GUILDS,
      Discord.Intents.FLAGS.GUILD_MESSAGES,
    ],
  });
  await discord.login(DISCORD_KEY);
  discordChannel = await discord.channels.fetch(DISCORD_ID);
}

//convert uint to decimals
function fromWeiWithDecimals(amount, decimals) {
  return amount / Math.pow(10, decimals);
}

//convert decimals to uint
function toWeiWithDecimals(amount, decimals) {
  return amount * Math.pow(10, decimals);
}

async function fetcher(link) {
  let res = undefined;
  try {
    res = await fetch(link);
    res = res.json();
  } catch (e) {
    const res = undefined;
  }
  return res;
}

function ipfsLink(link) {
  let finalLink;
  if (link.substring(0, 4) == "ipfs") {
    finalLink = "https://ipfs.io/ipfs/" + link.substring(7);
  } else if (link.substring(0, 4) == "http") {
    finalLink = link;
  }
  return finalLink;
}
async function getSwap(chainId, swap, side) {
  let itemData = {};
  for (let item in swap.components[side]) {
    if (swap.components[side][item].assetType == "0") {
      let snftContract = new ethers.Contract(
        swap.components[side][item].tokenAddress,
        chainData[chainId]["contract"].snftAbi,
        providers[chainId]
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
        chainData[chainId]["contract"].nftAbi,
        providers[chainId]
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
        chainData[chainId]["contract"].tokenAbi,
        providers[chainId]
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
        name: chainData[chainId].nativeCoin.name,
        symbol: chainData[chainId].nativeCoin.name,
        amounts: fromWeiWithDecimals(
          swap.components[side][item].amounts[0].toString(),
          chainData[chainId].nativeCoin.decimals
        ),
      };
    } else {
      console.log(swap.components[side][item].assetType);
      console.log("Unknown asset type");
    }
  }
  return itemData;
}

async function send(message) {
  await discordChannel.send(message);

  //telegram.sendMessage(channelid, message);
}

async function newSwap(chainId, contract, swapId) {
  let swap = await contract.swap(swapId.toString());
  let take = await getSwap(chainId, swap, 0);
  let give = await getSwap(chainId, swap, 1);

  swaps[chainId][swapId.toString()] = {
    id: swapId.toString(),
    take: take,
    give: give,
  };

  swaps[chainId]["lastSwap"] = {
    id: swapId.toString(),
    blockNumber: "1",
  };

  fs.writeFileSync("./backup/swaps.json", JSON.stringify(swaps, null, 2));

  await send(swaps[chainId][swapId.toString()]);
}

async function listner(chainId, contract) {
  //listen to the events
  contract.on("SwapTaken", function swap(swapId) {
    newSwap(chainId, contract, swapId);
  });
}

async function main() {
  await setup();

  for (chain in providers) {
    contract[chain] = new ethers.Contract(
      chainData[chain]["contract"].address,
      chainData[chain]["contract"].abi,
      providers[chain]
    );

    listner(chain, contract[chain]);
  }

  /*
    if (metadata.image.substring(0, 4) == "ipfs") {
      image = "https://ipfs.io/ipfs/" + metadata.image.substring(7);
    } else if (metadata.image.substring(0, 4) == "http") {
      image = metadata.image;
    }

    if (chain == 3) {
      let swapId = 15;

    let swap = await contract[chain].swap(swapId);

    let take = await getSwap(swap, 0);

    let give = await getSwap(swap, 1);

    swaps[chain][swapId] = {
      id: swapId,
    take: take,
    give: give,
      };

    swaps[chain]["lastSwapId"] = swapId;

    fs.writeFileSync("./backup/swaps.json", JSON.stringify(swaps, null, 2));

    }

    console.log(
    contract
    .queryFilter("SwapTaken", {fromBlock: 0, toBlock: "latest" })
        .then((events) => console.log(events))
    );

    let eventFilter = contract[chain].filters.SwapTaken();
    let events = await contract[chain].queryFilter(eventFilter, -1000);

    for (let lock in events) {
      console.log(events[lock]);
    }


    //listen to the events
    contract[chain].on("SwapTaken", (swapId) => {
      //newSwap(swapId);
    });


    // poll "Sync" events for reference
    provider.on("block", blockNumber => {
      setImmediate(async () => {
        const filter = contract.filters["Sync"]();
        const events = await contract.queryFilter(filter, blockNumber);
        const data = events.map(e => [
          e.args?.reserve0.toString(),
          e.args?.reserve1.toString()
        ]);
        console.log(">>> poll", blockNumber, data);
      })
    })
    */
}

main();
