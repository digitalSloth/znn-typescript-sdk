# CLI Tool

The ZNN TypeScript SDK includes a command-line interface for common operations and scripting.

---

## Installation

### Global Installation

```bash
npm install -g znn-typescript-sdk
```

After installation, the `znn-cli` command will be available globally:

```bash
znn-cli --help
```

Get help for a specific command:

```bash
znn-cli <command> --help
```

### Using npx (No Installation)

You can run the CLI without installing it globally:

```bash
npx znn-cli --help
```

---

## Wallet Commands

Manage your wallets with the following commands.

### List Wallets

List all wallets in the wallet directory.

```bash
znn-cli wallet list
```

**Options:**
- `--wallet-path <path>` - Custom wallet directory

**Example:**
```bash
znn-cli wallet list \
  --wallet-path /path/to/custom/wallets
```

### Create Wallet

Create a new wallet in the default wallet directory.

```bash
znn-cli wallet create -p <password>
```

**Options:**
- `-p, --password <password>` (required) - Wallet password
- `-n, --name <name>` - Custom wallet name
- `--wallet-path <path>` - Custom wallet directory

**Example:**
```bash
znn-cli wallet create \
  -p myPassword \
  -n my-wallet
```

### Import Wallet

Import a wallet from a mnemonic phrase.

```bash
znn-cli wallet import -m "<word1 word2>" -p <password> 
```

**Options:**
- `-m, --mnemonic <mnemonic>` (required) - 12 or 24-word mnemonic phrase
- `-p, --password <password>` (required) - Wallet password
- `-n, --name <name>` - Custom wallet name
- `--wallet-path <path>` - Custom wallet directory

**Example:**
```bash
znn-cli wallet import \
  -m "word1 word2 ... word24" \
  -p myPassword \
  -n imported-wallet
```

### Export Wallet

Export the mnemonic from a wallet.

```bash
znn-cli wallet export <keyFileName> -p <password>
```

**Options:**
- `-p, --password <password>` (required) - Wallet password
- `--wallet-path <path>` - Custom wallet directory

**Example:**

Export the mnemonic for a wallet named `z1qqjnwjjpnue8xmmpanz6csze6tcmtzzdtfsww7`:
```bash
znn-cli wallet export z1qqjnwjjpnue8xmmpanz6csze6tcmtzzdtfsww7 \
  -p myPassword
```

### Derive Addresses

Derive addresses by index range from a wallet.

```bash
znn-cli wallet derive <keyFileName> <start> <end> -p <password>
```

**Options:**
- `-p, --password <password>` (required) - Wallet password
- `--wallet-path <path>` - Custom wallet directory

**Example:**

Derive addresses starting from index 0 and ending at index 5:
```bash
znn-cli wallet derive z1qqjnwjjpnue8xmmpanz6csze6tcmtzzdtfsww7 0 5 \
  -p myPassword
```

### Copy Wallet

Copy a wallet file to a custom location.

```bash
znn-cli wallet copy <keyFileName> <newPath>
```

**Options:**
- `--wallet-path <path>` - Source wallet directory

**Example:**

Copy a wallet in the default wallet directory to a new location:
```bash
znn-cli wallet copy z1qqjnwjjpnue8xmmpanz6csze6tcmtzzdtfsww7 /path/to/new/location/
```

### Delete Wallet

Permanently delete a wallet keyfile.

```bash
znn-cli wallet delete <keyFileName>
```

**Options:**
- `-f, --force` - Skip confirmation prompt
- `--wallet-path <path>` - Custom wallet directory

**Example:**

Force delete a wallet without the confirmation prompt:
```bash
znn-cli wallet delete z1qqjnwjjpnue8xmmpanz6csze6tcmtzzdtfsww7 -f
```

---

## Transaction Commands

Manage transactions on the Zenon Network.

### Send Transaction

Send tokens to an address.

```bash
znn-cli tx send <recipientAddress> <amount> <tokenStandard> -w <keyFileName> -p <password>
```

