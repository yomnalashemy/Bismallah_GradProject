import {config} from "dotenv";
// eslint-disable-next-line no-undef
config ({path: `.env.${process.env.NODE_ENV || "development"}.local`});
// eslint-disable-next-line no-undef
export const {PORT, NODE_ENV, DB_URI, JWT_SECRET, JWT_EXPIRES_IN, EMAIL_USER, EMAIL_PASS, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET} = process.env;