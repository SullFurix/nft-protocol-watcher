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
  let itemId = 0;
  for (let item in swap.components[side]) {
    /*
      type 0 = ERC1155
      type 1 = ERC721
      type 2 = ERC20
      type 3 = Native Coin
    */
    if (swap.components[side][item].assetType == "0") {
      let snftContract = new ethers.Contract(
        swap.components[side][item].tokenAddress,
        chainData[chainId]["contract"].snftAbi,
        providers[chainId]
      );

      for (let token in swap.components[side][item].tokenIds) {
        itemData[itemId] = {
          type: swap.components[side][item].assetType,
          tokenAddress: swap.components[side][item].tokenAddress,
          tokenURI: ipfsLink(
            await snftContract.uri(
              swap.components[side][item].tokenIds[token].toString()
            )
          ),
          tokenId: swap.components[side][item].tokenIds[token].toString(),
          amounts: swap.components[side][item].amounts[token].toString(),
          metadata: await fetcher(
            ipfsLink(
              await snftContract.uri(
                swap.components[side][item].tokenIds[token].toString()
              )
            )
          ),
        };
        itemId += 1;
      }
    } else if (swap.components[side][item].assetType == "1") {
      let nftContract = new ethers.Contract(
        swap.components[side][item].tokenAddress,
        chainData[chainId]["contract"].nftAbi,
        providers[chainId]
      );
      itemData[itemId] = {
        type: swap.components[side][item].assetType,
        tokenAddress: swap.components[side][item].tokenAddress,
        name: await nftContract.name(),
        symbol: await nftContract.symbol(),
        tokenURI: ipfsLink(
          await nftContract.tokenURI(
            swap.components[side][item].tokenIds[0].toString()
          )
        ),
        tokenId: swap.components[side][item].tokenIds[0].toString(),
        metadata: await fetcher(
          ipfsLink(
            await nftContract.tokenURI(
              swap.components[side][item].tokenIds[0].toString()
            )
          )
        ),
      };
      itemId += 1;
    } else if (swap.components[side][item].assetType == "2") {
      let tokenContract = new ethers.Contract(
        swap.components[side][item].tokenAddress,
        chainData[chainId]["contract"].tokenAbi,
        providers[chainId]
      );

      itemData[itemId] = {
        type: swap.components[side][item].assetType,
        tokenAddress: swap.components[side][item].tokenAddress,
        name: await tokenContract.name(),
        symbol: await tokenContract.symbol(),
        amounts: fromWeiWithDecimals(
          swap.components[side][item].amounts[0].toString(),
          await tokenContract.decimals()
        ),
      };
      itemId += 1;
    } else if (swap.components[side][item].assetType == "3") {
      itemData[itemId] = {
        type: swap.components[side][item].assetType,
        tokenAddress: swap.components[side][item].tokenAddress,
        name: chainData[chainId].nativeCoin.name,
        symbol: chainData[chainId].nativeCoin.name,
        amounts: fromWeiWithDecimals(
          swap.components[side][item].amounts[0].toString(),
          chainData[chainId].nativeCoin.decimals
        ),
      };
      itemId += 1;
    } else {
      console.log(swap.components[side][item].assetType);
      console.log("Unknown asset type");
    }
  }
  return itemData;
}

async function deployMessage(message) {
  if (message === " ") {
    await discordChannel.send("** **");
  } else {
    await discordChannel.send(message);
    //await twitter
  }

  //telegram.sendMessage(channelid, message);
}

