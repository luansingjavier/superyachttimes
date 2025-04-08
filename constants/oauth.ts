import Constants from "expo-constants";

export const CLIENT_ID = Constants.expoConfig?.extra?.CLIENT_ID;
export const REDIRECT_URI = Constants.expoConfig?.extra?.REDIRECT_URI;

export const ENDPOINTS = {
  authorizationEndpoint: Constants.expoConfig?.extra?.AUTHORIZATION_ENDPOINT,
  tokenEndpoint: Constants.expoConfig?.extra?.TOKEN_ENDPOINT,
  refreshTokenEndpoint: Constants.expoConfig?.extra?.REFRESH_TOKEN_ENDPOINT,
};

export const SCOPES = Constants.expoConfig?.extra?.SCOPES?.split(" ") || [];
