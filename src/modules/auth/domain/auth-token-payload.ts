export type AuthenticatedUser = {
  id: string;
  email: string;
  roleCode: string;
};

export type AccessTokenPayload = {
  sub: string;
  email: string;
  roleCode: string;
  type: "access";
};
