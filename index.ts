import { Telegraf, Markup } from 'telegraf';
import { 
  Connection, 
  PublicKey, 
  LAMPORTS_PER_SOL,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  Keypair
} from '@solana/web3.js';
import { SolanaAgentKit } from 'solana-agent-kit';
import * as dotenv from 'dotenv';
import bs58 from 'bs58';

dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

// Initialize Solana connection
const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

// Initialize SolanaAgentKit
const solanaKit = new SolanaAgentKit(
  process.env.SOLANA_PRIVATE_KEY!,
  'https://api.mainnet-beta.solana.com',
  process.env.OPENAI_API_KEY!
);

// Interfaces
interface TokenData {
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  twitter?: string;
  telegram?: string;
  website?: string;
  initialLiquiditySOL?: number;
}

interface UserState {
  step: string;
  tokenData: Partial<TokenData>;
}

// Store user states
const userStates = new Map<number, UserState>();

// Keyboards
const mainKeyboard = Markup.inlineKeyboard([
  [
    Markup.button.callback('💰 Check Balance', 'check_balance'),
    Markup.button.callback('💸 Send SOL', 'send_sol')
  ],
  [
    Markup.button.callback('🪙 Create Token', 'create_token'),
    Markup.button.callback('❓ Help', 'help')
  ]
]);

// Validate Solana address
function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

// Start command
bot.command('start', async (ctx) => {
  const welcomeMsg = `
Welcome to Solana Token Bot! 🌟

I can help you:
• Check SOL balance
• Send SOL to any address
• Create your own token

Use the buttons below to get started!`;

  await ctx.reply(welcomeMsg, mainKeyboard);
});

// Balance command
bot.command('balance', async (ctx) => {
  try {
    const address = ctx.message.text.split(' ')[1];
    
    if (!address) {
      await ctx.reply('Please provide a wallet address.\nExample: /balance <address>');
      return;
    }

    if (!isValidSolanaAddress(address)) {
      await ctx.reply('Invalid Solana address. Please check and try again.');
      return;
    }

    const publicKey = new PublicKey(address);
    const balance = await connection.getBalance(publicKey);
    const solBalance = balance / LAMPORTS_PER_SOL;

    await ctx.reply(`
💰 Wallet Balance:
${solBalance.toFixed(4)} SOL

Address:
${address}`, mainKeyboard);

  } catch (error) {
    console.error('Balance check error:', error);
    await ctx.reply('Error checking balance. Please try again.');
  }
});

// Send command
bot.command('send', async (ctx) => {
  try {
    const parts = ctx.message.text.split(' ');
    if (parts.length !== 3) {
      await ctx.reply('Please use format: /send <to_address> <amount>');
      return;
    }

    const toAddress = parts[1];
    const amount = parseFloat(parts[2]);

    if (!isValidSolanaAddress(toAddress)) {
      await ctx.reply('Invalid recipient address. Please check and try again.');
      return;
    }

    if (isNaN(amount) || amount <= 0) {
      await ctx.reply('Please provide a valid amount greater than 0.');
      return;
    }

    const privateKeyUint8 = bs58.decode(process.env.SOLANA_PRIVATE_KEY!);
    const fromKeypair = Keypair.fromSecretKey(privateKeyUint8);
    const toPublicKey = new PublicKey(toAddress);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: fromKeypair.publicKey,
        toPubkey: toPublicKey,
        lamports: amount * LAMPORTS_PER_SOL
      })
    );

    await ctx.reply('Processing transfer...');
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [fromKeypair]
    );

    await ctx.reply(`
✅ Transfer successful!

Amount: ${amount} SOL
To: ${toAddress}
Signature: ${signature}

View on Solana Explorer:
https://solscan.io/tx/${signature}`, mainKeyboard);

  } catch (error) {
    console.error('Transfer error:', error);
    await ctx.reply('Error making transfer. Please try again.');
  }
});

// Token creation flow
bot.action('create_token', async (ctx) => {
  await ctx.answerCbQuery();
  const userId = ctx.from?.id;
  if (!userId) return;

  userStates.set(userId, { 
    step: 'awaiting_token_name',
    tokenData: {}
  });
  
  await ctx.reply(`
Let's create your token! 🪙

Please enter your token name (e.g., "My Amazing Token")`);
});

