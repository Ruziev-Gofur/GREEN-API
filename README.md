# MAX + GREEN-API chat

Test application built with React and Vite for sending and receiving messages through GREEN-API.

## Getting started

```bash
npm install
npm run dev
```

Open the URL shown in the terminal in your browser.

## Usage

1. Get the `apiUrl`, `idInstance`, and `apiTokenInstance` values for one MAX instance in the GREEN-API console. They must belong to the same instance.
2. Click **Connect GREEN-API** in the app and enter the values. The default MAX URL is `https://api.green-api.com/v3`; if the console shows a different `apiUrl`, use the URL from the console.
3. Enter the recipient’s phone number in international format to create a chat. The number is automatically converted to a chat ID with `@c.us`. You can also enter an existing chat ID directly.
4. Write and send a message. The app sends a `POST` request to the `sendMessage` method.
5. Incoming messages are checked through `receiveNotification` and removed from the queue with `deleteNotification` after being read successfully.

## API behavior

The application uses the following HTTP calls from the GREEN-API documentation:

- `POST /waInstance{idInstance}/sendMessage/{apiTokenInstance}`
- `GET /waInstance{idInstance}/receiveNotification/{apiTokenInstance}?receiveTimeout=5`
- `DELETE /waInstance{idInstance}/deleteNotification/{apiTokenInstance}/{receiptId}`

`apiTokenInstance` is not written to localStorage or cookies; it exists only in the React state of the open page. Before saving a connection, the app verifies the details with a `getStateInstance` request. A `401` response means the token, instance ID, or API URL is invalid.

## Important note

This is a frontend test application. In production, do not expose the API token in the browser; send requests through your own server instead.