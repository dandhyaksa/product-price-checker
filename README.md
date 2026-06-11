# Product Price Checker

> **Disclaimer:** For educational and portfolio purposes only. Reverse engineering a platform's internal API may violate their Terms of Service.

Tests and retrieves real-time product pricing via undocumented internal mobile API of a retail platform.

## How it works

1. Sends search query to the internal API with reconstructed mobile headers
2. Returns list of matching products with pricing and discount info
3. Fetches detailed pricing for a selected product by SKU
4. Automated test suite loops through predefined keywords and validates search and detail responses
5. Logs pass/fail per step and saves summary to `output/` folder

Headers were reconstructed by analyzing the platform's mobile app traffic. Minimum required headers identified through iterative reduction in Burp Suite.

## Stack
TypeScript · Bun · Fetch API