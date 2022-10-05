const orderModel = require("../models/orderModel");
const moment = require("moment");

// create order function: POST

async function createOrder(req, res) {
  const body = req.body;

  const total_price = body.items.reduce((prev, curr) => {
    prev += curr.price;
    return prev;
  }, 0);

  const order = await orderModel.create({
    items: body.items,
    created_at: moment().toDate(),
    total_price,
  });

  res.status(201).send(order);
}

const getOrderById = async (req, res, next) => {
  // check for authenticated user
  const authenticatedUser = req.authenticatedUser;

  if (!authenticatedUser) {
    return res.status(403).send({ message: "Forbidden" });
  }

  const orderId = req.params.id;
  const order = await orderModel.findById(orderId);
  if (!order) {
    return res.status(404).json({ status: false, order: null });
  }
  return res.json({ status: true, order });
};

async function getOrders(req, res, next) {
  const authenticatedUser = req.authenticatedUser;

  if (!authenticatedUser) {
    return res
      .status(401)
      .json({ message: "Invalid Authentication Credentials" });
  }

  if (authenticatedUser.role !== "admin") {
    return res.status(401).send({ message: "Unauthorized" });
  }
  let orders;
  const price = req.query.price;
  const date = req.query.date;
  if (price) {
    const value = price == "asc" ? 1 : price == "desc" ? -1 : false;
    if (value) {
      await orderModel
        .find()
        .sort({ total_price: value })
        .then((allOrder) => {
          orders = allOrder;
        })
        .catch((err) => {
          res.status(500).send(err);
        });
    }
  }
  if (date) {
    const value = date == "asc" ? 1 : date == "desc" ? -1 : false;
    if (value) {
      await orderModel
        .find()
        .sort({ created_at: value })
        .then((allOrder) => {
          orders = allOrder;
        })
        .catch((err) => {
          res.status(500).send(err);
        });
    }
  }
  if (!orders) {
    await orderModel
      .find()
      .then((allOrders) => {
        orders = allOrders;
      })
      .catch((err) => {
        res.status(500).send(err);
      });
  }
  res.status(200).send(orders);

  //   pagination

}
async function updateById(req, res) {
  const id = req.params.id;
  const { state } = req.body;

  const order = await orderModel.findById(id);

  if (!order) {
    return res.status(404).json({ status: false, order: null });
  }

  if (state < order.state) {
    return res
      .status(422)
      .json({ status: false, order: null, message: "Invalid operation" });
  }

  order.state = state;

  await order.save();

  res.status(200).send(order);
}

async function deleteOrderById(req, res) {
  const { id } = req.params;

  const order = await orderModel.deleteOne({ _id: id });

  res.status(200).send({
    message: "Order Deleted",
  });
}

module.exports = {
  createOrder,
  getOrderById,
  getOrders,
  updateById,
  deleteOrderById,
};