async function send(message) {
  let oneLineMessage = "";

  oneLineMessage = oneLineMessage + "New swap (" + message.id + ") \n \n";

  for (info in message.take) {
    oneLineMessage = oneLineMessage + "Take \n \n";
    /*
      type 0 = ERC1155
      type 1 = ERC721
      type 2 = ERC20
      type 3 = Native Coin
    */
    if (message.take[info].type === 0) {
      oneLineMessage = oneLineMessage + "Type: ERC1155 \n";
      oneLineMessage =
        oneLineMessage + "Address: " + message.take[info].tokenAddress + "\n";
      oneLineMessage =
        oneLineMessage + "URI: " + message.take[info].tokenURI + "\n";
      oneLineMessage =
        oneLineMessage + "Token id: " + message.take[info].tokenId + "\n";
      oneLineMessage =
        oneLineMessage + "Amounts : " + message.take[info].amounts + "\n";
      oneLineMessage =
        oneLineMessage +
        "Image: " +
        ipfsLink(message.take[info].metadata.image) +
        "\n";
    } else if (message.take[info].type === 1) {
      oneLineMessage = oneLineMessage + "Type: ERC721 \n";
      oneLineMessage =
        oneLineMessage + "Address: " + message.take[info].tokenAddress + "\n";
      oneLineMessage =
        oneLineMessage + "Name: " + message.take[info].name + "\n";
      oneLineMessage =
        oneLineMessage + "Symbol: " + message.take[info].symbol + "\n";
      oneLineMessage =
        oneLineMessage + "URI: " + message.take[info].tokenURI + "\n";
      oneLineMessage =
        oneLineMessage + "Token id: " + message.take[info].tokenId + "\n";
      oneLineMessage =
        oneLineMessage +
        "Image: " +
        ipfsLink(message.take[info].metadata.image) +
        "\n";
    } else if (message.take[info].type === 2) {
      oneLineMessage = oneLineMessage + "Type: ERC20 \n";
      oneLineMessage =
        oneLineMessage + "Address: " + message.take[info].tokenAddress + "\n";
      oneLineMessage =
        oneLineMessage + "Name: " + message.take[info].name + "\n";
      oneLineMessage =
        oneLineMessage + "Symbol: " + message.take[info].symbol + "\n";
      oneLineMessage =
        oneLineMessage + "Amounts : " + message.take[info].amounts + "\n";
    } else if (message.take[info].type === 3) {
      oneLineMessage = oneLineMessage + "Type: Native \n";
      oneLineMessage =
        oneLineMessage + "Name: " + message.take[info].name + "\n";
      oneLineMessage =
        oneLineMessage + "Symbol: " + message.take[info].symbol + "\n";
      oneLineMessage =
        oneLineMessage + "Amounts : " + message.take[info].amounts + "\n";
    }
  }
  oneLineMessage = oneLineMessage + "\n";

  for (info in message.give) {
    oneLineMessage = oneLineMessage + "Give \n \n";
    /*
      type 0 = ERC1155
      type 1 = ERC721
      type 2 = ERC20
      type 3 = Native Coin
    */
    if (message.give[info].type === 0) {
      oneLineMessage = oneLineMessage + "Type: ERC1155 \n";
      oneLineMessage =
        oneLineMessage + "Address: " + message.give[info].tokenAddress + "\n";
      oneLineMessage =
        oneLineMessage + "URI: " + message.give[info].tokenURI + "\n";
      oneLineMessage =
        oneLineMessage + "Token id: " + message.give[info].tokenId + "\n";
      oneLineMessage =
        oneLineMessage + "Amounts : " + message.give[info].amounts + "\n";
      oneLineMessage =
        oneLineMessage + "Image: " + message.give[info].metadata.image + "\n";
    } else if (message.give[info].type === 1) {
      oneLineMessage = oneLineMessage + "Type: ERC721 \n";
      oneLineMessage =
        oneLineMessage + "Address: " + message.give[info].tokenAddress + "\n";
      oneLineMessage =
        oneLineMessage + "Name: " + message.give[info].name + "\n";
      oneLineMessage =
        oneLineMessage + "Symbol: " + message.give[info].symbol + "\n";
      oneLineMessage =
        oneLineMessage + "URI: " + message.give[info].tokenURI + "\n";
      oneLineMessage =
        oneLineMessage + "Token id: " + message.give[info].tokenId + "\n";
      oneLineMessage =
        oneLineMessage + "Image: " + message.give[info].metadata.image + "\n";
    } else if (message.give[info].type === 2) {
      oneLineMessage = oneLineMessage + "Type: ERC20 \n";
      oneLineMessage =
        oneLineMessage + "Address: " + message.give[info].tokenAddress + "\n";
      oneLineMessage =
        oneLineMessage + "Name: " + message.give[info].name + "\n";
      oneLineMessage =
        oneLineMessage + "Symbol: " + message.give[info].symbol + "\n";
      oneLineMessage =
        oneLineMessage + "Amounts : " + message.give[info].amounts + "\n";
    } else if (message.give[info].type === 3) {
      oneLineMessage = oneLineMessage + "Type: Native \n";
      oneLineMessage =
        oneLineMessage + "Name: " + message.give[info].name + "\n";
      oneLineMessage =
        oneLineMessage + "Symbol: " + message.give[info].symbol + "\n";
      oneLineMessage =
        oneLineMessage + "Amounts : " + message.give[info].amounts + "\n";
    }
  }

  oneLineMessage = oneLineMessage + "\n";

  await deployMessage(oneLineMessage);
}

async function newSwap(chainId, contract, swapId, blockNumber) {
  if (!swaps[chainId][swapId.toString()]) {
    let swap = await contract.swap(swapId.toString());
    let take = await getSwap(chainId, swap, 0);
    let give = await getSwap(chainId, swap, 1);

    swaps[chainId][swapId.toString()] = {
      id: swapId.toString(),
      take: take,
      give: give,
    };

    fs.writeFileSync("./backup/swaps.json", JSON.stringify(swaps, null, 2));

    await send(swaps[chainId][swapId.toString()]);
  } else {
    console.log(
      chainData[chainId].name + " / Swap id: " + "  has already been registered"
    );
  }
}

async function scan(provider, chainId, contract) {
  //scan events in block rang
  let lastScannedBlockNumber = swaps[chainId]["lastScan"].blockNumber;
  let currentBlock = await provider.getBlockNumber();
  let blockGap = currentBlock - lastScannedBlockNumber;

  console.log(
    chainData[chainId].name +
      " / Scanning events from blocks " +
      lastScannedBlockNumber +
      " - " +
      currentBlock
  );

  if (blockGap > chainData[chainId].minBlockRang) {
    // SwapMade contract.filters.SwapMade() or SwapTaken contract.filters.SwapTaken()
    let events = await contract.queryFilter(
      contract.filters.SwapMade(),
      -blockGap
    );

    for (let event in events) {
      blockNumber = events[event].blockNumber;
      // SwapMade args = 4 or SwapTaken args = 0
      swapId = events[event].args[4].toString();
      console.log(chainData[chainId].name + " / New swap id:" + swapId);
      newSwap(chainId, contract, swapId, blockNumber);
    }

    console.log(
      chainData[chainId].name +
        " / Scanned total " +
        events.length +
        " events for " +
        blockGap +
        " blocks"
    );
  }
  swaps[chainId]["lastScan"] = {
    blockNumber: currentBlock,
  };

  fs.writeFileSync("./backup/swaps.json", JSON.stringify(swaps, null, 2));
}

async function listner(provider, chainId, contract) {
  setInterval(function () {
    scan(provider, chainId, contract);
  }, chainData[chainId].pollingInterval);
}

async function main() {
  await setup();

  for (chain in providers) {
    contract[chain] = new ethers.Contract(
      chainData[chain]["contract"].address,
      chainData[chain]["contract"].abi,
      providers[chain]
    );

    listner(providers[chain], chain, contract[chain]);
  }
}

main();
