const process = require("process");
process.chdir("./EasyPost NodeJS Scripts");

const EasyPost = require("@easypost/api");
const dotenv = require("dotenv");
dotenv.config();
const readline = require("readline");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const { exec } = require("child_process");
const ship = require("./misc.json");

// const client = new EasyPost(process.env.PROD_KEY);
const client = new EasyPost(process.env.TEST_KEY);

let properties = [
  "created_at",
  "messages",
  "status",
  "tracking_code",
  "updated_at",
  "batch_id",
  "batch_status",
  "batch_message",
  "id",
  "order_id",
  "postage_label",
  "tracker",
  "selected_rate",
  "scan_form",
  "usps_zone",
  "refund_status",
  "mode",
  "fees",
  "object",
  "rates",
  "insurance",
  "forms",
  "verifications",
];

let nest = [
  ship.to_address,
  ship.from_address,
  ship.return_address,
  ship.buyer_address,
  ship.parcel,
];

properties.forEach((item) => {
  delete ship[item];
});

nest.forEach((obj) => {
  properties.forEach((item) => {
    delete obj[item];
  });
});

if (ship.customs_info != null) {
  properties.forEach((item) => {
    delete ship.customs_info[item];
  });
  ship["customs_info"]["customs_items"].forEach((custItem) => {
    properties.forEach((item) => {
      delete custItem[item];
    });
  });
}

if (ship["options"]["print_custom"]) {
  delete ship["options"]["print_custom"];
}

try {
  (async () => {
    let shipment = await client.Shipment.create({
      to_address: ship.to_address,
      from_address: ship.from_address,
      parcel: ship.parcel,
      customs_info: ship.customs_info,
      options: ship.options,
      is_return: ship.is_return,
      reference: ship.reference,
      carrier_accounts: ["ca_0bac9dd43e924320a6317a3121390a53"],
      service: "DomesticExpress1200"
    });

    if (shipment.postage_label == null) {
      if (shipment["messages"].length > 0) {
        shipment["messages"].forEach((message) => {
          console.log(message["carrier"] + ": " + message["type"]);
          console.log(message["message"]);
          console.log();
        });
      } else {
        console.log("No rate_errors returned!");
      }

      if (shipment["rates"].length > 0) {
        shipment["rates"].forEach((rate) => {
          console.log(rate["carrier"] + ": " + rate["service"]);
          console.log(rate["rate"] + " - " + rate["id"]);
          console.log();
        });
      } else {
        console.log("No rates returned!");
        console.log(shipment.id);
        process.exit(0);
      }

      rl.question(
        "Please enter the rate you wish to purchase, or press enter to quit: ",
        async (user) => {
          let boughtShipment;
          if (user.includes("rate_")) {
            try {
              boughtShipment = await client.Shipment.buy(
                shipment.id,
                (rate = { id: user })
              );
            } catch (error) {
              console.log(error.code+": "+error.message);
              console.log(shipment.id);
              process.exit(0);
            }
            //data
            exec("open " + boughtShipment.postage_label["label_url"]);
            rl.close();
          } else {
            //data
            process.exit(0);
          }
        }
      );
    } else {
      //data
      exec("open " + shipment.postage_label["label_url"]);
      process.exit(0);
    }
  })();
} catch (error) {
  console.log(error.code+": "+error.message);
  process.exit(0);
}
