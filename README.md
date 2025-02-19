# Huskly Schwab Portfolio

Self-hosted clone of [Google Finance](https://www.google.com/finance), designed for
Charles Schwab customers to help them manage and track their investment portfolios.
You can access the live application at https://portfolio.huskly.finance.

# Features

## Charles Schwab API integration

Allows fetching account details and transaction history from [Charles Schwab](https://www.schwab.com/).

## Asset Search

Search for an asset anywhere with `^+K` or `⌘+K`.

## Google Takeout Portfolio Import

Import your investment portfolios from [Google Takeout](https://takeout.google.com/) by selecting "Google Finance" in the "Takeout Data" section.
Download and decompress the generated zip file.
Select the portfolio JSON files you'd like to import from the `Portfolios` folder.

All data is stored locally on the browser's local storage.

## Real-Time Data

If you have a [Charles Schwab](https://www.schwab.com/) account, you can use [Huskly Finance](https://huskly.finance) to fetch real-time data for equities in your portfolio.
Sign up for a free Huskly account and connect to your Schwab account.
Then, go back to this app and refresh the page. It will automatically fetch the latest data for your portfolio
using the Schwab API.

## Equities, Crypto, and more

Supports equities, crypto, ETFs, mutual funds and more.
Displays a chart with the price history, current price, and percentage change.

## Transaction History

Allows displaying and filtering through all transactions across all accounts.

## Building and running locally

```bash
npm install
```

```bash
npm run dev
```

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## License

MIT License.
