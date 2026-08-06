import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  appInfo: {
    name: "CamisfutMadrid",
    version: "0.4.0",
  },
});