// Handle text messages for token creation
bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const userState = userStates.get(userId);
  const text = ctx.message.text;

  if (!userState) return;

  switch (userState.step) {
    case 'awaiting_token_name':
      userState.tokenData.name = text;
      userState.step = 'awaiting_token_symbol';
      await ctx.reply('Great! Now enter your token symbol (e.g., "MAT")');
      break;

    case 'awaiting_token_symbol':
      userState.tokenData.symbol = text;
      userState.step = 'awaiting_description';
      await ctx.reply('Enter a description for your token:');
      break;

    case 'awaiting_description':
      userState.tokenData.description = text;
      userState.step = 'awaiting_image_url';
      await ctx.reply('Enter the URL for your token image (must be a direct image URL):');
      break;

    case 'awaiting_image_url':
      userState.tokenData.imageUrl = text;
      userState.step = 'awaiting_twitter';
      await ctx.reply('Enter your Twitter handle (or type "skip"):');
      break;

    case 'awaiting_twitter':
      if (text !== 'skip') userState.tokenData.twitter = text;
      userState.step = 'awaiting_telegram';
      await ctx.reply('Enter your Telegram handle (or type "skip"):');
      break;

    case 'awaiting_telegram':
      if (text !== 'skip') userState.tokenData.telegram = text;
      userState.step = 'awaiting_website';
      await ctx.reply('Enter your website URL (or type "skip"):');
      break;

    case 'awaiting_website':
      if (text !== 'skip') userState.tokenData.website = text;
      userState.step = 'awaiting_liquidity';
      await ctx.reply('Enter initial liquidity in SOL (e.g., "1.5") or type "skip" for default:');
      break;

    case 'awaiting_liquidity':
      try {
        const tokenData = userState.tokenData;
        if (text !== 'skip') {
          const liquidity = parseFloat(text);
          if (!isNaN(liquidity) && liquidity > 0) {
            tokenData.initialLiquiditySOL = liquidity;
          }
        }

        await ctx.reply('Creating your token... Please wait.');

        const result = await solanaKit.launchPumpFunToken(
          tokenData.name!,
          tokenData.symbol!,
          tokenData.description!,
          tokenData.imageUrl!,
          {
            twitter: tokenData.twitter,
            telegram: tokenData.telegram,
            website: tokenData.website,
            initialLiquiditySOL: tokenData.initialLiquiditySOL || 1
          }
        );

        await ctx.reply(`
✅ Token created successfully!

Name: ${tokenData.name}
Symbol: ${tokenData.symbol}
Mint Address: ${result.mint}
Transaction: ${result.signature}
Metadata URI: ${result.metadataUri}

View on Explorer:
https://solscan.io/tx/${result.signature}`, mainKeyboard);

        // Clear user state
        userStates.delete(userId);
      } catch (error) {
        console.error('Token creation error:', error);
        await ctx.reply(`❌ Error creating token: ${error}`, mainKeyboard);
        userStates.delete(userId);
      }
      break;
  }
});

// Button handlers
bot.action('check_balance', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('To check balance, use:\n/balance <address>');
});

bot.action('send_sol', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('To send SOL, use:\n/send <to_address> <amount>');
});

bot.action('help', async (ctx) => {
  await ctx.answerCbQuery();
  const helpMsg = `
How to use this bot:

1️⃣ Commands:
/balance <address> - Check wallet balance
/send <address> <amount> - Send SOL

2️⃣ Create Token:
Click the "Create Token" button and follow the steps

3️⃣ Tips:
• Make sure you have enough SOL for transactions
• Double-check addresses before sending
• Keep your private keys safe

Need help? Contact @YourSupportHandle`;
  await ctx.reply(helpMsg, mainKeyboard);
});

// Error handler
bot.catch((err: any) => {
  console.error('Bot error:', err);
});

// Start bot
bot.launch()
  .then(() => console.log('✅ Bot is running!'))
  .catch(err => console.error('Failed to start bot:', err));

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));