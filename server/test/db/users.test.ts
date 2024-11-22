/**
 * Test suite for the database code in the `db/featuretags.ts` module.
 */

import { afterAll, beforeAll, describe, expect, test, assert } from "vitest";

import { setupTestDatabase, tearDownTestDatabase } from "../database";
import { Users } from "db";

beforeAll(async () => {
  await setupTestDatabase();
});
afterAll(async () => {
  await tearDownTestDatabase();
});

describe("Users: Create", () => {
  test("Create basic user", async () => {
    const user = await Users.createUser({
      name: "Randy J. Ray",
      email: "rjray@blackperl.com",
      username: "rjray",
      password: "Qml0ZSBtZS4K",
    });

    expect(user.id).toBe(1);
    expect(user.username).toBe("rjray");
  });

  test("Create user with conflicting username", async () => {
    async function failToCreate() {
      return await Users.createUser({
        name: "Randy J. Ray",
        email: "rjray@blackperl.com",
        username: "rjray",
        password: "Qml0ZSBtZS4K",
      });
    }

    expect(() => failToCreate()).rejects.toThrowError("Validation error");
  });
});

describe("Users: Retrieve", () => {
  test("Get all users", async () => {
    const users = await Users.getAllUsers();

    expect(users.length).toBe(1);
    expect(users[0].id).toBe(1);
    expect(users[0].name).toBe("Randy J. Ray");
  });

  test("Get user by ID", async () => {
    const user = await Users.getUserById(1);

    if (user) {
      expect(user.id).toBe(1);
      expect(user.username).toBe("rjray");
    } else {
      assert.fail("No user found");
    }
  });

  test("Get user by username", async () => {
    const user = await Users.getUserByUsername("rjray");

    if (user) {
      expect(user.id).toBe(1);
      expect(user.name).toBe("Randy J. Ray");
    } else {
      assert.fail("No user found");
    }
  });
});

describe("Users: Update", () => {
  test("Update user", async () => {
    const user = await Users.getUserById(1);
    if (user) {
      expect(user.id).toBe(1);
      const result = await Users.updateUserById(1, {
        name: "Randy James Ray",
      });
      if (result) {
        expect(result.id).toBe(1);
        expect(result.name).toBe("Randy James Ray");
      } else {
        assert.fail("No user found (by update)");
      }
    } else {
      assert.fail("No user found");
    }
  });
});

describe("Users: Delete", () => {
  test("Delete user", async () => {
    const result = await Users.deleteUserById(1);
    expect(result).toBe(1);
  });
});
