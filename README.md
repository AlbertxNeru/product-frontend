# Product Management Frontend

React + Vite frontend for Laboratory Exercise No. 6.

## Run locally

```bash
npm install
npm run dev
```

The frontend uses the backend URL from `.env`:

```env
VITE_API_URL=http://127.0.0.1:3000
```

If your LavaLust server runs on another port, update this value and restart Vite.

## Features

- Login
- Optional account creation for initial setup
- Authenticated product list
- Add product
- Edit product
- Delete product
- Search products
- Logout
- Axios Bearer token handling
- Automatic access-token refresh

## Build

```bash
npm run build
```

For deployment, set `VITE_API_URL` to the deployed Render API URL before building.
