# Milkimom Backend API

Express + Mongoose (MongoDB Atlas) backend, organized in the model / routes / controller pattern.

## Structure

```
server/
├── index.js                  # App entry: express setup, CORS, routes, error handling
├── config/
│   └── db.js                 # MongoDB connection (mongoose)
├── models/
│   └── Order.js              # Order schema/model
├── controllers/
│   ├── orderController.js    # Order CRUD logic
│   └── smsController.js      # SMS sending logic (OTP / confirmations)
├── routes/
│   ├── orderRoutes.js        # /api/orders
│   └── smsRoutes.js          # /api/sms
├── middleware/
│   └── errorHandler.js       # 404 + centralized error handler
└── utils/
    ├── phone.js              # BD phone normalize / mask / validate
    └── sms.js                # BD Bulk SMS client + OTP rate limiter
```

## Setup

```bash
cd server
npm install
npm run dev     # development (nodemon)
npm start       # production
```

Copy `.env.example` to `.env` and fill in `MONGO_URI` and `BD_SMS_TOKEN`.

## API Endpoints

| Method | Endpoint                 | Description                                        |
| ------ | ------------------------ | -------------------------------------------------- |
| GET    | `/api/health`            | Health check                                       |
| POST   | `/api/orders`            | Create order                                       |
| GET    | `/api/orders`            | List orders (`?status=&phone=&page=&limit=`)       |
| GET    | `/api/orders/:id`        | Get single order                                   |
| PATCH  | `/api/orders/:id/status` | Update status (Pending/Confirmed/Shipped/Delivered/Cancelled) |
| DELETE | `/api/orders/:id`        | Delete order                                       |
| POST   | `/api/sms/send`          | Send SMS (`purpose`: `otp`, `customer_confirmation`, `admin_notification`) |

### SMS protections

- `otp`: rate limited to 3 sends per phone per 15 minutes (in-memory).
- `customer_confirmation`: requires a matching order for that phone within the last 15 minutes.
- `admin_notification`: requires any order saved within the last 15 minutes.

## Frontend integration

The frontend base URL lives in `src/config/api.ts` and is driven by `VITE_API_BASE_URL`
in the root `.env` (defaults to `http://localhost:5000`). All calls go through the
typed client in `src/lib/api.ts` (`saveOrder`, `getOrders`, `getOrderById`,
`updateOrderStatus`, `sendSms`).