**Options:**
- `-w, --wallet <keyFileName>` (required) - Sender wallet key file name
- `-p, --password <password>` (required) - Wallet password
- `-n, --node <url>` - Node URL (default: wss://node.zenonhub.io:35998)
- `-i, --index <index>` - Address derivation index (default: 0)
- `-d, --decimals <decimals>` - Token decimals (default: 8)
- `--wallet-path <path>` - Custom wallet directory

**Note:** You can use `znn` or `qsr` shortcuts instead of full token standards.

**Example:**

Send 10 ZNN to an address:
```bash
znn-cli tx send z1qq9n7fpaqd8lpcljandzmx4xtku9w4ftwyg0mq 10 znn \
  -w z1qqjnwjjpnue8xmmpanz6csze6tcmtzzdtfsww7 \
  -p myPassword
```

Send 10 PP to an address:
```bash
znn-cli tx send z1qq9n7fpaqd8lpcljandzmx4xtku9w4ftwyg0mq 10 zts1hz3ys62vnc8tdajnwrz6pp \
  -w z1qqjnwjjpnue8xmmpanz6csze6tcmtzzdtfsww7 \
  -p myPassword \
  -d 0
```

### Receive Transaction

Receive a transaction by hash.

```bash
znn-cli tx receive <txHash> -w <keyFileName> -p <password>
```

**Options:**
- `-w, --wallet <keyFileName>` (required) - Recipient wallet key file wallet name
- `-p, --password <password>` (required) - Wallet password
- `-n, --node <url>` - Node URL (default: wss://node.zenonhub.io:35998)
- `-i, --index <index>` - Address derivation index (default: 0)
- `--wallet-path <path>` - Custom wallet directory

**Example:**
```bash
znn-cli tx receive 1990034500b60df73def488aa341ef4f65ce65b3fd489ea9cd3f07ed031d3c8a \
  -w z1qqjnwjjpnue8xmmpanz6csze6tcmtzzdtfsww7 \
  -p myPassword
```

### Receive All Transactions

Receive all pending transactions for an address.

```bash
znn-cli tx receiveAll -w <keyFileName> -p <password>
```

**Options:**
- `-w, --wallet <keyFileName>` (required) - Recipient wallet key file wallet name
- `-p, --password <password>` (required) - Wallet password
- `-n, --node <url>` - Node URL (default: wss://node.zenonhub.io:35998)
- `-i, --index <index>` - Address derivation index (default: 0)
- `--wallet-path <path>` - Custom wallet directory

**Example:**
```bash
znn-cli tx receiveAll \
  -w z1qqjnwjjpnue8xmmpanz6csze6tcmtzzdtfsww7 \
  -p myPassword
```

### Auto-receive Transactions

Automatically receive all incoming transactions as they are broadcast.

```bash
znn-cli tx autoReceive -w <keyFileName> -p <password>
```

**Options:**
- `-w, --wallet <keyFileName>` (required) - Recipient wallet key file wallet name
- `-p, --password <password>` (required) - Wallet password
- `-n, --node <url>` - Node URL (default: wss://node.zenonhub.io:35998)
- `-i, --index <index>` - Address derivation index (default: 0)
- `--wallet-path <path>` - Custom wallet directory

**Example:**
```bash
znn-cli tx autoReceive \
  -w z1qqjnwjjpnue8xmmpanz6csze6tcmtzzdtfsww7 \
  -p myPassword
```

---

## Development

If you're developing the SDK and want to test the CLI:

```bash
# Clone the repository
git clone https://github.com/digitalSloth/znn-typescript-sdk.git
cd znn-typescript-sdk

# Install dependencies
npm install

# Now you can use znn-cli via the dev command
npm run cli:dev -- --help
```

---

## Troubleshooting

### Command not found

If `znn-cli` is not found after global installation:

1. Check if npm global bin is in your PATH:
```bash
npm config get prefix
```

2. Add npm global bin to PATH (if needed):
```bash
# Add to ~/.bashrc or ~/.zshrc
export PATH="$PATH:$(npm config get prefix)/bin"
```

3. Verify installation:
```bash
which znn-cli
```

### Permission errors

On Unix systems, you may need to use sudo:

```bash
sudo npm install -g znn-typescript-sdk
```

Or configure npm to install globally without sudo:

```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

---

## Next Steps

- **[Examples](./examples.md)** – Complete working examples
- **[API Overview](./api-overview.md)** – All API methods & Embedded Contract Calls
- **[Utilities](./utilities.md)** – Utilities and constants for common tasks
- **[Wallet Management](./wallet.md)** – Creating and managing wallets
- **[Building WASM](./build-wasm.md)** – Rebuilding the PoW module from source
