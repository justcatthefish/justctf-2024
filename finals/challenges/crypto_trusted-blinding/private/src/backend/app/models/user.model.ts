import { DataTypes, Model, Sequelize } from "sequelize";

export class User extends Model {
  id!: number;
  email!: string;
  password!: string;
  verified!: boolean;
  challenge!: string;

  oidcUser!: string;
  oidcKey!: string;
  publicKey!: string;

  blindRsaVariant!: number;
  blindInv!: string;
  blindPreparedMsg!: string;

  poem!: string;
  signature!: string;
  canPublish!: boolean;
}
export type UserType = InstanceType<typeof User>;


export function initUsers(sequelize: Sequelize) {
  User.init({
    email: {
      type: DataTypes.STRING(100)
    },
    password: {
      type: DataTypes.STRING(255)
    },
    verified: {
      type: DataTypes.BOOLEAN
    },
    challenge: {
      type: DataTypes.STRING(255)
    },

    oidcUser: {
      type: DataTypes.STRING(100)
    },
    oidcKey: {
      type: DataTypes.STRING(100)
    },
    publicKey: {
      type: DataTypes.STRING(2048)
    },

    blindRsaVariant: {
      type: DataTypes.INTEGER
    },
    blindInv: {
      type: DataTypes.STRING(6827)
    },
    blindPreparedMsg: {
      type: DataTypes.STRING(1412)
    },

    poem: {
      type: DataTypes.STRING(1024)
    },
    signature: {
      type: DataTypes.STRING(6827)
    },
    canPublish: {
      type: DataTypes.BOOLEAN
    }
  }, {
    sequelize,
    tableName: "users"
  });

  return User;
};
