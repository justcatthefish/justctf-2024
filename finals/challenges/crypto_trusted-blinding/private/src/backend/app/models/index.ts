import { config } from "../config/db.config.js";

import { Dialect, Sequelize } from "sequelize";
import { initUsers, User } from "./user.model.js";

const sequelize = new Sequelize(
  config.DB,
  config.USER,
  config.PASSWORD,
  {
    host: config.HOST,
    port: config.PORT,
    dialect: config.dialect as Dialect,
    logging: false,
    pool: {
      max: config.pool.max,
      min: config.pool.min,
      acquire: config.pool.acquire,
      idle: config.pool.idle
    }
  }
);

export const db = {
  user: User,
  sequelize,
};
initUsers(sequelize);
