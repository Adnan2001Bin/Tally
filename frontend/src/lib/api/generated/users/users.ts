import type { User } from "../../models/auth/user";
import { customInstance } from "../../axios-instance";

export type UpdateProfileBody = {
  monthly_budget?: number | null;
};

export type UserDetail = {
  user: User;
};

export const getUsers = () => {
  const getMe = () =>
    customInstance<UserDetail>({
      url: "/users/me",
      method: "GET",
    });

  const updateMe = (body: UpdateProfileBody) =>
    customInstance<UserDetail>({
      url: "/users/me",
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      data: body,
    });

  return { getMe, updateMe };
};
