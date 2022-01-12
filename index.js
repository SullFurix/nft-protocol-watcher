const dotenv = require("dotenv");
dotenv.config();

const { ethers } = require("ethers");
const { PROVIDER, PROVIDER_KEY, CHAIN } = process.env;
