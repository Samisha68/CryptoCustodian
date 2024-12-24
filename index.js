"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var telegraf_1 = require("telegraf");
var web3_js_1 = require("@solana/web3.js");
var dotenv = require("dotenv");
dotenv.config();
var bot = new telegraf_1.Telegraf(process.env.TELEGRAM_BOT_TOKEN);
var userWallets = new Map();
// Initialize Solana connection
var connection = new web3_js_1.Connection('https://api.mainnet-beta.solana.com', 'confirmed');
// Create keyboards
var welcomeKeyboard = telegraf_1.Markup.inlineKeyboard([
    [telegraf_1.Markup.button.callback('🔗 Connect Wallet', 'connect_wallet')],
    [telegraf_1.Markup.button.callback('❓ Help', 'help')]
]);
var mainKeyboard = telegraf_1.Markup.inlineKeyboard([
    [
        telegraf_1.Markup.button.callback('💰 Check Balance', 'check_balance'),
        telegraf_1.Markup.button.callback('💸 Send SOL', 'send_sol')
    ],
    [telegraf_1.Markup.button.callback('❓ Help', 'help')]
]);
// Validate Solana address
function isValidSolanaAddress(address) {
    try {
        var publicKey = new web3_js_1.PublicKey(address);
        var isOnCurve = web3_js_1.PublicKey.isOnCurve(publicKey.toBytes());
        return isOnCurve;
    }
    catch (_a) {
        return false;
    }
}
// Start command
bot.command('start', function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
    var welcomeMsg;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                welcomeMsg = "\nWelcome to Solana Wallet Bot! \uD83C\uDF1F\n\nThis bot can help you:\n\u2022 Check your wallet balance\n\u2022 Send SOL to other addresses\n\u2022 Manage your Solana wallet\n\nFirst, connect your wallet to begin!";
                return [4 /*yield*/, ctx.reply(welcomeMsg, welcomeKeyboard)];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
// Connect wallet button handler
bot.action('connect_wallet', function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, ctx.answerCbQuery()];
            case 1:
                _a.sent();
                return [4 /*yield*/, ctx.reply('Please send your Solana wallet address')];
            case 2:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
// Handle wallet address
bot.on('text', function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
    var address, userId, publicKey, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                address = ctx.message.text;
                userId = ctx.from.id;
                if (!(address.length > 30 && address.length < 50)) return [3 /*break*/, 7];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 5, , 7]);
                if (!!isValidSolanaAddress(address)) return [3 /*break*/, 3];
                return [4 /*yield*/, ctx.reply('❌ Invalid Solana address. Please check and try again.')];
            case 2:
                _a.sent();
                return [2 /*return*/];
            case 3:
                publicKey = new web3_js_1.PublicKey(address);
                userWallets.set(userId, { address: address, publicKey: publicKey });
                return [4 /*yield*/, ctx.reply("\n\u2705 Wallet connected successfully!\n\nYour wallet: ".concat(address, "\n\nWhat would you like to do?"), mainKeyboard)];
            case 4:
                _a.sent();
                return [3 /*break*/, 7];
            case 5:
                error_1 = _a.sent();
                return [4 /*yield*/, ctx.reply('❌ Error connecting wallet. Please try again.')];
            case 6:
                _a.sent();
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); });
// Check balance handler
bot.action('check_balance', function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, userWallet, balance, solBalance, error_2;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 7, , 9]);
                return [4 /*yield*/, ctx.answerCbQuery()];
            case 1:
                _b.sent();
                userId = (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id;
                if (!(!userId || !userWallets.has(userId))) return [3 /*break*/, 3];
                return [4 /*yield*/, ctx.reply('Please connect your wallet first!', welcomeKeyboard)];
            case 2:
                _b.sent();
                return [2 /*return*/];
            case 3:
                userWallet = userWallets.get(userId);
                return [4 /*yield*/, ctx.reply('Checking balance...')];
            case 4:
                _b.sent();
                return [4 /*yield*/, connection.getBalance(userWallet.publicKey)];
            case 5:
                balance = _b.sent();
                solBalance = balance / web3_js_1.LAMPORTS_PER_SOL;
                return [4 /*yield*/, ctx.reply("\n\uD83D\uDCB0 Wallet Balance:\n".concat(solBalance.toFixed(4), " SOL\n\nWallet Address:\n").concat(userWallet.address), mainKeyboard)];
            case 6:
                _b.sent();
                return [3 /*break*/, 9];
            case 7:
                error_2 = _b.sent();
                console.error('Balance check error:', error_2);
                return [4 /*yield*/, ctx.reply('❌ Error checking balance. Please try again.', mainKeyboard)];
            case 8:
                _b.sent();
                return [3 /*break*/, 9];
            case 9: return [2 /*return*/];
        }
    });
}); });
// Send SOL handler
bot.action('send_sol', function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
    var userId;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, ctx.answerCbQuery()];
            case 1:
                _b.sent();
                userId = (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id;
                if (!(!userId || !userWallets.has(userId))) return [3 /*break*/, 3];
                return [4 /*yield*/, ctx.reply('Please connect your wallet first!', welcomeKeyboard)];
            case 2:
                _b.sent();
                return [2 /*return*/];
            case 3: return [4 /*yield*/, ctx.reply("\nTo send SOL, use this format:\n/send <receiver_address> <amount>\n\nExample:\n/send 7hoR... 0.1\n\nNote: This will prepare the transaction for you to sign.", mainKeyboard)];
            case 4:
                _b.sent();
                return [2 /*return*/];
        }
    });
}); });
// Help handler
bot.action('help', function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
    var helpMsg;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, ctx.answerCbQuery()];
            case 1:
                _a.sent();
                helpMsg = "\nHow to use this bot:\n\n1\uFE0F\u20E3 First, connect your wallet:\n   \u2022 Click \"Connect Wallet\"\n   \u2022 Send your Solana address\n\n2\uFE0F\u20E3 Then you can:\n   \u2022 Check your balance\n   \u2022 Prepare SOL transfers\n   \u2022 View wallet info\n\n\uD83D\uDCDD Commands:\n/start - Start the bot\n/help - Show this help message\n\nNeed assistance? Contact @YourSupportHandle";
                return [4 /*yield*/, ctx.reply(helpMsg, mainKeyboard)];
            case 2:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
// Error handler
bot.catch(function (err) {
    console.error('Bot error:', err);
});
// Start bot
bot.launch()
    .then(function () { return console.log('✅ Bot is running!'); })
    .catch(function (err) { return console.error('Failed to start bot:', err); });
// Enable graceful stop
process.once('SIGINT', function () { return bot.stop('SIGINT'); });
process.once('SIGTERM', function () { return bot.stop('SIGTERM'); });
