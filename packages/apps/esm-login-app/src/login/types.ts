export interface SessionResponse {
  authenticated: boolean;
  user: User;
  locale: string;
  allowedLocales: string[];
  sessionLocation: string;
  currentProvider: CurrentProvider;
}

export interface CurrentProvider {
  uuid: string;
  display: string;
  links: Links[];
}

export interface User {
  uuid: string;
  display: string;
  username: string;
  systemId: string;
  userProperties: UserProperties;
  person: Person;
  privileges: Privileges[];
  roles: Roles[];
  links: Links[];
}

export interface Links {
  rel: string;
  uri: string;
  resourceAlias: string;
}

export interface Roles {
  uuid: string;
  display: string;
  name: string;
}

export interface Privileges {
  uuid: string;
  display: string;
  name: string;
}

export interface Person {
  uuid: string;
  display: string;
}

export interface UserProperties {
  loginAttempts: string;
}
