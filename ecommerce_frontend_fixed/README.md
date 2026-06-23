# Ecommerce Frontend

HTML, CSS, and JavaScript frontend for a FastAPI ecommerce backend.

## Backend

Default API URL:

```text
http://127.0.0.1:8000
```

Change it in `js/config/api-config.js` or run:

```js
localStorage.setItem("apiBaseUrl", "http://127.0.0.1:8000");
```

## Main endpoints used

- `POST /auth/register`
- `POST /auth/login`
- `GET /products`
- `POST /products`
- `PUT /products/{id}`
- `POST /cart`
- `GET /orders`
- `POST /orders`
- `POST /chatbot`

The frontend includes fallback product/order data so pages still render when the backend is not running.

## Run frontend

Because this project uses JavaScript modules, run it with any local static server instead of opening files directly.

Example:

```bash
python -m http.server 5500
```

Then open:

```text
http://127.0.0.1:5500
```
